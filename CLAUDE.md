# 프로젝트 공통 규칙

이 디렉토리의 모든 프로젝트 작업 시 아래 규칙을 **항상 자동으로** 따릅니다.

---

## Verification & Honesty

Never report a task as successful without verifiable evidence. If you cannot confirm an action worked (e.g., Instagram post, API call, deployment), say so explicitly. Do not assume files exist — always check. When debugging, if the user says something is still broken after your fix, re-examine from scratch rather than insisting your fix was correct.

---

## Figma Integration

Figma MCP is READ-ONLY — it cannot create or modify design nodes. Do NOT attempt to create designs through Figma MCP, REST API, or automated plugin execution. Instead, generate design specs as structured JSON/HTML mockups, or create Figma plugin scripts the user can paste into Figma's dev console. Never spend more than one attempt trying to write to Figma before switching to an alternative output format.

---

## Firebase & Deployment

- Firebase sites use CDN caching — after deploying, always verify with cache-busting query params or `curl -H 'Cache-Control: no-cache'`.
- Firebase CLI login cannot be done programmatically in Claude's environment. If Firebase auth is needed, immediately ask the user to run `firebase login` manually rather than attempting workarounds.
- When deploying, always verify the live URL loads correctly before reporting success.
- Check Netlify bandwidth limits before deploying there; prefer Firebase Hosting for this user's projects.

---

## 1. 한국어 주석 규칙 (code.rules)

코드를 작성하거나 수정할 때 반드시 따릅니다.

모든 코드에는 비전공자도 이해할 수 있도록 한국어 주석을 달아야 합니다.

### 주석 작성 원칙

1. **쉬운 말 사용**: 전문 용어 대신 일상 언어로 설명
   - 나쁜 예: `// 비동기 함수로 API 엔드포인트에 HTTP GET 요청을 보냄`
   - 좋은 예: `// 서버에서 데이터를 가져오는 함수`

2. **무엇을 하는지 설명**: 코드가 왜 이 동작을 하는지, 어떤 결과가 나오는지 설명
   - 나쁜 예: `// i를 1씩 증가`
   - 좋은 예: `// 목록의 각 항목을 하나씩 순서대로 확인`

3. **블록 단위로 설명**: 함수, 반복문, 조건문 등 각 구역의 시작에 목적을 설명

4. **변수명 설명**: 변수가 무엇을 담고 있는지 명확히 설명
   - 예: `// userList: 현재 로그인한 사용자들의 목록`

5. **비유 활용**: 어려운 개념은 일상적인 비유로 설명
   - 예: `// 배열은 여러 물건을 담을 수 있는 서랍장과 같습니다`

### 주석 위치

- 파일 상단: 이 파일이 전체적으로 무슨 역할을 하는지
- 함수/클래스 위: 이 함수/클래스가 하는 일
- 복잡한 로직 위: 왜 이렇게 작성했는지
- 중요한 변수 옆: 변수가 담는 값의 의미

---

## 2. 프로젝트 폴더 구조 규칙

프로젝트 생성·아카이빙 시 아래 기준으로 저장 위치를 결정합니다.

| 프로젝트 유형 | 저장 위치 |
|-------------|---------|
| 바로이집(baroezip) 관련 프로젝트 | `클로드/01_baroezip/[프로젝트명]/` |
| 다른 브랜드 / 새로운 프로젝트 | `클로드/[프로젝트명]/` |

**판단 기준**: 사용자가 "바로이집의 ~" 또는 "바로이집 ~"라고 언급하면 `01_baroezip/` 하위에 생성. 그 외 새로운 브랜드·프로젝트는 `클로드/` 바로 아래에 새 폴더로 생성.

---

## 3. LLM 앱 콘텐츠 규칙 (contents.rules)

Shubhamsaboo/awesome-llm-apps 패턴 기반. LLM 앱 설계 및 구현 시 따릅니다.

### 앱 유형별 설계 규칙

**스타터 AI 에이전트 (입문)**: 단일 에이전트, 명확한 입력/출력, requirements.txt + .env.example 포함

**고급 AI 에이전트**: 도구(Tool) 정의 명시, 에이전트 실행 루프 설명, 에러 처리 및 재시도 로직 포함

**멀티에이전트 팀**: 각 에이전트 역할 분리, 에이전트 간 통신 방식 정의, 오케스트레이터가 전체 흐름 관리

**RAG**: 문서 로더 + 임베딩 모델 + 벡터 DB + 청킹 전략 모두 명시

**메모리 기반**: 단기(대화 이력) + 장기(벡터 DB) 메모리 구조 포함

**MCP 에이전트**: MCP 서버 설정 파일, 도구 정의 및 핸들러, 클라이언트-서버 통신 방식 포함

### 코드 구조 표준

프로젝트 생성 시 아래 구조를 기본으로 합니다:

```
프로젝트명/
├── README.md          # 프로젝트 설명, 실행 방법, 예시
├── requirements.txt   # 필요한 패키지 목록
├── .env.example       # 환경변수 템플릿 (실제 키 절대 포함 금지)
├── app.py             # 메인 앱 진입점
└── utils/             # 헬퍼 함수 모음 (선택)
```

### 모델 선택 기준

| 모델 | 적합한 상황 |
|------|-----------|
| GPT-4o | 복잡한 추론, 멀티모달 입력 |
| Claude 3.5+ | 긴 문서 처리, 안전성이 중요한 경우 |
| Gemini 1.5+ | 대용량 컨텍스트, Google 서비스 연동 |
| Llama / Qwen | 비용 절감, 로컬 실행, 데이터 프라이버시 |

### 필수 체크리스트

프로젝트 작업 완료 전 반드시 확인:

- API 키가 코드에 하드코딩되어 있지 않은가?
- .env 파일이 .gitignore에 포함되어 있는가?
- 에러 처리가 적절히 되어 있는가?
- README에 실행 방법이 명확히 적혀 있는가?
- 모델 비용(토큰 사용량)을 고려했는가?
