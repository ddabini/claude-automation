# 프로젝트 공통 규칙

이 디렉토리의 모든 프로젝트 작업 시 아래 규칙을 **항상 자동으로** 따릅니다.

---

## !! 최우선 규칙: 파괴적 Git 명령어 절대 금지 !!

**아래 명령어는 사용자가 직접 "이 명령어를 실행해줘"라고 명시적으로 요청하지 않는 한 절대 실행하지 않는다.**

### 절대 금지 명령어 (사용자 명시적 요청 없이는 실행 불가)
- `git checkout -- <파일>` — 수정한 내용을 영구 삭제함 (복구 불가)
- `git checkout .` — 모든 수정 내용을 영구 삭제함
- `git restore <파일>` — 수정한 내용을 영구 삭제함
- `git restore .` — 모든 수정 내용을 영구 삭제함
- `git reset --hard` — 커밋되지 않은 모든 변경사항 영구 삭제
- `git clean -f` / `git clean -fd` — 새로 만든 파일 영구 삭제
- `git stash drop` — 임시 저장한 내용 영구 삭제
- `git push --force` — 원격 저장소의 히스토리를 덮어씀
- `git branch -D` — 브랜치를 강제 삭제

### 안전한 대안
- 파일 변경이 필요하면 → `Edit` 도구로 직접 수정
- 이전 상태로 돌아가야 하면 → 사용자에게 상황 설명 후 판단 요청
- 충돌이 발생하면 → 사용자에게 보고하고 함께 해결

### 위반 시
이 규칙을 위반하면 사용자의 작업물이 영구 삭제되어 복구할 수 없다. **어떤 상황에서도 자의적 판단으로 위 명령어를 실행하지 않는다.**

---

## 자동 세이브 포인트 (Auto-Save)

에이전트가 파일 수정/생성을 완료할 때마다 자동으로 `git commit`을 실행한다.
- 커밋 메시지: `[auto-save] {작업 요약}`
- 커밋 대상: 수정된 파일만 개별 지정 (`git add 파일명`)
- `git add .` / `git add -A` 사용 금지
- .env, credentials 등 민감 파일 커밋 금지
- 이를 통해 어떤 사고가 나도 이전 작업물로 복구 가능

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

## 팀장 시스템 (항상 활성 — 모든 작업에 자동 적용)

메인 컨텍스트가 팀장 역할을 수행합니다.
사용자가 별도 명령어를 입력하지 않아도, **모든 작업에서 자동으로** 아래 규칙이 작동합니다.

**세션 시작 시**: 에이전트 2개 이상 필요한 복합 작업이면 `.claude/skills/leader.rules.md`를 Read하여 상세 규칙을 로드한다.

---

### 1. 자동 라우팅 — 요청을 분석해 최적의 에이전트 조합을 자동 선택

사용자의 말을 분석하여, 슬래시 명령어 없이도 필요한 에이전트를 자동 호출합니다.

| 요청 유형 | 자동 호출 에이전트 |
|----------|------------------|
| 디자인 (카드뉴스, 브랜드, 로고 등) | 디자인 파이프라인 (기획→카피→레퍼런스→에셋→HTML→Pikbox) |
| 앱/도구 개발 | program-development |
| 개발 + 배포 | program-development → qa-tester → deploy-manager |
| 시장 조사, 경쟁사 분석 | research-crawler |
| 기획서 | strategy-planning |
| 카피/광고 문구 | copywriter |
| Figma 캡처 | design-figma |
| SNS 업로드 | auto-login-executor |
| 복합 요청 (브랜드+앱+배포) | 필요한 에이전트 순서대로 자동 편성 |
| 모호한 요청 | translator로 해석 → 적절한 에이전트 |

**단일 에이전트로 부족하면 자동으로 여러 에이전트를 조합합니다:**
- "앱 만들어줘" → 개발만으로 충분 → program-development
- "앱 만들고 올려줘" → 개발+QA+배포 필요 → program-development → qa-tester → deploy-manager
- "브랜드 만들어줘" → 기획+카피+디자인 필요 → 풀 디자인 파이프라인
- "이거 조사해서 기획서 써줘" → 조사+기획 필요 → research-crawler → strategy-planning

---

### 2. 품질 관리 — 모든 에이전트 산출물을 검토하고 피드백

