"""
VELA GPU 워커 — RunPod Serverless Handler
==========================================

이 파일은 RunPod의 서버리스 GPU에서 실행되는 AI 영상 생성 워커입니다.
Wan 2.1 (알리바바의 오픈소스 영상 생성 모델)을 사용하여
텍스트 또는 이미지를 입력받아 영상을 생성합니다.

지원 기능:
  1. text-to-video (T2V): 텍스트 설명 → 영상 생성
  2. image-to-video (I2V): 이미지 + 텍스트 → 영상 생성

실행 환경: RunPod Serverless GPU (NVIDIA A40/A100/H100 등)
필요 VRAM: 최소 24GB (14B 모델 기준)
"""

import os
import io
import base64
import time
import traceback

import runpod
import torch
import numpy as np
from PIL import Image

# ============================================================
# 전역 변수: 모델은 콜드스타트 시 1회만 로드하고, 이후 요청에서 재사용
# (RunPod 서버리스는 워커가 살아있는 동안 전역 상태를 유지합니다)
# ============================================================
t2v_pipe = None  # 텍스트→영상 파이프라인 (한번 로드하면 계속 사용)
i2v_pipe = None  # 이미지→영상 파이프라인 (한번 로드하면 계속 사용)

# --- 모델 설정 ---
# T2V: 텍스트로 영상을 만드는 모델 (14B 파라미터 = 고품질)
T2V_MODEL_ID = "Wan-AI/Wan2.1-T2V-14B-Diffusers"
# I2V: 이미지를 영상으로 변환하는 모델 (14B, 720P 해상도)
I2V_MODEL_ID = "Wan-AI/Wan2.1-I2V-14B-720P-Diffusers"

# --- 해상도 프리셋 ---
# 사용자가 선택할 수 있는 해상도와 화면 비율 조합
RESOLUTION_PRESETS = {
    # "해상도_화면비율": (가로 픽셀, 세로 픽셀)
    "720p_16:9":  (1280, 720),
    "720p_9:16":  (720, 1280),
    "720p_1:1":   (960, 960),
    "1080p_16:9": (1920, 1080),
    "1080p_9:16": (1080, 1920),
    "1080p_1:1":  (1440, 1440),
    # 480p는 VRAM이 부족한 환경을 위한 저해상도 옵션
    "480p_16:9":  (832, 480),
    "480p_9:16":  (480, 832),
    "480p_1:1":   (640, 640),
}

# --- 영상 길이(초)에 따른 프레임 수 ---
# Wan 2.1은 15fps로 영상을 생성하므로, 프레임 수 = 초 × 15 + 1
DURATION_TO_FRAMES = {
    3: 45,    # 3초 = 45프레임 (약 3초 @ 15fps)
    5: 81,    # 5초 = 81프레임 (기본값, 공식 예제 기준)
    10: 153,  # 10초 = 153프레임 (VRAM 많이 필요)
}

# --- 기본 네거티브 프롬프트 ---
# "이런 영상은 만들지 마세요"라고 모델에게 알려주는 텍스트
# (흐린 화면, 저품질, 이상한 손가락 등을 방지)
DEFAULT_NEGATIVE_PROMPT = (
    "Bright tones, overexposed, static, blurred details, subtitles, "
    "style, works, paintings, images, static, overall gray, worst quality, "
    "low quality, JPEG compression residue, ugly, incomplete, extra fingers, "
    "poorly drawn hands, poorly drawn faces, deformed, disfigured, "
    "misshapen limbs, fused fingers, still picture, messy background, "
    "three legs, many people in the background, walking backwards"
)

# --- 생성 FPS ---
# Wan 2.1이 영상을 만들 때 사용하는 프레임 속도
OUTPUT_FPS = 16  # I2V는 16fps, T2V는 15fps (공식 예제 기준)


def load_t2v_model():
    """
    텍스트→영상 모델을 GPU 메모리에 로드합니다.
    콜드스타트 시 1회만 실행되며, 이후 요청에서는 이미 로드된 모델을 재사용합니다.
    로드 시간: 약 2~5분 (모델 크기와 네트워크 속도에 따라 다름)
    """
    global t2v_pipe

    if t2v_pipe is not None:
        # 이미 로드되어 있으면 다시 로드하지 않음
        return t2v_pipe

    print(f"[VELA] T2V 모델 로딩 시작: {T2V_MODEL_ID}")
    start_time = time.time()

    from diffusers import AutoencoderKLWan, WanPipeline

    # VAE(영상을 압축/복원하는 부품)는 float32로 로드해야 품질이 좋음
    vae = AutoencoderKLWan.from_pretrained(
        T2V_MODEL_ID, subfolder="vae", torch_dtype=torch.float32
    )
    # 메인 파이프라인은 bfloat16으로 로드해 VRAM 절약
    t2v_pipe = WanPipeline.from_pretrained(
        T2V_MODEL_ID, vae=vae, torch_dtype=torch.bfloat16
    )
    # GPU로 이동
    t2v_pipe.to("cuda")

    elapsed = time.time() - start_time
    print(f"[VELA] T2V 모델 로딩 완료 ({elapsed:.1f}초 소요)")
    return t2v_pipe


