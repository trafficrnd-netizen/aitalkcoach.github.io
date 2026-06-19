"""
LoRA/QLoRA → GGUF 변환 스크립트
llama.cpp로手机上 배포 가능한 모델 생성

사용법:
    python convert_to_gguf.py --input ./output/merged --output ./ai-engine/models/aitalkcoach-q4_k_m.gguf --quantization q4_k_m
"""

import argparse
import os
import sys
from pathlib import Path

def convert_to_gguf(input_dir, output_path, quantization="q4_k_m"):
    """
    HuggingFace 모델 → GGUF 변환
    llama.cpp의 convert.py 사용
    """
    input_path = Path(input_dir)
    output_path = Path(output_path)
    
    if not input_path.exists():
        raise FileNotFoundError(f"Input directory not found: {input_dir}")
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # llama.cpp 클론 (없으면)
    llama_cpp_path = Path("./llama.cpp")
    if not llama_cpp_path.exists():
        print("Cloning llama.cpp...")
        os.system("git clone https://github.com/ggerganov/llama.cpp.git")
    
    # convert.py 실행
    convert_script = llama_cpp_path / "convert.py"
    if not convert_script.exists():
        print("Error: llama.cpp convert.py not found")
        return
    
    print(f"Converting {input_dir} to GGUF...")
    
    cmd = f"""
    python "{convert_script}" "{input_path}" \\
        --outfile "{output_path}" \\
        --outtype {quantization}
    """
    
    print(f"Running: {cmd}")
    result = os.system(cmd)
    
    if result == 0:
        file_size = output_path.stat().st_size / (1024 * 1024)
        print(f"✅ Conversion complete! File: {output_path}")
        print(f"   Size: {file_size:.1f} MB")
    else:
        print(f"❌ Conversion failed with code {result}")

def main():
    parser = argparse.ArgumentParser(description="Convert fine-tuned model to GGUF")
    parser.add_argument("--input", "-i", required=True, help="Input model directory (merged model)")
    parser.add_argument("--output", "-o", required=True, help="Output GGUF file path")
    parser.add_argument("--quantization", "-q", default="q4_k_m", 
                        choices=["f16", "q4_0", "q4_1", "q5_0", "q5_1", "q8_0", 
                                 "q2_k", "q3_k", "q4_k", "q5_k", "q6_k", "q8_0"],
                        help="Quantization type")
    
    args = parser.parse_args()
    convert_to_gguf(args.input, args.output, args.quantization)

if __name__ == "__main__":
    main()
