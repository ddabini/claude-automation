# design-figma 에이전트 메모리

## 관련 에이전트 메모리 참조

| 에이전트 | 참조 시점 | 참조 내용 |
|---------|----------|----------|
| design-asset-generator | 에셋 가이드 수신 시 | 폰트 CDN·컬러 팔레트·에셋 경로·레이아웃 구성 |
| qa-tester | 캡처 전 경량 검증 시 | HTML 구조·CDN 접근성·에셋 경로 유효성 |
| leader | 최종 검수 | 캡처 결과 완료/재캡처 |

## 사용자 확정 디자인 선호

- **폰트**: 모던 산세리프만 사용 (Paperlogy, Pretendard 등) — 세리프/궁서체 계열 일체 거부
- **컬러**: 솔리드 컬러 + text-shadow 조합 선호 — gradient-clip 텍스트 가독성 저하로 거부
- **레이아웃**: 서비스 항목은 가로 배치 카드 (아이콘 + 텍스트) 선호 — 세로 나열 비선호
- **아이콘**: 면채움(Solid Fill) 선호 — 라인아트 비선호
- **테마**: 라이트 테마 기본 선호 (DID 광고는 다크 테마 허용)
- **DID 광고 사이즈**: 가로형/세로형 방향 반드시 사전 확인
- **제품 이미지 누끼 필수** (2026-02-28): 시안에 제품 컷 삽입 시 반드시 누끼(배경 제거) 이미지 사용 — Python Pillow RGB threshold 240 처리

## Figma 작업 이력

| 프로젝트 | Figma fileKey | 스타일 | 캡처 방식 |
|---------|-----------|--------|---------|
| 풀케어서비스 DID 광고 | pKYv9PweKxQFZdAhtfH2tH | 딥 네이비 + 골드, 2160×3840 세로형 | Netlify 배포 테스트 |


## Figma 캡처 기술 (2026-02-28 안정화)

### HTML-to-Design 캡처 방식
- **구 방식**: `open [URL]#figmacapture=...` — 불안정 (타이밍 제어 불가, 반복 실패)
- **신 방식 (Playwright)**: Node.js headless: false 브라우저 → 해시 파라미터 → 20초 대기 → 자동 종료
  - `/tmp` 설치: `npm install playwright`
  - 스크립트: `/tmp/figma-capture.js` (headless: false + 명시적 타이밍)
  - 완료 확인: MCP `generate_figma_design(captureId)` 폴링

### 수정 후 재캡처 규칙 (2026-02-28)
- **newFile 방식**: 수정 후 재캡처 시 새 Figma 파일 생성 (이전 버전 누적 금지)
- **한 파일에 최종본 1장만 유지**: 과정 버전(v1, v2 등)은 별도 추적하지 않음

## 기술 제약

- figma-desktop MCP는 **읽기 전용** — 디자인 노드 직접 생성 불가
- Figma REST API도 **읽기 전용**
- 피그마에 직접 생성하려면 **Plugin API** 필수