def load_i2v_model():
    """
    이미지→영상 모델을 GPU 메모리에 로드합니다.
    T2V 모델과 별도로 로드되며, I2V 요청이 들어올 때만 로드됩니다.
    """
    global i2v_pipe

    if i2v_pipe is not None:
        return i2v_pipe

    print(f"[VELA] I2V 모델 로딩 시작: {I2V_MODEL_ID}")
    start_time = time.time()

    from diffusers import AutoencoderKLWan, WanImageToVideoPipeline
    from transformers import CLIPVisionModel

    # 이미지 인코더: 입력 이미지를 분석하는 부품 (CLIP 비전 모델)
    image_encoder = CLIPVisionModel.from_pretrained(
        I2V_MODEL_ID, subfolder="image_encoder", torch_dtype=torch.float32
    )
    # VAE: 영상 압축/복원 부품
    vae = AutoencoderKLWan.from_pretrained(
        I2V_MODEL_ID, subfolder="vae", torch_dtype=torch.float32
    )
    # 메인 파이프라인 (이미지→영상 전용)
    i2v_pipe = WanImageToVideoPipeline.from_pretrained(
        I2V_MODEL_ID,
        vae=vae,
        image_encoder=image_encoder,
        torch_dtype=torch.bfloat16,
    )
    i2v_pipe.to("cuda")

    elapsed = time.time() - start_time
    print(f"[VELA] I2V 모델 로딩 완료 ({elapsed:.1f}초 소요)")
    return i2v_pipe


def resolve_resolution(resolution: str, aspect_ratio: str):
    """
    사용자가 선택한 해상도와 화면 비율을 실제 픽셀 크기로 변환합니다.

    예시:
      resolve_resolution("1080p", "16:9") → (1920, 1080)
      resolve_resolution("720p", "9:16") → (720, 1280)

    지원하지 않는 조합이면 기본값 720p 16:9를 반환합니다.
    """
    # 해상도 문자열에서 숫자만 추출 (예: "1080p" → "1080p")
    res_key = resolution.lower().replace(" ", "")
    if not res_key.endswith("p"):
        res_key += "p"

    # 프리셋에서 찾기
    key = f"{res_key}_{aspect_ratio}"
    if key in RESOLUTION_PRESETS:
        return RESOLUTION_PRESETS[key]

    # 못 찾으면 기본값 720p 16:9 반환
    print(f"[VELA] 알 수 없는 해상도 조합: {key}, 기본값 720p 16:9 사용")
    return RESOLUTION_PRESETS["720p_16:9"]


def align_to_model(value: int, pipe) -> int:
    """
    모델이 요구하는 크기 단위(패치 사이즈)에 맞게 값을 반올림합니다.
    Wan 2.1은 특정 배수의 픽셀 크기만 받아들이기 때문입니다.
    (예: 패치 사이즈가 8이면 720 → 720, 725 → 728)
    """
    mod = pipe.vae_scale_factor_spatial * pipe.transformer.config.patch_size[1]
    return round(value / mod) * mod


def decode_base64_image(base64_string: str) -> Image.Image:
    """
    Base64로 인코딩된 이미지 문자열을 PIL 이미지 객체로 변환합니다.
    (프론트엔드에서 이미지를 base64 텍스트로 보내기 때문)
    """
    # "data:image/png;base64,..." 형식이면 헤더 제거
    if "," in base64_string:
        base64_string = base64_string.split(",", 1)[1]

    # base64 텍스트 → 바이트 → PIL 이미지
    image_bytes = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return image


