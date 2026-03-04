# ============================================
# VELA GPU 워커 — Docker 이미지 설정
# ============================================
# 이 파일은 RunPod 서버리스 GPU에서 실행될
# AI 영상 생성 워커의 실행 환경을 정의합니다.
#
# 빌드 방법:
#   docker build -t vela-gpu-worker .
#
# Docker Hub에 푸시:
#   docker tag vela-gpu-worker [사용자명]/vela-gpu-worker:latest
#   docker push [사용자명]/vela-gpu-worker:latest
# ============================================

# --- 베이스 이미지 ---
# RunPod 공식 PyTorch 이미지 (CUDA 12.1 + Python 3.10 포함)
# PyTorch가 이미 설치되어 있어 별도 설치 불필요
FROM runpod/pytorch:2.2.0-py3.10-cuda12.1.0-devel-ubuntu22.04

# --- 작업 디렉토리 설정 ---
WORKDIR /app

# --- 시스템 패키지 업데이트 ---
# ffmpeg: 영상 파일 처리에 필요
# git: HuggingFace 모델 다운로드에 필요
# git-lfs: 대용량 모델 파일 다운로드에 필요 (LFS = Large File Storage)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    git \
    git-lfs \
    && git lfs install \
    && rm -rf /var/lib/apt/lists/*

# --- Python 패키지 설치 ---
# requirements.txt에 명시된 라이브러리들을 설치
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# --- 모델 가중치 사전 다운로드 (선택사항) ---
# 아래 주석을 해제하면 Docker 이미지 빌드 시 모델을 미리 다운로드합니다.
# 이미지 크기가 커지지만(약 30~50GB), 콜드스타트 시간이 크게 줄어듭니다.
#
# 방법 1: 빌드 시 다운로드 (이미지 크기 ↑, 콜드스타트 ↓↓)
# RUN python -c "\
# from diffusers import AutoencoderKLWan, WanPipeline; \
# import torch; \
# vae = AutoencoderKLWan.from_pretrained('Wan-AI/Wan2.1-T2V-14B-Diffusers', subfolder='vae', torch_dtype=torch.float32); \
# pipe = WanPipeline.from_pretrained('Wan-AI/Wan2.1-T2V-14B-Diffusers', vae=vae, torch_dtype=torch.bfloat16); \
# print('T2V 모델 다운로드 완료')"
#
# 방법 2: 네트워크 볼륨 사용 (권장)
# RunPod에서 네트워크 볼륨을 마운트하면 모델 파일을 영구 저장할 수 있습니다.
# 첫 번째 요청에서만 다운로드하고, 이후에는 볼륨에서 로드합니다.
# 환경변수 HF_HOME을 네트워크 볼륨 경로로 설정하면 됩니다.

# --- HuggingFace 캐시 경로 설정 ---
# 네트워크 볼륨을 /runpod-volume에 마운트하면 모델이 여기에 저장됩니다
# 볼륨이 없으면 /app/hf-cache에 임시 저장 (워커 종료 시 삭제됨)
ENV HF_HOME=/runpod-volume/huggingface
ENV TRANSFORMERS_CACHE=/runpod-volume/huggingface
ENV DIFFUSERS_CACHE=/runpod-volume/huggingface

# --- 핸들러 파일 복사 ---
COPY handler.py /app/handler.py

# --- 실행 명령 ---
# RunPod이 이 컨테이너를 시작하면 handler.py가 실행됩니다
# -u: 파이썬 출력을 버퍼링하지 않음 (로그가 실시간으로 보임)
CMD ["python", "-u", "/app/handler.py"]
