# VELA GPU 워커 — RunPod Serverless 설정 가이드

> Wan 2.1 AI 영상 생성 모델을 RunPod 서버리스 GPU에서 실행하는 워커입니다.
> 사용하지 않을 때는 비용이 0원이고, 요청이 들어올 때만 GPU가 켜집니다.

---

## 목차

1. [RunPod 가입](#1-runpod-가입)
2. [Docker Hub 준비](#2-docker-hub-준비)
3. [Docker 이미지 빌드 & 푸시](#3-docker-이미지-빌드--푸시)
4. [RunPod Serverless Endpoint 생성](#4-runpod-serverless-endpoint-생성)
5. [API 키 발급](#5-api-키-발급)
6. [테스트](#6-테스트)
7. [VELA 백엔드 연동](#7-vela-백엔드-연동)
8. [비용 관리](#8-비용-관리)
9. [문제 해결](#9-문제-해결)

---

## 1. RunPod 가입

1. [https://runpod.io](https://runpod.io) 접속
2. **Sign Up** 클릭 → 이메일 또는 GitHub/Google 계정으로 가입
3. **Settings → Billing** → 결제 수단 등록 (신용카드 또는 PayPal)
4. 처음에 $10~25 정도 충전 권장 (테스트 용도)

> **참고**: RunPod은 사전 충전(prepaid) 방식입니다. 잔액이 소진되면 워커가 멈춥니다.

---

## 2. Docker Hub 준비

RunPod에 워커를 배포하려면 Docker 이미지를 Docker Hub에 올려야 합니다.

1. [https://hub.docker.com](https://hub.docker.com) 가입 (무료)
2. 로그인:
   ```bash
   docker login
   ```

---

## 3. Docker 이미지 빌드 & 푸시

### 사전 준비

- Docker Desktop 설치 ([https://docker.com/products/docker-desktop](https://docker.com/products/docker-desktop))
- 터미널에서 `docker --version` 으로 설치 확인

### 빌드

```bash
# gpu-worker 폴더로 이동
cd gpu-worker

# Docker 이미지 빌드 (처음에는 시간이 좀 걸립니다)
docker build -t vela-gpu-worker .
```

### Docker Hub에 푸시

```bash
# 이미지에 태그 붙이기 (본인의 Docker Hub 사용자명으로 변경)
docker tag vela-gpu-worker [내Docker사용자명]/vela-gpu-worker:latest

# Docker Hub에 업로드
docker push [내Docker사용자명]/vela-gpu-worker:latest
```

> **예시**: Docker Hub 사용자명이 `velastudio` 라면:
> ```bash
> docker tag vela-gpu-worker velastudio/vela-gpu-worker:latest
> docker push velastudio/vela-gpu-worker:latest
> ```

---

## 4. RunPod Serverless Endpoint 생성

1. [RunPod 콘솔](https://www.runpod.io/console/serverless) 접속
2. **Serverless** 메뉴 클릭
3. **+ New Endpoint** 클릭

### 설정값

| 항목 | 권장값 | 설명 |
|------|--------|------|
| **Endpoint Name** | `vela-video-gen` | 원하는 이름 |
| **Container Image** | `[내사용자명]/vela-gpu-worker:latest` | Docker Hub 이미지 경로 |
| **GPU Type** | `NVIDIA A40 (48GB)` 또는 `A100 (80GB)` | 14B 모델은 24GB+ VRAM 필요 |
| **Min Workers** | `0` | 사용하지 않을 때 비용 0원 (중요!) |
| **Max Workers** | `1` | 동시 처리 수 (개인용은 1이면 충분) |
| **Idle Timeout** | `60` (초) | 마지막 요청 후 60초 뒤 GPU 종료 |
| **Execution Timeout** | `600` (초) | 영상 생성 최대 대기 시간 (10분) |

### (선택) 네트워크 볼륨 설정

모델 다운로드 시간을 줄이려면 네트워크 볼륨을 사용하세요:

1. **Storage** 메뉴 → **+ New Volume** → `50GB` 생성
2. Endpoint 설정에서 **Volume Mount Path**: `/runpod-volume`
3. 첫 요청에서만 모델이 다운로드되고, 이후에는 볼륨에서 바로 로드됩니다

4. **Create** 클릭 → Endpoint 생성 완료!

---

## 5. API 키 발급

1. [RunPod 콘솔](https://www.runpod.io/console/user/settings) → **Settings** → **API Keys**
2. **+ Create API Key** 클릭
3. 생성된 키를 안전한 곳에 복사 (한번만 보여줍니다!)

### 확인할 두 가지 값

| 항목 | 위치 | 예시 |
|------|------|------|
| **API Key** | Settings → API Keys | `rpa_XXXXXXXXXXXXXXXXXXXX` |
| **Endpoint ID** | Serverless → 해당 Endpoint 클릭 | `abc123def456` |

---

## 6. 테스트

### 텍스트→영상 테스트

```bash
curl -X POST "https://api.runpod.ai/v2/[ENDPOINT_ID]/runsync" \
  -H "Authorization: Bearer [API_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "mode": "text-to-video",
      "prompt": "A cat walking through a beautiful garden with flowers, cinematic lighting",
      "duration": 5,
      "resolution": "720p",
      "aspect_ratio": "16:9"
    }
  }'
```

### 비동기 요청 (긴 영상 생성 시)

```bash
# 1단계: 작업 등록
curl -X POST "https://api.runpod.ai/v2/[ENDPOINT_ID]/run" \
  -H "Authorization: Bearer [API_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "mode": "text-to-video",
      "prompt": "Ocean waves crashing on a rocky shore at sunset",
      "duration": 10,
      "resolution": "720p",
      "aspect_ratio": "16:9"
    }
  }'
# → {"id": "JOB_ID", "status": "IN_QUEUE"} 응답을 받음

# 2단계: 상태 확인 (완료될 때까지 반복)
curl "https://api.runpod.ai/v2/[ENDPOINT_ID]/status/[JOB_ID]" \
  -H "Authorization: Bearer [API_KEY]"
```

### 응답 예시

```json
{
  "id": "abc-123",
  "status": "COMPLETED",
  "output": {
    "video_base64": "AAAAIGZ0eXBpc29t...(매우 긴 문자열)...",
    "duration": 5,
    "resolution": "1280x720",
    "format": "mp4",
    "generation_time": 45.2
  }
}
```

---

## 7. VELA 백엔드 연동

VELA 백엔드의 `.env` 파일에 아래 값을 설정합니다:

```env
# RunPod 연동 (실제 키 사용 시 MOCK_MODE를 false로 변경)
MOCK_MODE=false
RUNPOD_API_KEY=rpa_XXXXXXXXXXXXXXXXXXXX
RUNPOD_ENDPOINT_ID=abc123def456
```

---

## 8. 비용 관리

### RunPod 서버리스 GPU 비용 (2025년 기준 참고)

| GPU | 시간당 비용 | 5초 영상 1개 예상 | 특징 |
|-----|-----------|----------------|------|
| A40 (48GB) | ~$0.39/hr | ~$0.005~0.02 | 가성비 좋음, 14B 모델 실행 가능 |
| A100 (80GB) | ~$0.76/hr | ~$0.01~0.03 | 빠름, 고해상도/긴 영상에 적합 |
| H100 (80GB) | ~$1.74/hr | ~$0.02~0.06 | 가장 빠름, 비용도 높음 |

> **핵심**: Min Workers = 0으로 설정하면 사용하지 않을 때 비용이 0원입니다!

### 비용 절약 팁

1. **Min Workers = 0** 유지 (스케일 투 제로)
   - 요청이 없으면 GPU가 꺼져서 비용이 들지 않음
   - 대신 첫 요청 시 "콜드스타트" 대기 시간 2~5분 발생

2. **네트워크 볼륨 사용**
   - 모델이 볼륨에 저장되어 콜드스타트 시 다운로드 시간 대폭 감소
   - 볼륨 비용: 월 ~$1.5/50GB (매우 저렴)

3. **Idle Timeout 짧게 설정**
   - 마지막 요청 후 60초 뒤 자동 종료
   - 연속 작업 시에는 워커가 유지되어 빠르게 응답

4. **480p로 테스트**
   - 테스트할 때는 480p 해상도로 생성 → VRAM/시간 절약
   - 만족스러우면 720p/1080p로 재생성

5. **RunPod 예산 상한 설정**
   - Settings → Billing → **Set Budget Limit** → 예: $30/월
   - 상한 도달 시 자동으로 워커 중지

### 월 비용 예상

| 사용량 | 예상 비용 (A40 기준) |
|--------|-------------------|
| 테스트 (영상 10개/월) | $1~3 + 볼륨 $1.5 |
| 가벼운 사용 (영상 50개/월) | $5~15 + 볼륨 $1.5 |
| 활발한 사용 (영상 200개/월) | $20~60 + 볼륨 $1.5 |

---

## 9. 문제 해결

### 콜드스타트가 너무 느려요 (5분+)

→ **네트워크 볼륨** 사용: 모델이 볼륨에 캐시되어 2회째부터 빠르게 로드
→ **Docker 이미지에 모델 포함**: Dockerfile의 모델 다운로드 주석 해제 (이미지 크기 ↑)

### GPU 메모리 부족 (OOM 에러)

→ 해상도를 낮추세요: `1080p` → `720p` → `480p`
→ 영상 길이를 줄이세요: `10초` → `5초` → `3초`
→ A100 (80GB) GPU로 업그레이드

### 영상 품질이 낮아요

→ 프롬프트를 자세하게 작성 (장면, 카메라 각도, 조명 등 구체적으로)
→ `guidance_scale`을 높이면 프롬프트에 더 충실 (기본 5.0, 최대 10.0)
→ `negative_prompt`로 원하지 않는 요소 명시

### 요청이 타임아웃 됩니다

→ Endpoint 설정에서 **Execution Timeout**을 늘리세요 (기본 600초 → 900초)
→ 10초 영상은 생성 시간이 길 수 있음 → 비동기 요청(`/run`) 사용

---

*VELA GPU 워커 가이드 v1.0 — 2026-03-05*
