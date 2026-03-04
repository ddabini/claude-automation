# 프로젝트 메모리 (2026-03-04 세션 13 기준)

## 최근 세션 요약 (2026-03-04 세션 13 저녁 ~23:30)

### 핵심 작업 (3가지)
1. **Pikbox YouTube 탭 고도화**:
   - ytAnalyzeVideo() 함수: 영상 메타데이터 기반 자동 분석 (유형/길이/조회수/참여도/해시태그/광고 분석)
   - **Pikbox 코멘트 블록** 추가: 성과 원인 분석 (조회수·참여도·제목·길이·목차 기반)
   - 롱폼 영상 부족 해결: video 칩에서 medium(4~20분) + long(20분+) 병렬 검색 → 최대 50개 확보
   - searchYouTubeAPI에 videoDuration 파라미터 추가
   - 탭 상태 유지: localStorage 활용 → 새로고침 시 마지막 탭 복원
   - **급상승 동영상** 자동 표시: ytLoadTrending() (YouTube API mostPopular 30건)
   - 배포 완료: https://pikbox-app.web.app

2. **DeepDig AI 최신 현황 위클리 리포트 신규 생성**:
   - `07_AI최신현황위클리/` 폴더 생성 (report/ + raw-data/)
   - **cat_006** 카테고리 + **rpt_011** 보고서 등록
   - 내용: Claude 4.6, ChatGPT GPT-5.3, Gemini 3 Flash, Cursor Cloud Agents, Windsurf 등 46개 출처
   - registry.js 등록 완료
   - 배포 완료: https://deepdig-app.web.app

3. **DeepDig 리포트 수집 기간 규칙 확정**:
   - 데일리: 직전 24시간
   - 위클리: 7일간 (업로드일 기준)
   - 먼슬리: 당월 전체
   - 어뉴얼: 지난해 전체
   - 콘텐츠 원칙: 직전 리포트 대비 변화점 + 신규 + 주목 이슈 중심

### 핵심 학습
- **YouTube 영상 분석 로직**: 길이·조회수·참여도 자동 판별 → 카테고리별 성과 인사이트 제공
- **YouTube API 할당량**: 월 1M 요청 (구글 클라우드 무료 크레딧 범위 내)
- **masonic 레이아웃 성능**: CSS grid 기반으로 대량 이미지 로드 시 reflow 최소화
- **리포트 수집 원칙**: 정적 일관성 > 완전성 (수집 기간 고정으로 컨텐츠 비교 가능)

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

## 최근 세션 (2026-03-04 세션 10 추가)

### Pikbox YouTube 탭 리디자인
- **작업**: YouTube 탭 4필터(영상/쇼츠/광고/커뮤니티) → CSS Grid → masonic 레이아웃 전환 (Pinterest 스타일)
- **API**: YouTube Data API v3 (auto-login-executor로 Google Cloud Console에서 자동 발급)
  - API 키: AIzaSyDsJ7_tk2E8Wcp2kazlqg7fIri4BboRNrA (gogumiyo4@gmail.com)
  - 검증: `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&maxResults=1&key={KEY}`

### 레퍼런스 탭 이미지 저장소 문제 해결
- **근본 원인**: 이미지가 IndexedDB에만 저장 → IndexedDB는 브라우저 로컬 저장소 (다른 기기 접근 불가)
- **해결책**: handleFileSelect를 Firebase Storage 업로드 방식으로 수정 + 자동 마이그레이션 함수 추가
- **작업**:
  - 11개 죽은 indexeddb:// 이미지 DB에서 삭제 (blob 복구 불가)
  - 정상 Firebase Storage 이미지 4개만 유지
  - 이미지 프록시 시스템 추가 (wsrv.nl, weserv.nl, corsproxy.io)
- **배포**: Firebase Hosting (https://pikbox-app.web.app)

### 핵심 학습 포인트
| 항목 | 학습 내용 |
|------|---------|
| **IndexedDB 한계** | 브라우저 로컬 저장 → 기기 간 공유 불가. 이미지는 Firebase Storage 필수 |
| **Google Cloud Console 자동화** | "사용" 버튼이 쿠키 배너에 가려질 수 있음 → JS scrollIntoView + click() 강제 클릭 필수 |
| **YouTube API 키 표시** | "키 표시" 버튼 클릭 필수 (기본 마스킹 상태) — auto-login-executor에 "키 표시" 우클릭 좌표 클릭 로직 추가 |
| **iCloud 동기화 갈등** | 파일 수정 중 동기화 충돌 가능 → Edit 전 반드시 Read로 최신 상태 확인 |
| **이미지 CORS 프록시** | Firebase Storage + CORS 문제 → weserv.nl 등 프록시 서비스 활용 |

## 다음 세션 시 확인사항
- Pikbox YouTube 탭 API 응답 속도 및 캐싱 전략 (월 할당량 1M 요청)
- 마소닉 레이아웃 성능 (large scale 이미지 로드 시 reflow 최적화)
- MCP 서버 연결 상태 (`.mcp.json` + GEMINI_API_KEY)
- PADO 퍼퓸 프로젝트 상태 (테스트 프로젝트 정리 필요)
