# 프로젝트 메모리 (2026-03-06 세션 16 기준)

## 최근 세션 요약 (2026-03-06 세션 16 - Pinterest API 완전 전환)

### 핵심 작업 (1가지)
**Pikbox Pinterest 검색 품질 대폭 개선 — Puppeteer 삭제 → Pinterest 내부 API 직접 호출**

**문제점**:
- 기존 방식 (Puppeteer + 모바일 UA 스크래핑): 474x 저해상도, 영어 auto-alt 제목만, 14~21개 결과
- 실제 Pinterest: 736x+ 고해상도, 한국어 제목, 50개+ 결과

**원인 분석**:
- Puppeteer가 모바일 페이지를 로드 → 모바일 버전은 474x 영상만 제공
- img.alt는 AI 자동 설명 (영어)
- DOM 스크래핑의 근본 한계

**해결책 (성공)**:
- Pinterest 내부 API 역공학: `POST kr.pinterest.com/resource/BaseSearchResource/get/`
- **핵심 발견**:
  - kr.pinterest.com은 비로그인 쿠키만으로 작동 (인증 필수 아님 — research-crawler 보고 수정됨)
  - 요청: POST (GET 아님) + field_set_key: "unauth_react"
  - 응답: 원본 해상도 + 한국어 제목 + 무한 페이징 (bookmark 토큰)
  - 쿠키 자동 획득: kr.pinterest.com GET 1회 → _pinterest_sess + csrftoken 발급
  - 세션 유효: 1시간 → 메모리 캐시로 최적화

**변경 파일**:
1. `functions/index.js`:
   - searchPinterest 함수 전면 재작성 (Puppeteer 삭제)
   - 메모리: 2GB → 256MB, 타임아웃: 120s → 30s, 인스턴스: 3 → 5
   - pinterestSession 전역 변수 (1시간 캐시)
   - 2페이지 자동 페이징 (limit > 25일 때)
   - 세션 만료 시 자동 초기화

2. `02_pikbox/개발/파일/pikbox.html`:
   - searchPinterestNative 함수 업데이트
   - 타임아웃: 45s → 15s, limit: 25 → 50
   - origUrl 필드 추가 (원본 다운로드용)

**배포 및 검증** (6개 키워드 모두 성공):
- 네이버페이: 50개, 736x, 한국어 제목 ✓
- 토스앱: 50개, 736x, 한국어 제목 ✓
- 카페 인테리어: 25개, 736x, 한국어 제목 ✓
- 화보 촬영: 25개, 736x, 한국어 제목 ✓
- sns 마케팅: 25개, 736x, 한국어 제목 ✓
- 브랜드 디자인: 25개, 736x, 한국어 제목 ✓

**Git 커밋**: `[auto-save] Pinterest API 전환 — Puppeteer 삭제, 내부 API 직접 호출, 이미지 품질/속도 대폭 개선`

---

## 최근 세션 요약 (2026-03-05 세션 11 - Pikbox YouTube 탭 완성)

### 핵심 작업 (1가지)
1. **Pikbox YouTube 탭 대규모 개선 완료**:
   - **사이드바 상시 표시 구조**: 레퍼런스 탭과 동일한 CSS 패턴 (260px 너비, 핸들바, 횡스크롤)
   - **선택/삭제/드래그 선택**: ytToggleSelect() 자동 활성화, 멀티선택 모드 체크박스
   - **플레이어 모달 액션 바**: (#ytPlayerActions) 즐겨찾기(☆/★) + 저장 버튼(📥/✓) 추가
   - **탭 상태 유지**: localStorage activeView로 새로고침 후 마지막 탭 복원
   - **기능 제거**: ytDeepAnalyzeVideo() 함수 (~170줄) 삭제 — 영상 직접 시청 분석 제거
   - **DB 경로**: `pikbox/yt-categories/{id}` + `pikbox/yt-videos/{id}`
   - **배포**: Firebase https://pikbox-app.web.app 완료 (HTTP 200 확인)

### 기술 학습
- **사이드바 CSS 일관성**: 레퍼런스 탭의 `.sidebar-header` + `.category-item` 패턴을 YouTube 탭도 동일 적용
- **액션 바 UI 패턴**: 모달 타이틀 바 아래 플렉스 박스로 액션 배치 (저장 상태별 UI 토글)
- **localStorage 탭 상태**: activeView 값을 저장/복원으로 사용자 경험 향상
- **DB 경로 설계**: yt-categories / yt-videos로 명확한 데이터 구조 분리

---

## 최근 세션 요약 (2026-03-05 세션 15 - 시안 삭제)

### 핵심 작업 (1가지)
**테스트 시안 전체 삭제** - 사용자 요청으로 진행:
1. **리뉴얼 홍보 시안** 삭제:
   - 폴더: `01_baroezip/05_AI에이전트_리뉴얼/` (완전 삭제)
   - Pikbox 설계 리뷰 DB: 관련 3건 삭제 (design-review/designs)
   - Firebase Storage: HTML 1개 삭제
2. **파도 퍼퓸(PADO) 시안** 삭제:
   - 폴더: `07_pado_perfume/` (완전 삭제)
   - Pikbox 설계 리뷰 DB: 관련 1건 삭제
   - Firebase Storage: HTML 2개 삭제
3. **Pikbox 초기화**:
   - design-review/designs (4건) → null
   - design-review/messages 전부 삭제
   - design-review/nicknames 전부 삭제
   - design-review/users 전부 삭제
4. **Git 커밋**: `[auto-save] 테스트 시안 삭제 (리뉴얼 홍보 + 파도 퍼퓸)`

### 메모리 정리
- MEMORY.md §"프로젝트 구조"에서 `07_pado_perfume` 행 제거
- MEMORY.md §"다음 세션 시 확인사항"에서 "PADO 퍼퓸 프로젝트 정리" 항목 제거
- 메인 MEMORY.md에는 테스트 프로젝트 삭제 이력만 기록 (상세 내용 불필요)

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

## Pikbox 검색 엔진 현황 (2026-03-06 Pinterest API 전환)

| 플랫폼 | 방식 | 특징 | 최대 결과 |
|--------|------|------|---------|
| Instagram | Cloud Functions 크롤링 | 비로그인 쿠키 → 캡션 수집 | 50+ |
| Meta Ads | Google Ads Transparency API | Ad Library 크리에이티브 | 50+ |
| **Pinterest** | **내부 API 직접** (2026-03-06) | **비로그인 세션, 1h 캐시** | **50+ (무한 페이징)** |
| Unsplash/Pexels/Pixabay | Serper.dev fallback | 공개 API | 50 (플랫폼별) |

**Pinterest API 최적화**:
- 요청 포맷: `POST kr.pinterest.com/resource/BaseSearchResource/get/`
- 응답 품질: 736x+ (모바일 474x → 웹 고해상도로 승격)
- 세션 캐시: 1시간 유지 (같은 쿠키로 재사용)
- Cloud Function 메모리/타임아웃: 2GB→256MB, 120s→30s (효율 5배 개선)

---

## 다음 세션 시 확인사항
- Pinterest API 안정성 모니터링 (kr.pinterest.com 정책 변경 감지)
- Cloud Function searchPinterest 호출 로그 (실패율, 응답시간)
- Pikbox YouTube 탭 API 응답 속도 (월 할당량 1M 요청 추적)
- MCP 서버 연결 상태 (`.mcp.json` + GEMINI_API_KEY)
