# RunPod 서버리스 GPU 설정 가이드

> VELA 영상 생성 AI를 클라우드 GPU에서 실행하기 위한 완전 가이드입니다.
> 비전공자도 따라할 수 있도록 모든 단계를 상세히 설명합니다.

---

## 목차

1. [RunPod 가입](#1-runpod-가입)
2. [결제 수단 등록](#2-결제-수단-등록)
3. [Docker Hub에 GPU 워커 이미지 푸시](#3-docker-hub에-gpu-워커-이미지-푸시)
4. [Serverless Endpoint 생성](#4-serverless-endpoint-생성)
5. [API 키 발급](#5-api-키-발급)
6. [VELA 백엔드 .env에 설정](#6-vela-백엔드-env에-설정)
7. [테스트 curl 명령어](#7-테스트-curl-명령어)
8. [비용 관리 팁](#8-비용-관리-팁)

---

## 1. RunPod 가입

RunPod은 AI 모델을 실행하기 위한 클라우드 GPU를 제공하는 서비스입니다.
필요할 때만 GPU를 빌려 쓰고, 안 쓸 때는 비용이 0원입니다.

### 가입 절차

1. **[https://runpod.io](https://runpod.io)** 접속
2. 우측 상단 **Sign Up** 클릭
3. 가입 방법 선택:
   - **GitHub 계정** (개발자라면 편리)
   - **Google 계정** (가장 빠름)
   - **이메일** (별도 가입)
4. 이메일 인증 완료

> 가입 후 바로 사용 가능한 무료 크레딧은 없습니다.
> 다음 단계에서 결제 수단을 등록해야 합니다.

---

## 2. 결제 수단 등록

RunPod은 **선불(프리페이드)** 방식입니다.
미리 충전해놓고 사용하는 만큼 차감됩니다.

### 충전 방법

1. 로그인 후 좌측 메뉴 **Settings** 클릭
2. **Billing** 탭 클릭
3. **Add Payment Method** 클릭
4. 결제 수단 선택:
   - **신용카드/체크카드** (Visa, Mastercard)
   - **PayPal**
5. 첫 충전 금액: **$10~25 권장** (테스트 충분)

### 예산 상한 설정 (강력 권장)

충전 후 바로 **Budget Limit**을 설정하세요:

1. Billing 페이지에서 **Set Budget Limit** 클릭
2. 월 상한 금액 입력 (예: $30)
3. 상한 도달 시 **자동으로 워커 중지** → 예상치 못한 과금 방지

---

## 3. Docker Hub에 GPU 워커 이미지 푸시

### Docker란?

Docker는 프로그램을 "상자(이미지)"에 담아서 어디서든 똑같이 실행할 수 있게 해주는 도구입니다.
우리의 AI 모델과 코드를 Docker 이미지로 만들어 RunPod에 전달합니다.

### 사전 준비

1. **Docker Desktop 설치**: [https://docker.com/products/docker-desktop](https://docker.com/products/docker-desktop)
   - Mac용 다운로드 → 설치 → 실행
   - 설치 확인: 터미널에서 `docker --version`

2. **Docker Hub 가입**: [https://hub.docker.com](https://hub.docker.com)
   - 무료 계정으로 충분합니다

### 이미지 빌드 & 푸시

터미널을 열고 아래 명령어를 순서대로 실행합니다:

```bash
# 1단계: Docker Hub에 로그인
docker login
# → 사용자명과 비밀번호 입력

# 2단계: gpu-worker 폴더로 이동
cd 클로드/08_ai-video-studio/gpu-worker

# 3단계: Docker 이미지 빌드
# (처음 빌드 시 10~30분 소요 — 기본 이미지 다운로드 포함)
docker build -t vela-gpu-worker .

# 4단계: Docker Hub 사용자명으로 태그 붙이기
# ⚠️ "내사용자명" 부분을 본인의 Docker Hub 사용자명으로 변경!
docker tag vela-gpu-worker 내사용자명/vela-gpu-worker:latest

# 5단계: Docker Hub에 업로드
docker push 내사용자명/vela-gpu-worker:latest
```

### 예시 (사용자명이 `velastudio`인 경우)

```bash
docker tag vela-gpu-worker velastudio/vela-gpu-worker:latest
docker push velastudio/vela-gpu-worker:latest
```

> 업로드 완료 후 [Docker Hub](https://hub.docker.com)에 접속하면
> `내사용자명/vela-gpu-worker` 이미지가 보입니다.

---

## 4. Serverless Endpoint 생성

Endpoint = RunPod에서 실행되는 우리의 AI 워커 "주소"입니다.
이 주소로 요청을 보내면 GPU에서 영상이 생성됩니다.

### 생성 절차

1. [RunPod 콘솔](https://www.runpod.io/console/serverless) 접속
2. 좌측 메뉴에서 **Serverless** 클릭
3. **+ New Endpoint** 클릭

### 설정값 입력

| 항목 | 입력값 | 설명 |
|------|--------|------|
| Endpoint Name | `vela-video-gen` | 원하는 이름 아무거나 |
| Container Image | `내사용자명/vela-gpu-worker:latest` | 위에서 푸시한 이미지 |
| GPU Type | **NVIDIA A40 (48GB VRAM)** | 14B 모델 실행에 충분 |
| Min Workers | **0** | 안 쓸 때 비용 0원 (핵심!) |
| Max Workers | **1** | 동시 처리 수 (개인용 1이면 충분) |
| Idle Timeout | **60** (초) | 마지막 요청 후 60초 뒤 자동 종료 |
| Execution Timeout | **600** (초) | 최대 10분까지 대기 |

### (강력 권장) 네트워크 볼륨 연결

네트워크 볼륨은 RunPod에서 제공하는 "외장 하드"같은 것입니다.
AI 모델 파일을 여기에 저장하면, 매번 다운로드할 필요가 없어서 빠릅니다.

1. 좌측 메뉴 **Storage** → **+ New Volume**
2. 용량: **50GB** 선택 (모델 파일 저장용)
3. 리전(지역): Endpoint와 같은 리전 선택
4. Endpoint 설정으로 돌아가서:
   - **Volume** 항목에서 방금 만든 볼륨 선택
   - **Volume Mount Path**: `/runpod-volume`

5. **Create** 클릭 → 생성 완료!

### 생성 후 확인

Endpoint 목록에서 방금 만든 `vela-video-gen`을 클릭하면:
- **Endpoint ID**가 표시됩니다 (예: `abc123def456`)
- 이 ID는 API 호출 시 필요합니다

---

## 5. API 키 발급

API 키는 "비밀번호"같은 것입니다.
이 키가 있어야 우리 워커에 요청을 보낼 수 있습니다.

### 발급 절차

1. 좌측 메뉴 **Settings** → **API Keys** 탭
2. **+ Create API Key** 클릭
3. 키 이름: `vela-backend` (구분용)
4. **Create** 클릭
5. 생성된 키를 **즉시 복사** → 메모장에 저장

> 중요: API 키는 생성 시 한 번만 보여줍니다!
> 잃어버리면 새로 만들어야 합니다.

### 필요한 두 가지 값

| 항목 | 위치 | 형태 |
|------|------|------|
| **API Key** | Settings → API Keys | `rpa_XXXXXXXXXXXXXXXXXXXX` |
| **Endpoint ID** | Serverless → Endpoint 클릭 | `abc123def456` |

---

## 6. VELA 백엔드 .env에 설정

VELA 백엔드 서버가 RunPod과 통신하려면 위 두 값을 설정해야 합니다.

### 설정 파일 수정

```bash
# backend 폴더의 .env 파일을 편집합니다
cd 클로드/08_ai-video-studio/backend

# .env.example을 복사 (처음 한 번만)
cp .env.example .env

# .env 파일을 열어서 수정
open -e .env   # Mac 기본 텍스트 편집기로 열기
```

### 수정할 부분

```env
# Mock 모드를 끄고 실제 RunPod 사용
MOCK_MODE=false

# RunPod API 키 (5번에서 복사한 값)
RUNPOD_API_KEY=rpa_여기에_실제_키_입력

# RunPod Endpoint ID (4번에서 확인한 값)
RUNPOD_ENDPOINT_ID=여기에_실제_ID_입력
```

> 중요: `.env` 파일은 절대 GitHub에 올리지 마세요!
> `.gitignore`에 이미 등록되어 있지만, 항상 주의하세요.

---

## 7. 테스트 curl 명령어

모든 설정이 끝났으면, 터미널에서 직접 테스트해봅시다.

### 텍스트 → 영상 생성 테스트 (동기 요청)

```bash
# ⚠️ [ENDPOINT_ID]와 [API_KEY]를 실제 값으로 변경!
curl -X POST "https://api.runpod.ai/v2/[ENDPOINT_ID]/runsync" \
  -H "Authorization: Bearer [API_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "mode": "text-to-video",
      "prompt": "A cat walking through a beautiful garden, cinematic lighting, 4K quality",
      "duration": 3,
      "resolution": "480p",
      "aspect_ratio": "16:9"
    }
  }'
```

> 첫 요청 시 모델 다운로드로 5~10분 걸릴 수 있습니다.
> 두 번째부터는 1~3분이면 됩니다.

### 비동기 요청 (긴 영상 생성 시 권장)

동기 요청(`/runsync`)은 응답이 올 때까지 기다려야 합니다.
긴 영상은 비동기(`/run`)로 요청하고, 나중에 결과를 확인하세요.

```bash
# 1단계: 작업 등록 (바로 응답 옴)
curl -X POST "https://api.runpod.ai/v2/[ENDPOINT_ID]/run" \
  -H "Authorization: Bearer [API_KEY]" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "mode": "text-to-video",
      "prompt": "Ocean waves crashing on a rocky shore at golden sunset, aerial drone shot",
      "duration": 5,
      "resolution": "720p",
      "aspect_ratio": "16:9"
    }
  }'
```

응답 예시:
```json
{
  "id": "sync-abc-123-def",
  "status": "IN_QUEUE"
}
```

```bash
# 2단계: 상태 확인 (완료될 때까지 반복)
# ⚠️ [JOB_ID]를 1단계 응답의 id 값으로 변경!
curl "https://api.runpod.ai/v2/[ENDPOINT_ID]/status/[JOB_ID]" \
  -H "Authorization: Bearer [API_KEY]"
```

상태값 의미:
| status | 뜻 |
|--------|-----|
| `IN_QUEUE` | 대기 중 (GPU 준비 중) |
| `IN_PROGRESS` | 생성 중 |
| `COMPLETED` | 완료! output에 결과 있음 |
| `FAILED` | 실패 (error에 원인 있음) |

### 완료 시 응답 예시

```json
{
  "id": "sync-abc-123-def",
  "status": "COMPLETED",
  "output": {
    "video_base64": "AAAAIGZ0eXBpc29t...(매우 긴 문자열)",
    "duration": 5,
    "resolution": "1280x720",
    "format": "mp4",
    "generation_time": 45.2
  }
}
```

### Base64 영상을 파일로 저장하기

테스트 결과의 `video_base64`를 실제 MP4 파일로 변환:

```bash
# jq가 필요합니다 (없으면: brew install jq)
# 응답 JSON에서 video_base64만 추출하여 MP4로 저장
curl -s "https://api.runpod.ai/v2/[ENDPOINT_ID]/status/[JOB_ID]" \
  -H "Authorization: Bearer [API_KEY]" \
  | jq -r '.output.video_base64' \
  | base64 -d > test_output.mp4

# 결과 확인
open test_output.mp4   # Mac에서 바로 재생
```

---

## 8. 비용 관리 팁

### 핵심 원칙: "스케일 투 제로"

**Min Workers = 0**으로 설정하면:
- 요청이 없을 때: GPU 꺼짐 → **비용 $0**
- 요청이 들어올 때: GPU 켜짐 → 사용한 만큼만 과금
- 단점: 첫 요청 시 "콜드스타트" 대기 (2~5분)

### GPU 종류별 비용 비교 (2025년 참고가)

| GPU | VRAM | 시간당 비용 | 5초 영상 1개 비용 | 추천 용도 |
|-----|------|-----------|-----------------|----------|
| **A40** | 48GB | ~$0.39/hr | ~$0.01 | 개인 사용 (가성비) |
| **A100** | 80GB | ~$0.76/hr | ~$0.02 | 고해상도, 긴 영상 |
| **H100** | 80GB | ~$1.74/hr | ~$0.05 | 최고 속도 필요 시 |

> 최신 가격은 RunPod 대시보드에서 확인하세요.

### 비용 절약 체크리스트

- [ ] **Min Workers = 0** 설정 (필수)
- [ ] **Idle Timeout = 60초** (빨리 꺼지게)
- [ ] **월 예산 상한 설정** (예: $30)
- [ ] **네트워크 볼륨 사용** ($1.5/월로 콜드스타트 단축)
- [ ] **테스트 시 480p 사용** (VRAM/시간 절약)
- [ ] **테스트 시 3초 영상** (가장 빠르고 저렴)

### 월 비용 시뮬레이션

| 사용 패턴 | 영상 수/월 | 예상 비용 |
|----------|----------|----------|
| 테스트만 | 10개 | $2~5 |
| 가벼운 사용 | 50개 | $8~20 |
| 활발한 사용 | 200개 | $25~60 |
| 볼륨 비용 | - | +$1.5/월 |

### 갑자기 비용이 많이 나왔을 때

1. RunPod 콘솔 → Serverless → Endpoint → **Workers** 탭 확인
2. 워커가 계속 켜져 있다면 → **Idle Timeout** 값 확인
3. 불필요한 Endpoint는 **삭제** (Delete)
4. Settings → Billing → **사용 내역** 확인

---

## 참고 링크

- [RunPod 공식 문서](https://docs.runpod.io)
- [RunPod Serverless 가이드](https://docs.runpod.io/serverless/quickstart)
- [Wan 2.1 GitHub](https://github.com/Wan-Video/Wan2.1)
- [Wan 2.1 HuggingFace](https://huggingface.co/Wan-AI/Wan2.1-T2V-14B-Diffusers)
- [Docker 공식 문서](https://docs.docker.com)

---

*VELA RunPod 설정 가이드 v1.0 — 2026-03-05*