def encode_video_to_base64(video_path: str) -> str:
    """
    생성된 MP4 영상 파일을 Base64 문자열로 변환합니다.
    (프론트엔드로 영상 데이터를 텍스트 형태로 전달하기 위해)
    """
    with open(video_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def generate_text_to_video(job_input: dict) -> dict:
    """
    텍스트→영상 생성의 핵심 로직입니다.

    입력:
      - prompt: 영상을 설명하는 텍스트 (예: "바다 위를 나는 갈매기")
      - negative_prompt: 피하고 싶은 요소 (선택)
      - duration: 영상 길이 (3, 5, 10초)
      - resolution: 해상도 (480p, 720p, 1080p)
      - aspect_ratio: 화면 비율 (16:9, 9:16, 1:1)

    출력:
      - video_base64: 생성된 영상의 base64 인코딩
      - duration, resolution, format 등 메타데이터
    """
    # --- 입력값 추출 (없으면 기본값 사용) ---
    prompt = job_input["prompt"]
    negative_prompt = job_input.get("negative_prompt", DEFAULT_NEGATIVE_PROMPT)
    duration = job_input.get("duration", 5)
    resolution = job_input.get("resolution", "720p")
    aspect_ratio = job_input.get("aspect_ratio", "16:9")

    # --- 모델 로드 (첫 요청 시만 실행) ---
    pipe = load_t2v_model()

    # --- 해상도 계산 ---
    width, height = resolve_resolution(resolution, aspect_ratio)
    # 모델이 요구하는 패치 사이즈 배수로 정렬
    width = align_to_model(width, pipe)
    height = align_to_model(height, pipe)

    # --- 프레임 수 결정 ---
    num_frames = DURATION_TO_FRAMES.get(duration, 81)

    print(f"[VELA T2V] 생성 시작: {width}x{height}, {num_frames}프레임, "
          f"duration={duration}s")
    print(f"[VELA T2V] 프롬프트: {prompt[:100]}...")

    gen_start = time.time()

    # --- 영상 생성 (여기서 GPU가 실제로 일합니다) ---
    output = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        height=height,
        width=width,
        num_frames=num_frames,
        guidance_scale=5.0,  # 프롬프트를 얼마나 충실히 따를지 (높을수록 충실)
    ).frames[0]

    gen_elapsed = time.time() - gen_start
    print(f"[VELA T2V] 생성 완료: {gen_elapsed:.1f}초 소요")

    # --- MP4 파일로 저장 ---
    from diffusers.utils import export_to_video
    output_path = "/tmp/vela_output.mp4"
    export_to_video(output, output_path, fps=15)

    # --- Base64로 인코딩하여 반환 ---
    video_b64 = encode_video_to_base64(output_path)

    # 임시 파일 정리
    if os.path.exists(output_path):
        os.remove(output_path)

    return {
        "video_base64": video_b64,
        "duration": duration,
        "resolution": f"{width}x{height}",
        "format": "mp4",
        "generation_time": round(gen_elapsed, 1),
    }


def generate_image_to_video(job_input: dict) -> dict:
    """
    이미지→영상 생성의 핵심 로직입니다.

    입력:
      - image_base64: 원본 이미지의 base64 인코딩
      - prompt: 영상에 적용할 동작/효과 설명
      - negative_prompt: 피하고 싶은 요소 (선택)
      - duration: 영상 길이 (3, 5, 10초)

    출력:
      - video_base64: 생성된 영상의 base64 인코딩
      - duration, resolution, format 등 메타데이터
    """
    # --- 입력값 추출 ---
    image_b64 = job_input["image_base64"]
    prompt = job_input["prompt"]
    negative_prompt = job_input.get("negative_prompt", DEFAULT_NEGATIVE_PROMPT)
    duration = job_input.get("duration", 5)

    # --- 이미지 디코딩 ---
    image = decode_base64_image(image_b64)

    # --- 모델 로드 ---
    pipe = load_i2v_model()

    # --- 이미지 크기를 모델에 맞게 조정 ---
    # I2V 모델은 입력 이미지의 비율을 유지하면서 720p 영역에 맞춤
    max_area = 720 * 1280  # 720p급 영상의 총 픽셀 수
    aspect = image.height / image.width
    mod = pipe.vae_scale_factor_spatial * pipe.transformer.config.patch_size[1]
    height = round(np.sqrt(max_area * aspect)) // mod * mod
    width = round(np.sqrt(max_area / aspect)) // mod * mod
    image = image.resize((width, height))

    # --- 프레임 수 결정 ---
    num_frames = DURATION_TO_FRAMES.get(duration, 81)

    print(f"[VELA I2V] 생성 시작: {width}x{height}, {num_frames}프레임, "
          f"duration={duration}s")
    print(f"[VELA I2V] 프롬프트: {prompt[:100]}...")

    gen_start = time.time()

    # --- 영상 생성 ---
    output = pipe(
        image=image,
        prompt=prompt,
        negative_prompt=negative_prompt,
        height=height,
        width=width,
        num_frames=num_frames,
        guidance_scale=5.0,
    ).frames[0]

    gen_elapsed = time.time() - gen_start
    print(f"[VELA I2V] 생성 완료: {gen_elapsed:.1f}초 소요")

    # --- MP4로 저장 ---
    from diffusers.utils import export_to_video
    output_path = "/tmp/vela_output.mp4"
    export_to_video(output, output_path, fps=OUTPUT_FPS)

    # --- Base64로 인코딩 ---
    video_b64 = encode_video_to_base64(output_path)

    if os.path.exists(output_path):
        os.remove(output_path)

    return {
        "video_base64": video_b64,
        "duration": duration,
        "resolution": f"{width}x{height}",
        "format": "mp4",
        "generation_time": round(gen_elapsed, 1),
    }


