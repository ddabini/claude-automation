# deploy-manager 에이전트 메모리

## 관련 에이전트 메모리 참조

| 에이전트 | 참조 시점 | 참조 내용 |
|---------|----------|----------|
| qa-tester | 배포 전 | QA 통과 여부·잔존 이슈 확인 |
| program-development | 배포 대상 파악 시 | HTML 파일 경로·Firebase 연동 여부 |
| research-crawler | DeepDig 자동 배포 시 | registry.js 변경 여부·보고서 경로 |

## 배포 이력 (2026-02-28 기준 — Firebase Hosting 전면 이전 완료)

| 프로젝트 | 플랫폼 | URL | 비고 |
|---------|--------|-----|------|
| DID 광고 프로그램 | Firebase Hosting | https://did-ad-manager.web.app | 타겟: didadmin |
| Pikbox (레퍼런스 컬렉터) | Firebase Hosting | https://pikbox-app.web.app | 타겟: pikbox |
| DeepDig (리서치 아카이브) | Firebase Hosting | https://deepdig-app.web.app | 타겟: deepdig |

> 구 Netlify URL(netlify.app)은 2026-02-28 크레딧 소진으로 접속 차단 (3/26 리셋)

## Firebase Hosting 멀티사이트 설정

- **Firebase 프로젝트**: `did-ads`
- **설정 파일**: `클로드/firebase.json` + `클로드/.firebaserc`
- **전체 배포**: `firebase deploy --only hosting --project did-ads`
- **개별 배포**: `firebase deploy --only hosting:[타겟명] --project did-ads`
  - deepdig 단독: `firebase deploy --only hosting:deepdig --project did-ads`
  - pikbox 단독: `firebase deploy --only hosting:pikbox --project did-ads`
  - didadmin 단독: `firebase deploy --only hosting:didadmin --project did-ads`
- **rewrite 규칙**: Pikbox는 pikbox.html → 루트(/) 매핑 추가됨

## Firebase CLI 환경 정보

- **버전**: v15.7.0 설치 완료
- **로그인 계정**: gogumiyo4@gmail.com
- **로그인 방법 (2026-02-28 업데이트)**:
  - `expect` 명령으로 Claude Code에서 비대화형 로그인 가능 (Chrome DevTools Protocol(CDP)로 Google OAuth 자동 처리)
  - Terminal.app에서도 `firebase login` 직접 실행 가능
- **배포 전 로그인 확인**: `firebase projects:list --project did-ads`

## 환경 정보

- **Netlify CLI**: v24.0.0 설치 완료 (현재 크레딧 소진 — 3/26 리셋)
- **배포 기본 플랫폼**: **Firebase Hosting** (2026-02-28 Netlify 전면 이전)
- **한글 폴더명 금지**: Netlify 배포 시 반드시 `/tmp/deploy-[영문명]/` 경로로 복사 후 배포

## 플랫폼 판단 기준 (업데이트)

| 조건 | 선택 |
|------|------|
| 신규 배포 — Firebase DB 연동 프로젝트 | Firebase Hosting |
| 신규 배포 — 순수 정적 HTML | Firebase Hosting (기본, Netlify 크레딧 소진) |
| 기존 사이트 업데이트 | Firebase Hosting (3개 사이트 모두 이전 완료) |
| Netlify 크레딧 리셋(3/26) 이후 신규 소규모 배포 | Netlify 재검토 가능 |

## 주의사항

- Firebase config(apiKey, authDomain 등)는 클라이언트 노출 안전 → 보안 검사에서 제외
- .env 파일은 배포 대상에서 반드시 제외
- **launchd 자동화 스크립트에서 Firebase 배포 시**: `~/.zshenv`에 PATH 등록 필요 (비대화형 셸에서도 firebase CLI 접근 가능하도록)
- **Netlify CLI 대화형 프롬프트 막힘**: 필요 시 Netlify REST API 직접 사용
  - `curl -X POST "https://api.netlify.com/api/v1/sites/{site_id}/deploys" -H "Authorization: Bearer {token}"`
