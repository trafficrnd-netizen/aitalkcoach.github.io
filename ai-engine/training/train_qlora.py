"""
QLoRA Fine-tuning 스크립트 for AI톡 코치
4-bit 양자화 + LoRA = QLoRA

사용법:
    python train_qlora.py

Colab T4 (16GB VRAM)에서 실행 가능.
"""

import json
import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

import torch
from datasets import Dataset
from peft import (
    LoraConfig,
    get_peft_model,
    TaskType,
    prepare_model_for_kbit_training,
)
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
    BitsAndBytesConfig,
    set_seed,
)


# ===== 설정 =====
@dataclass
class QLoRAConfig:
    """QLoRA 훈련 설정"""
    
    # 모델 (QLoRA는 3B~8B 모델에 적합)
    model_name: str = "meta-llama/Llama-3.2-3B-Instruct"
    
    # 4-bit 양자화 설정
    load_in_4bit: bool = True
    bnb_4bit_quant_type: str = "nf4"  # nf4 or fp4
    bnb_4bit_compute_dtype: str = "bfloat16"
    bnb_4bit_use_double_quant: bool = True
    
    # LoRA 설정 (QLoRA는 더 큰 r 값 가능)
    lora_r: int = 64
    lora_alpha: int = 128
    lora_dropout: float = 0.05
    lora_target_modules: list = field(default_factory=lambda: [
        "q_proj", "v_proj", "k_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
        "embed_tokens", "lm_head",  # embedding도 fine-tune
    ])
    
    # 훈련 설정
    output_dir: str = "./ai-engine/training/output/qlora"
    num_train_epochs: int = 15
    per_device_train_batch_size: int = 1
    gradient_accumulation_steps: int = 16  # 큰 값으로 effective batch 늘림
    learning_rate: float = 2e-4
    warmup_ratio: float = 0.1
    weight_decay: float = 0.01
    max_grad_norm: float = 0.5
    logging_steps: int = 5
    save_steps: int = 50
    eval_steps: int = 50
    save_total_limit: int = 2
    
    # 메모리 최적화
    gradient_checkpointing: bool = True
    optim: str = "paged_adamw_32bit"  # 32bit AdamW (QLoRA 권장)
    max_memory: dict = field(default_factory=lambda: {
        0: "14GiB",  # T4 16GB
        "cpu": "30GiB",
    })
    
    seed: int = 42


def format_instruction(example: dict) -> str:
    """대화 분석 명령어 포맷 (QLoRA용)"""
    
    category = example.get("analysis_type", "comprehensive")
    
    system_prompts = {
        "emotion": "당신은 20년 경력의 커플 상담사입니다. 다음 대화의 감정/분위기를 분석해주세요. 한국인의 감정 표현과 문화적 맥락을 깊이 이해하고 있습니다.",
        "interest": "당신은 20년 경력의 커플 상담사입니다. 상대방의 관심도를 분석해주세요. 한국인의 연락 패턴과 관심 표현 방식을 이해하고 있습니다.",
        "replies": "당신은 20년 경력의 커플 상담사입니다. 상황에 맞는 자연스러운 한국어 답장을 추천해주세요. 반말/존댓말 구분과 데이트 문화 맥락을 고려합니다.",
        "advice": "당신은 20년 경력의 커플 상담사입니다. 대화 방식의 개선점을 조언해주세요. 한국인의 소통 스타일과 문화적 특성을 반영합니다.",
        "comprehensive": "당신은 20년 경력의 커플 상담사입니다. 대화를 종합적으로 분석해주세요. 감정, 관심도, 조언, 답장 추천을 포함합니다.",
    }
    
    system = system_prompts.get(category, system_prompts["comprehensive"])
    conversation = example["conversation"].strip()
    response_json = json.dumps(example["response"], ensure_ascii=False)
    explanation = example.get("explanation", "")
    
    # Llama chat template
    text = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

{system}

응답은 반드시 JSON 형식으로 작성해주세요. 분석의 근거도 함께 설명해주세요.<|eot_id|><|start_header_id|>user<|end_header_id|>

[대화]
{conversation}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

{response_json}

[분석 근거]
{explanation}<|eot_id|>"""
    
    return text


def load_dataset(data_path: str) -> Dataset:
    """데이터셋 로드 + 포맷"""
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    dataset = Dataset.from_list(data)
    dataset = dataset.map(
        lambda x: {"text": format_instruction(x)},
        remove_columns=dataset.column_names,
    )
    
    print(f"Dataset: {len(dataset)} examples")
    return dataset


def tokenize(examples, tokenizer, max_length: int = 2048):
    result = tokenizer(
        examples["text"],
        truncation=True,
        max_length=max_length,
        padding="max_length",
    )
    result["labels"] = result["input_ids"].copy()
    return result


def create_qlora_model(config: QLoRAConfig):
    """QLoRA 모델 생성"""
    print(f"Loading quantized model: {config.model_name}")
    
    # 토크나이저
    tokenizer = AutoTokenizer.from_pretrained(config.model_name)
    tokenizer.pad_token = tokenizer.eos_token
    
    # 4-bit 양자화 설정
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=config.load_in_4bit,
        bnb_4bit_quant_type=config.bnb_4bit_quant_type,
        bnb_4bit_compute_dtype=getattr(torch, config.bnb_4bit_compute_dtype),
        bnb_4bit_use_double_quant=config.bnb_4bit_use_double_quant,
    )
    
    # 모델 로드
    model = AutoModelForCausalLM.from_pretrained(
        config.model_name,
        quantization_config=bnb_config,
        device_map="auto",
        max_memory=config.max_memory,
        trust_remote_code=True,
    )
    
    # QLoRA를 위한 설정
    model = prepare_model_for_kbit_training(model)
    
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
    
    # 메모리 사용량 출력
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"Trainable: {trainable_params:,} / {total_params:,} ({100*trainable_params/total_params:.2f}%)")
    
    return model, tokenizer


def train(config: QLoRAConfig):
    """QLoRA 훈련"""
    set_seed(config.seed)
    
    Path(config.output_dir).mkdir(parents=True, exist_ok=True)
    
    # 모델 & 토크나이저
    model, tokenizer = create_qlora_model(config)
    
    # 데이터셋
    script_dir = Path(__file__).parent
    data_path = script_dir / "korean_counseling_dataset.json"
    dataset = load_dataset(str(data_path))
    
    # 토큰화
    dataset = dataset.map(
        lambda x: tokenize(x, tokenizer),
        batched=False,
        remove_columns=["text"],
    )
    
    # 데이터 콜레이터
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False,
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
    
    print("Starting QLoRA training...")
    trainer.train()
    
    # 저장
    print(f"Saving to {config.output_dir}")
    trainer.save_model(config.output_dir)
    tokenizer.save_pretrained(config.output_dir)
    
    # Merged 모델
    print("Merging LoRA weights...")
    merged_path = Path(config.output_dir) / "merged"
    merged_path.mkdir(exist_ok=True)
    
    merged_model = model.merge_and_unload()
    merged_model.save_pretrained(str(merged_path))
    tokenizer.save_pretrained(str(merged_path))
    
    # GGUF로 저장 (llama.cpp용)
    print("Converting to GGUF format...")
    try:
        from transformers import LlamaTokenizer
        # Merge 후 GGUF 변환은 별도 스크립트에서
        print(f"Model ready for GGUF conversion at {merged_path}")
    except Exception as e:
        print(f"GGUF conversion skipped: {e}")
    
    print(f"Done! QLoRA model saved to {merged_path}")


if __name__ == "__main__":
    config = QLoRAConfig()
    train(config)
