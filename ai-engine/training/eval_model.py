"""
Fine-tuned 모델 평가 스크립트

사용법:
    python eval_model.py --model ./output/merged
"""

import json
import os
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import List, Dict

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline


@dataclass
class EvalResult:
    """평가 결과"""
    category: str
    input_example: str
    expected: Dict
    actual: str
    parsed: Dict
    is_valid: bool
    latency_ms: float
    score: float  # 0-1


class ModelEvaluator:
    """모델 평가기"""
    
    def __init__(self, model_path: str):
        print(f"Loading model from: {model_path}")
        
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.tokenizer.pad_token = self.tokenizer.eos_token
        
        self.model = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.bfloat16,
            device_map="auto",
            trust_remote_code=True,
        )
        
        self.pipeline = pipeline(
            "text-generation",
            model=self.model,
            tokenizer=self.tokenizer,
            max_new_tokens=512,
            temperature=0.7,
            do_sample=True,
        )
        
        print("Model loaded!")
    
    def evaluate(self, test_data: List[Dict]) -> List[EvalResult]:
        """평가 실행"""
        results = []
        
        for item in test_data:
            import time
            start = time.time()
            
            # 프롬프트 구성
            prompt = self._build_prompt(item)
            
            # 생성
            output = self.pipeline(
                prompt,
                return_full_text=False,
                pad_token_id=self.tokenizer.eos_token_id,
            )[0]['generated_text']
            
            latency = (time.time() - start) * 1000
            
            # 파싱
            parsed = self._parse_output(output)
            expected = item['response']
            
            # 점수 계산
            score = self._calculate_score(expected, parsed, item['analysis_type'])
            
            results.append(EvalResult(
                category=item['analysis_type'],
                input_example=item['conversation'][:100],
                expected=expected,
                actual=output[:500],
                parsed=parsed,
                is_valid=parsed is not None,
                latency_ms=latency,
                score=score,
            ))
        
        return results
    
    def _build_prompt(self, item: Dict) -> str:
        """프롬프트 구성"""
        system_prompts = {
            "emotion": "당신은 20년 경력의 커플 상담사입니다. 감정 분석을 JSON으로 답하세요.",
            "interest": "당신은 20년 경력의 커플 상담사입니다. 관심도 분석을 JSON으로 답하세요.",
            "replies": "당신은 20년 경력의 커플 상담사입니다. 답장 추천을 JSON으로 답하세요.",
            "comprehensive": "당신은 20년 경력의 커플 상담사입니다. 종합 분석을 JSON으로 답하세요.",
        }
        
        system = system_prompts.get(item['analysis_type'], system_prompts['comprehensive'])
        conv = item['conversation']
        
        return f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

{system}<|eot_id|><|start_header_id|>user<|end_header_id|>

[대화]
{conv}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""
    
    def _parse_output(self, output: str) -> Dict:
        """출력 파싱"""
        # JSON 블록 추출
        text = output.strip()
        
        # ```json ... ``` 제거
        if '```' in text:
            start = text.find('```')
            end = text.rfind('```')
            if start != end:
                text = text[start+3:end]
                text = text.replace('json', '', 1).strip()
        
        try:
            return json.loads(text)
        except:
            return None
    
    def _calculate_score(self, expected: Dict, actual: Dict, analysis_type: str) -> float:
        """점수 계산"""
        if actual is None:
            return 0.0
        
        score = 0.0
        total = 0
        
        # 필수 필드 존재 여부
        required_fields = {
            'emotion': ['emotion', 'emotion_score', 'emotion_emoji'],
            'interest': ['interest_level', 'interest_score'],
            'replies': ['suggestions'],
            'comprehensive': ['summary', 'emotion', 'interest'],
        }
        
        fields = required_fields.get(analysis_type, [])
        for field in fields:
            total += 1
            if field in actual:
                score += 0.7  # 필드 존재
                
                # 값이 reasonable한지 체크
                expected_val = expected.get(field)
                actual_val = actual.get(field)
                
                if expected_val is not None and actual_val is not None:
                    if isinstance(expected_val, (int, float)) and isinstance(actual_val, (int, float)):
                        # 숫자: +-2 이내면 만점
                        if abs(expected_val - actual_val) <= 2:
                            score += 0.3
                    elif expected_val == actual_val:
                        # 문자: 정확히 같으면 만점
                        score += 0.3
        
        return min(score / total, 1.0) if total > 0 else 0.0
    
    def print_report(self, results: List[EvalResult]):
        """평가 리포트 출력"""
        print("\n" + "="*60)
        print("📊 MODEL EVALUATION REPORT")
        print("="*60)
        
        # 카테고리별 통계
        by_category = {}
        for r in results:
            if r.category not in by_category:
                by_category[r.category] = []
            by_category[r.category].append(r)
        
        for cat, items in by_category.items():
            scores = [i.score for i in items]
            latencies = [i.latency_ms for i in items]
            valid_count = sum(1 for i in items if i.is_valid)
            
            print(f"\n### {cat.upper()}")
            print(f"  Valid responses: {valid_count}/{len(items)} ({100*valid_count/len(items):.0f}%)")
            print(f"  Avg score: {sum(scores)/len(scores)*100:.1f}%")
            print(f"  Avg latency: {sum(latencies)/len(latencies):.0f}ms")
        
        # 전체 통계
        all_scores = [r.score for r in results]
        all_latencies = [r.latency_ms for r in results]
        
        print(f"\n### OVERALL")
        print(f"  Total examples: {len(results)}")
        print(f"  Valid responses: {sum(1 for r in results if r.is_valid)}/{len(results)}")
        print(f"  Avg score: {sum(all_scores)/len(all_scores)*100:.1f}%")
        print(f"  Avg latency: {sum(all_latencies)/len(all_latencies):.0f}ms")
        print("="*60)


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", "-m", required=True, help="Model directory")
    parser.add_argument("--test-data", "-t", help="Test data JSON (default: korean_counseling_dataset.json)")
    args = parser.parse_args()
    
    # 테스트 데이터 로드
    script_dir = Path(__file__).parent
    test_data_path = args.test_data or str(script_dir / "korean_counseling_dataset.json")
    
    with open(test_data_path, "r", encoding="utf-8") as f:
        test_data = json.load(f)
    
    # 평가
    evaluator = ModelEvaluator(args.model)
    results = evaluator.evaluate(test_data)
    
    # 리포트
    evaluator.print_report(results)
    
    # 상세 결과 저장
    output_path = Path(args.model) / "eval_results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump([
            {
                "category": r.category,
                "input": r.input_example,
                "score": r.score,
                "latency_ms": r.latency_ms,
                "is_valid": r.is_valid,
            }
            for r in results
        ], f, ensure_ascii=False, indent=2)
    
    print(f"\nResults saved to: {output_path}")


if __name__ == "__main__":
    main()