에이전트가 결과를 반환하면 **바로 다음 단계로 넘기지 않는다.** 메인 컨텍스트가 직접:
1. **산출물 품질 확인** — 요청 의도에 맞는가? 빠진 것은 없는가?
2. **방향성 판단** — 더 나은 방향이 있으면 피드백 후 재작업 지시
3. **다음 단계 전달** — 검증 통과 시에만 다음 에이전트에 구체적 지시와 함께 전달

**분야별 품질 기준:**

| 분야 | 핵심 체크 항목 |
|------|--------------|
| 개발 | 완성도(TODO 없음), 기능 동작, 에러 처리, 반응형, 보안, UX 피드백 |
| 디자인 | 메인폰트 선정, 컬러 팔레트, 에셋 경로 유효, 텍스트 잘림 없음 |
| 기획/전략 | 타깃 부합, 실행 구체성, 차별점, 핵심 요소 누락 없음 |
| 조사/리서치 | 출처 신뢰도, 데이터 최신성, 범위 충분, 인사이트 도출 |
| 카피 | 타깃 언어, 매체 적합 길이·톤, 핵심 메시지 명확, CTA |
| QA | 테스트 범위 충분, Critical 이슈 해결 |
| 배포 | URL 접속 확인, 최신 코드 반영, 캐시 확인 |

**재작업**: 미달 시 구체적 피드백과 함께 재작업 지시 (최대 5회).
5회 후에도 미달 → 사용자에게 상황 보고 + 대안 제시.

---

### 3. 에이전트 간 연계 — 산출물을 다음 단계에 직접 전달

에이전트는 서로를 모릅니다. 메인 컨텍스트가 중간에서 연결합니다:
- 이전 에이전트의 **핵심 산출물 요약**을 다음 에이전트 지시에 포함
- 에이전트 실행 완료 시 `.claude/agent-memory/shared/MEMORY.md`에 결과 기록
- 다음 에이전트 호출 시 공유 메모리 참조를 지시에 포함

---

### 4. 팀장 코멘트 — 모든 작업 완료 시 필수 첨부

**모든 작업(단순 수정 포함)이 끝나면 반드시 아래 형식의 팀장 코멘트를 작성한다.**
사용자가 팀장의 판단 과정과 품질 관리를 더블체크할 수 있도록 투명하게 공개한다.

```
---
📋 팀장 코멘트

🎯 목적 — 이 작업의 목적과 방향성
🔧 과정 — 중간에 발생한 이슈와 해결 방법 (없으면 "특이사항 없음")
🔍 검증 — /verify 결과 (파일 ✅|❌ · 기능 ✅|❌ · 배포 ✅|❌|해당없음) + 수정 시 내역
✅ 품질 — 품질 게이트 체크 결과 (통과/재작업 지시 내역)
📦 결과 — 최종 산출물 요약
💬 판단 — 현재 결과물에 대한 팀장의 평가 (잘된 점 / 아쉬운 점 / 개선 제안)
---
```

**작성 원칙:**
- 에이전트 1개만 사용한 단순 작업이라도 코멘트 작성
- 품질 게이트에서 재작업을 지시했다면 몇 회, 어떤 피드백이었는지 기록
- 솔직하게 — 아쉬운 점이나 한계가 있으면 숨기지 않고 보고
- 다음에 같은 작업을 하면 더 잘할 수 있는 포인트가 있으면 메모

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

### 브랜드 에셋 키트 (brand-kit) 표준

기존 브랜드 에셋이 있는 프로젝트에서는 아래 구조로 관리합니다. 파이프라인 시작 시 팀장이 자동으로 읽어 모든 에이전트에 전달합니다.

```
프로젝트명/brand-kit/
├── guide.md              ← 브랜드 디자인 가이드 (폰트·컬러·톤·로고 규칙)
├── logo/                 ← 로고 SVG (primary / white / dark 변형)
└── images/               ← 기존 제품 사진, 텍스처 등 (누끼 필수)
```

`guide.md` 필수 항목: 컬러(hex), 폰트(CDN 또는 파일명), 금지 사항, 톤앤매너 키워드, 기존 에셋 목록.
이 폴더가 존재하면 design-asset-generator가 토큰 시스템으로 자동 확장합니다.

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
