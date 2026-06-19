# AI톡 코치 - Fine-tuning 학습 가이드

## 📁 구조

```
ai-engine/
├── training/
│   ├── korean_counseling_dataset.json   # 훈련 데이터 (30개 예시)
│   ├── train_lora.py                    # LoRA 학습 스크립트
│   ├── train_qlora.py                   # QLoRA 학습 스크립트
│   ├── eval_model.py                    # 모델 평가 스크립트
│   ├── convert_to_gguf.py               # GGUF 변환 스크립트
│   └── output/                          # 학습 결과 출력
│       ├── lora/                        # LoRA 결과
│       └── qlora/                       # QLoRA 결과
├── colab/
│   └── AI톡_코치_QLoRA_학습.ipynb       # Colab 노트북
└── models/                              # Fine-tuned 모델 저장소
    └── aitalkcoach-q4_k_m.gguf           # GGUF 양자화 모델
```

## 🚀 빠른 시작

### Colab에서 30분 학습 (추천)

1. `colab/AI톡_코치_QLoRA_학습.ipynb`를 Colab에 업로드
2. `korean_counseling_dataset.json` 파일 업로드
3. T4 GPU 런타임 선택
4. **Runtime → Run all** (30~50분 소요)
5. `aitalkcoach_qlora_model.zip` 다운로드
6. `models/` 폴더에 배치

### 로컬 GPU에서 학습

```bash
# LoRA (8GB VRAM 이상)
python train_lora.py

# QLoRA (T4 16GB)
python train_qlora.py

# 평가
python eval_model.py --model ./output/merged

# GGUF 변환
python convert_to_gguf.py \
    --input ./output/merged \
    --output ./models/aitalkcoach-q4_k_m.gguf \
    --quantization q4_k_m
```

## 📊 데이터셋

`korean_counseling_dataset.json` — 30개 훈련 예시

각 예시 구성:
```json
{
  "id": "train_001",
  "category": "emotion_analysis",           // 분석 유형
  "conversation": "나: ...\n상대방: ...",    // 대화
  "analysis_type": "emotion",              // 분석 타입
  "response": { ... },                      // 정답 응답 (JSON)
  "explanation": "..."                       // 분석 근거
}
```

**카테고리 분포:**
- emotion_analysis: 5개
- interest_analysis: 5개
- reply_suggestion: 5개
- advice_analysis: 5개
- comprehensive_analysis: 10개

## 🔧 하드웨어 요구사항

| 방법 | GPU VRAM | 시간 | 모델 크기 |
|------|----------|------|----------|
| LoRA | 8GB+ | 30분 | 3B |
| QLoRA | 16GB (T4) | 30~50분 | 3B |
| QLoRA (8B) | 24GB (A10G) | 1~2시간 | 8B |

## 📈 예상 성능

| 단계 | 방법 | 효과 (vs GPT-4o-mini) |
|------|------|----------------------|
| 1 | 기본 INT 모델 | 70~75% |
| 2 | + 프롬프트 최적화 | 75~80% |
| 3 | + RAG | 80~85% |
| 4 | + LoRA Fine-tuning | 85~90% |
| 5 | + QLoRA (한국어) | 90~95% |

## 📱手机上 배포

### Android (MediaPipe LLM Inference)

```javascript
import { LLMInference } from '@aspect-ai/android-llm-inference';

const model = await LLMInference.fromModel({
  model: 'aitalkcoach-q4_k_m.gguf',
  quantization: 'q4_k_m',
});

const response = await model.generate({
  prompt: conversationPrompt,
  maxTokens: 2048,
  temperature: 0.7,
});
```

### iOS (MLX)

```javascript
import { MLXLlm } from 'mlx-llm';

const model = await MLXLlm.load('aitalkcoach-q4_k_m');
const response = await model.generate(conversationPrompt);
```

## 🧪 데이터셋 확장 권장

현재 30개 예시 → 최소 200~500개 권장

추가 데이터 생성 방법:
1. GPT-4o로 200개 synthetic 데이터 생성
2. 수동 검토 및 정제
3. 다양한 상황 추가 (이별, 재회, 장기연애 등)

```python
# 데이터 확장 프롬프트 예시
EXPAND_PROMPT = """
다음과 같은 한국 커플 상담 상황의 훈련 데이터를 생성해주세요:

상황: {situation}
카테고리: {category}

대화 형식:
나: [내 메시지]
상대방: [상대방 메시지]

분석 타입: {analysis_type}
"""
```