# ============================================================
# RunPod 핸들러 함수
# ============================================================
# RunPod이 새 요청을 받을 때마다 이 함수를 호출합니다.
# job["input"]에 클라이언트가 보낸 JSON 데이터가 담겨 있습니다.
# ============================================================

def handler(job):
    """
    RunPod 서버리스 핸들러 — 모든 요청의 진입점입니다.

    요청 형식 (job["input"]):
    {
        "mode": "text-to-video" | "image-to-video",
        "prompt": "영상을 설명하는 텍스트",
        "negative_prompt": "피하고 싶은 요소 (선택)",
        "duration": 5,           // 3, 5, 10초
        "resolution": "720p",    // 480p, 720p, 1080p (T2V만)
        "aspect_ratio": "16:9",  // 16:9, 9:16, 1:1 (T2V만)
        "image_base64": "..."    // image-to-video일 때만 필수
    }

    반환 형식:
    {
        "video_base64": "...",
        "duration": 5.0,
        "resolution": "1280x720",
        "format": "mp4",
        "generation_time": 45.2
    }
    """
    try:
        job_input = job["input"]
        mode = job_input.get("mode", "text-to-video")

        print(f"[VELA] 새 요청 수신: mode={mode}")

        # --- 입력 검증 ---
        if "prompt" not in job_input:
            return {"error": "prompt 필드가 필요합니다."}

        if mode == "image-to-video" and "image_base64" not in job_input:
            return {"error": "image-to-video 모드에는 image_base64 필드가 필요합니다."}

        duration = job_input.get("duration", 5)
        if duration not in [3, 5, 10]:
            return {"error": f"지원하지 않는 영상 길이: {duration}초. 3, 5, 10초만 가능합니다."}

        # --- 모드별 영상 생성 ---
        if mode == "text-to-video":
            result = generate_text_to_video(job_input)
        elif mode == "image-to-video":
            result = generate_image_to_video(job_input)
        else:
            return {"error": f"지원하지 않는 모드: {mode}. text-to-video 또는 image-to-video를 사용하세요."}

        print(f"[VELA] 요청 처리 완료: {result['resolution']}, "
              f"{result['generation_time']}초 소요")
        return result

    except torch.cuda.OutOfMemoryError:
        # GPU 메모리 부족 — 해상도를 낮추라는 안내
        torch.cuda.empty_cache()  # GPU 메모리 정리 시도
        return {
            "error": "GPU 메모리가 부족합니다. "
                     "해상도를 낮추거나(720p→480p) 영상 길이를 줄여(10초→5초) 다시 시도해주세요."
        }
    except Exception as e:
        # 그 외 모든 에러
        error_msg = f"영상 생성 중 오류 발생: {str(e)}"
        print(f"[VELA ERROR] {error_msg}")
        print(traceback.format_exc())
        return {"error": error_msg}


# ============================================================
# 워커 시작
# ============================================================
# RunPod이 이 스크립트를 실행하면 아래 코드로 서버리스 워커가 시작됩니다.
# 워커는 요청이 들어올 때까지 대기하다가, 요청이 오면 handler 함수를 호출합니다.
# ============================================================

if __name__ == "__main__":
    print("[VELA] RunPod 서버리스 워커 시작...")
    print(f"[VELA] T2V 모델: {T2V_MODEL_ID}")
    print(f"[VELA] I2V 모델: {I2V_MODEL_ID}")
    print(f"[VELA] CUDA 사용 가능: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"[VELA] GPU: {torch.cuda.get_device_name(0)}")
        print(f"[VELA] VRAM: {torch.cuda.get_device_properties(0).total_mem / 1e9:.1f}GB")

    runpod.serverless.start({"handler": handler})
