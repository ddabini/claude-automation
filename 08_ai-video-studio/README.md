# VELA — AI 영상 제작 플랫폼

> **"텍스트에서 스크린으로, 생각이 영상이 되다"**
>
> 텍스트 한 줄 입력하면 AI가 영상을 만들어주는 올인원 영상 제작 플랫폼입니다.
> 영상 생성 + 편집 + 자막 + BGM + 내보내기를 하나의 플랫폼에서 처리합니다.

---

## 빠른 시작

### 1. 로컬 도구 설치

```bash
# Mac (M1/M2/M3)에 필요한 AI 도구를 자동 설치합니다
# (FFmpeg, Python, whisper.cpp, rembg, Node.js 등)
chmod +x setup/setup-mac.sh
bash setup/setup-mac.sh
```

### 2. 백엔드 실행

```bash
cd backend

# 환경변수 설정 (최초 1회)
cp .env.example .env
# .env 파일을 열어 RunPod API 키 등을 입력 (Mock 모드면 그대로 사용 가능)

# 의존성 설치 & 서버 시작
npm install
npm start
# → http://localhost:3001 에서 실행됩니다
```

### 3. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173 에서 실행됩니다
```

### 4. (선택) RunPod GPU 워커 설정

RunPod 없이도 Mock 모드로 테스트할 수 있습니다.
실제 AI 영상 생성을 원한다면 RunPod 설정이 필요합니다:

```bash
# 상세 가이드 참고
cat setup/setup-runpod.md
```

또는 `gpu-worker/README.md`에서 Docker 빌드부터 배포까지 전 과정을 확인하세요.

---

## Mock 모드

RunPod GPU 없이도 VELA의 전체 UI와 워크플로우를 테스트할 수 있습니다.

`backend/.env` 파일에서:
```env
MOCK_MODE=true
```

Mock 모드에서는:
- 영상 생성 요청 시 → 샘플 영상 또는 플레이스홀더 반환
- 자막 생성 요청 시 → 더미 자막 데이터 반환
- 실제 GPU/API 비용 발생 없음
- UI/UX 개발 및 디버깅에 최적

---

## 아키텍처

```
┌─────────────────────────────────────────────────┐
│            프론트엔드 (브라우저)                     │
│     React + TypeScript + Zustand + Vite          │
│     WebSocket (실시간 진행률) + WebGL (프리뷰)     │
└────────────────────┬────────────────────────────┘
                     │ HTTP + WebSocket
┌────────────────────▼────────────────────────────┐
│              백엔드 API 서버                       │
│     Node.js + Express + Socket.io                │
│     ┌──────────────────────────────────┐         │
│     │ AI API 프록시 (RunPod / Whisper)  │         │
│     │ FFmpeg 워커 (영상 처리)            │         │
│     └──────────────────────────────────┘         │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┼────────────────┐
        ▼            ▼                ▼
   ┌─────────┐ ┌──────────┐  ┌──────────────┐
   │ RunPod  │ │ Firebase │  │ 로컬 AI 도구  │
   │ GPU     │ │ Storage  │  │ whisper.cpp  │
   │ (Wan2.1)│ │ Auth/DB  │  │ rembg        │
   └─────────┘ └──────────┘  └──────────────┘
```

### 폴더 구조

```
08_ai-video-studio/
├── README.md              ← 지금 보고 있는 파일
├── frontend/              ← React 프론트엔드 (Vite + TypeScript)
│   ├── index.html
│   ├── package.json
│   └── src/               ← 소스코드
├── backend/               ← Node.js 백엔드 서버
│   ├── package.json
│   ├── server.js          ← 메인 서버 진입점
│   ├── .env.example       ← 환경변수 템플릿
│   └── .gitignore
├── gpu-worker/            ← RunPod 서버리스 GPU 워커
│   ├── handler.py         ← Wan 2.1 영상 생성 핸들러
│   ├── Dockerfile         ← GPU 워커 컨테이너 설정
│   ├── requirements.txt   ← Python 의존성
│   └── README.md          ← RunPod 설정 가이드
├── setup/                 ← 설치 스크립트 & 가이드
│   ├── setup-mac.sh       ← M1 Mac 로컬 도구 설치
│   └── setup-runpod.md    ← RunPod 설정 완전 가이드
└── 전략기획/               ← 기획 문서
    └── 5_기획안_최종완성본.md
```

---

## 핵심 기능 (Phase 1 MVP)

| 기능 | 설명 | 기술 |
|------|------|------|
| **텍스트 → 영상** | 프롬프트 입력 → AI가 영상 생성 | Wan 2.1 (RunPod GPU) |
| **이미지 → 영상** | 사진 업로드 → 모션 영상 변환 | Wan 2.1 I2V |
| **AI 자동 자막** | 영상 업로드 → 자막 자동 생성 | whisper.cpp / Whisper API |
| **내보내기** | MP4 다운로드 (720p/1080p, 16:9/9:16/1:1) | FFmpeg |

---

## 기술 스택

| 분류 | 기술 | 선택 이유 |
|------|------|----------|
| 프론트엔드 | React 18 + TypeScript + Vite | 빠른 개발, 타입 안전성 |
| 상태관리 | Zustand | 경량 (8KB), 보일러플레이트 없음 |
| 스타일 | TailwindCSS | 빠른 UI 구축 |
| 백엔드 | Node.js + Express | AI API 비동기 처리 최적 |
| 실시간 통신 | Socket.io | 생성 진행률 실시간 표시 |
| 영상 처리 | FFmpeg | 업계 표준 (YouTube/Netflix 사용) |
| AI 영상 생성 | Wan 2.1 on RunPod | 오픈소스, 고품질, 비용 효율적 |
| 음성 인식 | whisper.cpp | M1 최적화, 로컬 실행, 비용 0원 |
| 배경 제거 | rembg | 로컬 실행, 비용 0원 |
| 인증/저장소 | Firebase | 기존 인프라 재사용 |

---

## 비용 예상

### RunPod GPU (서버리스 — 사용한 만큼만)

- 테스트: 월 $2~5 (영상 10개 기준)
- 일반 사용: 월 $8~20 (영상 50개 기준)
- **사용하지 않을 때 비용 $0** (스케일 투 제로)

### 인프라

- Firebase (Auth + Storage + DB): 무료 티어 내
- Cloud Run (백엔드): $5~15/월

### 로컬 AI 도구

- whisper.cpp (자막): **$0** (로컬 실행)
- rembg (배경 제거): **$0** (로컬 실행)

**총 예상: 약 $10~40/월 (내부 프로토타입 기준)**

---

## 개발 로드맵

| Phase | 기간 | 핵심 기능 |
|-------|------|----------|
| **Phase 1 — MVP** | 4~6주 | 텍스트/이미지→영상, 자막, 내보내기 |
| Phase 2 — 편집 | 8~12주 | 타임라인 에디터, BGM, 트랜지션 |
| Phase 3 — 데스크톱 | 16~20주 | Electron 앱, 로컬 AI 통합 |
| Phase 4 — 플랫폼 | 미정 | 팀 협업, 템플릿 마켓 |

자세한 기획은 `전략기획/5_기획안_최종완성본.md` 참고.

---

*VELA v0.1.0 — 2026-03-05*
