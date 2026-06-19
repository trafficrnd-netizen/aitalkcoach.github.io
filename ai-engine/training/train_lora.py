"""
LoRA Fine-tuning 스크립트 for AI톡 코치
한국어 커플 상담 특화 모델 학습

사용법:
    python train_lora.py

Colab에서 실행하거나, 로컬 GPU 환경에서 실행.
"""

import json
import os
import sys
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

import torch
from datasets import Dataset
from peft import LoraConfig, get_peft_model, TaskType
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
    set_seed,
)

# ===== 설정 =====
@dataclass
class TrainingConfig:
    """훈련 설정"""
    # 모델
    model_name: str = "meta-llama/Llama-3.2-3B-Instruct"
    model_name: str = "meta-llama/Llama-3.2-3B-Instruct"  # Colab T4에서 돌아감
    load_in_8bit: bool = False  # True면 8bit 양자화 (메모리 절약)
    
    # LoRA 설정
    lora_r: int = 16
    lora_alpha: int = 32
    lora_dropout: float = 0.05
    lora_target_modules: list = field(default_factory=lambda: [
        "q_proj", "v_proj", "k_proj", "o_proj", 
        "gate_proj", "up_proj", "down_proj"
    ])
    
    # 훈련
    output_dir: str = "./ai-engine/training/output/lora"
    num_train_epochs: int = 10
    per_device_train_batch_size: int = 2
    gradient_accumulation_steps: int = 4
    learning_rate: float = 3e-4
    warmup_ratio: float = 0.1
    weight_decay: float = 0.01
    max_grad_norm: float = 1.0
    logging_steps: int = 5
    save_steps: int = 50
    eval_steps: int = 50
    save_total_limit: int = 3
    
    # 시드
    seed: int = 42
    
    # 메모리 최적화
    gradient_checkpointing: bool = True
    optim: str = "paged_adamw_8bit"  # 8bit AdamW (메모리 절약)


def format_instruction(example: dict) -> str:
    """대화 분석 명령어 형식化为 llama chat template"""
    
    category = example.get("analysis_type", "comprehensive")
    
    # 카테고리별 시스템 프롬프트
    system_prompts = {
        "emotion": "당신은 20년 경력의 커플 상담사입니다. 다음 대화의 감정/분위기를 분석해주세요.",
        "interest": "당신은 20년 경력의 커플 상담사입니다. 상대방의 관심도를 분석해주세요.",
        "replies": "당신은 20년 경력의 커플 상담사입니다. 상황에 맞는 답장을 추천해주세요.",
        "advice": "당신은 20년 경력의 커플 상담사입니다. 대화 방식의 개선점을 조언해주세요.",
        "comprehensive": "당신은 20년 경력의 커플 상담사입니다. 대화를 종합적으로 분석해주세요.",
    }
    
    system = system_prompts.get(category, system_prompts["comprehensive"])
    
    conversation = example["conversation"].strip()
    response_json = json.dumps(example["response"], ensure_ascii=False)
    explanation = example.get("explanation", "")
    
    # Llama 3.1 chat template 형식
    text = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

{system}

응답은 반드시 JSON 형식으로 작성해주세요.<|eot_id|><|start_header_id|>user<|end_header_id|>

[대화]
{conversation}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

{response_json}

[분석]
{explanation}<|eot_id|>"""
    
    return text


def load_dataset(data_path: str) -> Dataset:
    """JSON 데이터셋 로드"""
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Dataset으로 변환
    dataset = Dataset.from_list(data)
    
    # Instruction formatting 적용
    dataset = dataset.map(
        lambda x: {"text": format_instruction(x)},
        remove_columns=dataset.column_names,
    )
    
    print(f"Dataset loaded: {len(dataset)} examples")
    print(f"Sample:\n{dataset[0]['text'][:500]}...")
    
    return dataset


def tokenize_function(examples, tokenizer, max_length: int = 2048):
    """토큰화"""
    return tokenizer(
        examples["text"],
        truncation=True,
        max_length=max_length,
        padding="max_length",
        return_tensors=None,
    )


def create_lora_model(config: TrainingConfig):
    """LoRA 모델 생성"""
    print(f"Loading model: {config.model_name}")
    
    tokenizer = AutoTokenizer.from_pretrained(config.model_name)
    tokenizer.pad_token = tokenizer.eos_token
    
    # 모델 로드
    if config.load_in_8bit:
        from transformers import BitsAndBytesConfig
        quantization_config = BitsAndBytesConfig(
            load_in_8bit=True,
            llm_int8_threshold=6.0,
            llm_int8_has_fp16_weight=False,
        )
        model = AutoModelForCausalLM.from_pretrained(
            config.model_name,
            quantization_config=quantization_config,
            device_map="auto",
            trust_remote_code=True,
        )
    else:
        model = AutoModelForCausalLM.from_pretrained(
            config.model_name,
            torch_dtype=torch.bfloat16,
            device_map="auto",
            trust_remote_code=True,
        )
    
    # LoRA 설정
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=config.lora_r,
        lora_alpha=config.lora_alpha,
        lora_dropout=config.lora_dropout,
        target_modules=config.lora_target_modules,
        bias="none",
        inference_mode=False,
    )
    
    # LoRA 적용
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    return model, tokenizer


def train(config: TrainingConfig):
    """훈련 실행"""
    set_seed(config.seed)
    
    # 출력 디렉토리
    Path(config.output_dir).mkdir(parents=True, exist_ok=True)
    
    # 모델 & 토크나이저
    model, tokenizer = create_lora_model(config)
    
    # 데이터셋
    script_dir = Path(__file__).parent
    data_path = script_dir / "korean_counseling_dataset.json"
    dataset = load_dataset(str(data_path))
    
    # 토큰화
    dataset = dataset.map(
        lambda x: tokenize_function(x, tokenizer),
        batched=False,
        remove_columns=["text"],
    )
    
    # 데이터 콜레이터
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False,  # Causal LM
    )
    
    # TrainingArguments
    training_args = TrainingArguments(
        output_dir=config.output_dir,
        num_train_epochs=config.num_train_epochs,
        per_device_train_batch_size=config.per_device_train_batch_size,
        gradient_accumulation_steps=config.gradient_accumulation_steps,
        learning_rate=config.learning_rate,
        warmup_ratio=config.warmup_ratio,
        weight_decay=config.weight_decay,
        max_grad_norm=config.max_grad_norm,
        logging_steps=config.logging_steps,
        save_steps=config.save_steps,
        eval_steps=config.eval_steps,
        save_total_limit=config.save_total_limit,
        bf16=True,
        gradient_checkpointing=config.gradient_checkpointing,
        optim=config.optim,
        report_to="none",
        seed=config.seed,
        remove_unused_columns=False,
    )
    
    # Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        data_collator=data_collator,
        tokenizer=tokenizer,
    )
    
    # 훈련
    print("Starting training...")
    trainer.train()
    
    # 저장
    print(f"Saving model to {config.output_dir}")
    trainer.save_model(config.output_dir)
    tokenizer.save_pretrained(config.output_dir)
    
    # Merged 모델 저장 (추가)
    print("Creating merged model...")
    merged_model_path = Path(config.output_dir) / "merged"
    merged_model_path.mkdir(exist_ok=True)
    
    # LoRA 가중치 merge
    merged_model = model.merge_and_unload()
    merged_model.save_pretrained(str(merged_model_path))
    tokenizer.save_pretrained(str(merged_model_path))
    
    print(f"Done! Model saved to {merged_model_path}")


if __name__ == "__main__":
    config = TrainingConfig()
    train(config)
