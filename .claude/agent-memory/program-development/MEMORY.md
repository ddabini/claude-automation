# program-development 에이전트 메모리

## 관련 에이전트 메모리 참조

| 에이전트 | 참조 시점 | 참조 내용 |
|---------|----------|----------|
| strategy-planning | 기획 브리프 참조 시 | 기능 요구사항·사용자 플로우 |
| design-asset-generator | 에셋 가이드 참조 시 | 폰트·컬러·에셋 경로 (디자인 파이프라인 경유 시) |
| qa-tester | 개발 완료 후 | 기능·반응형·보안 검증 |
| deploy-manager | QA 통과 후 | Firebase 배포 |

## 사용자 확정 선호

- 모든 코드에 **한국어 주석** 필수 (비전공자 수준)
- **단일 HTML 파일** 구조 선호 (CSS/JS 인라인)
- 백엔드: **Firebase Realtime DB + Cloud Storage** (Supabase 무료 한도 소진)
- Firebase SDK: **compat v10.8.0 CDN** 방식
- Firebase config: **HTML 하드코딩** (localStorage 방식 폐기 — 기기 간 공유 불가)
- 배포: **Firebase Hosting** 기본 (2026-02-28 Netlify 크레딧 소진으로 전면 이전)
  - Firebase 프로젝트: `did-ads` / 멀티사이트 / 설정: `클로드/firebase.json` + `.firebaserc`
  - 배포 명령: `firebase deploy --only hosting --project did-ads`
- 한글 폴더명 배포 불가 → 영문 폴더 복사 후 배포

## 검증된 기술 패턴

- Firebase Realtime DB: `firebase.database().ref().on('value', ...)` 실시간 동기화
- Firebase Cloud Storage: 드래그앤드롭 업로드 + 미리보기
- fetch() 직접 사용 (CDN 라이브러리 대신)
- async/await 체인: 부모 함수도 반드시 async 선언
- **이미지 검색 API**: Google CSE 신규 차단 → **Serper.dev** 사용 (월 2,500회 무료)
  - 엔드포인트: `POST https://google.serper.dev/images`
  - 헤더: `X-API-KEY: [API_KEY]`, `Content-Type: application/json`
  - 계정: gogumiyo4@gmail.com (2026-02-27 가입)

## 완료 프로젝트 참조

| 프로젝트 | 파일 | 특징 |
|---------|------|------|
| DID 광고 프로그램 | `03_did-ad-manager/개발/파일/admin.html` + `display.html` | Firebase 실시간 동기화, 4K 슬라이드쇼 |
| Pikbox (레퍼런스 컬렉터) | `02_pikbox/개발/파일/pikbox.html` | **Serper.dev API** (Google CSE 대체), 단일 HTML 4126줄, 큐레이션 카테고리 바 + 스켈레톤 shimmer + 자동 쿼리 확장 |
| DeepDig (리서치 아카이브) | `04_deepdig/index.html` + `registry.js` | 자동화 스크립트(launchd, ~/scripts/deepdig/), Firebase Hosting |
