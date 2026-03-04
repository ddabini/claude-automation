# 프로젝트 메모리 (2026-03-04 세션 12 기준)

## 최근 세션 요약 (2026-03-04 세션 12)

### 핵심 작업
- **빌트인 스킬 5개 → 디자인 에이전트 3개에 직접 통합**: canvas-design, frontend-design, brand-guidelines, theme-factory, web-artifacts-builder의 원칙을 design-reference-archiver/design-asset-generator/design-figma.md에 내장
- **MCP 인프라 구축**: mcp-image (Gemini API) + Playwright 폴백 체인 설정
- **PADO 퍼퓸 파이프라인 테스트**: 기획→카피→레퍼런스→에셋→HTML→Pikbox 풀 실행
- **8건 문제 수정**: CLAUDE.md (brand-kit 추가), leader.rules.md (섹션 12 + "테스트 스킵 금지"), 에이전트 메모리, MCP 설정

### 핵심 학습
- **빌트인 스킬은 자동 전달 불가** → 에이전트 .md 파일에 원칙 직접 기록
- **"테스트" 요청 시 에이전트 스킵 금지** (leader §5 추가)
- **brand-kit 자동 로드** (leader §7 신설)
- **세리프 폰트 일체 거부** — 사용자 선호 우선
- **MCP 폴백**: mcp-image 실패 → Playwright (반복 시도 금지)
- **Pikbox 업로드 폴백**: Bash → Node.js → leader 위임

---

## 상세 내용 참조
- **에이전트 시스템**: [agent-system.md](./agent-system.md)
- **기술 패턴**: [survey-app-patterns.md](./survey-app-patterns.md)
- **Figma 플러그인**: [figma-plugin-setup.md](./figma-plugin-setup.md)
- **공통 오류**: [common-errors.md](./common-errors.md)

---

## 프로젝트 구조

| 프로젝트 | 폴더 | 기술 | 배포 |
|---------|------|------|------|
| Pikbox | `02_pikbox/` | 단일 HTML + Firebase | https://pikbox-app.web.app |
| DID 광고 매니저 | `03_did-ad-manager/` | 단일 HTML + Firebase | https://did-ad-manager.web.app |
| DeepDig | `04_deepdig/` | 단일 HTML + registry.js | https://deepdig-app.web.app |
| PADO 퍼퓸 | `07_pado_perfume/` | 테스트 프로젝트 | 미배포 |

---

## 팀장 시스템 상태 (2026-03-04)
- **leader 에이전트** → **leader.rules 스킬** 전환 완료 (세션 11)
- **섹션**: 0~12 (13개 섹션)
  - §0: 자동 세이브 포인트
  - §1~2: 라우팅 + 파이프라인
  - §3~5: 품질 게이트 + 에이전트 스킵
  - §6~11: Figma + 확장 + 에러 리커버리 + 작업 계획 + 최종 보고
  - **§12**: 빌트인 통합 + 폴백 체인 (2026-03-04 신규)

---

## 최근 규칙 변경 (2026-03-04)

### CLAUDE.md
- 파괴적 Git 명령어 9종 금지 (§1)
- **brand-kit 폴더 표준** (§2.2) — 프로젝트별 가이드/로고/이미지 저장, leader가 자동 로드

### leader.rules.md
- **§5**: "테스트" 요청 시 에이전트 스킵 금지 (완전성 우선)
- **§7**: brand-kit 자동 로드 프로토콜 (파이프라인 시작 시)
- **§12**: 빌트인 스킬 통합 + MCP/Pikbox 폴백 체인

---

## 사용자 선호도 확정 (2026-03-04)

### 디자인
- **폰트**: 산세리프만 (Paperlogy, Raleway, Pretendard, Josefin Sans) — **세리프/궁서체 절대 거부**
- **테마**: 라이트 테마 선호 (DID 광고는 다크 허용)
- **컬러**: 솔리드 + text-shadow (gradient-clip 거부)
- **아이콘**: 면채움(Solid Fill) 선호 (라인아트 거부)
- **레이아웃**: 가로 배치 카드 선호 (세로 나열 거부)

### 기술
- **코드**: 비전공자도 이해하는 한국어 주석 필수
- **배포**: Firebase Hosting 기본 (Netlify 불가)
- **구조**: 단일 HTML (CSS/JS 인라인) 선호
- **백엔드**: Firebase Realtime DB + Cloud Storage

---

## MCP 설정 (2026-03-04)

### mcp-image (Gemini API)
- 파일: `.mcp.json` (프로젝트 루트)
- 서버: mcp-image (Gemini Nano)
- API 키: GEMINI_API_KEY (`.env`에 저장)
- 제외: `.mcp.json` + `mcp-images/` (.gitignore)

### 폴백 체인
1. **이미지 생성**: mcp-image → Playwright → SVG 수동 코딩
2. **Pikbox 업로드**: Bash curl → Node.js 스크립트 → leader 위임(Playwright)

---

## 다음 세션 시 확인사항
- MCP 서버 연결 상태 (`.mcp.json` + GEMINI_API_KEY)
- PADO 퍼퓸 프로젝트 상태 (테스트 프로젝트 정리 필요)
- Pikbox 업로드 폴백 체인 검증
