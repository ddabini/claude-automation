# qa-tester 에이전트 메모리

## 관련 에이전트 메모리 참조

| 에이전트 | 참조 시점 | 참조 내용 |
|---------|----------|----------|
| program-development | 개발 완료물 검증 시 | 기술 스택·외부 API·테스트 중점사항 |
| design-figma | 캡처 전 경량 검증 시 | HTML 구조·에셋 가이드 대조 |
| design-asset-generator | 디자인 일관성 검증 시 | 적용 가이드의 폰트·컬러·레이아웃 대조 |
| deploy-manager | QA 통과 후 | 배포 전 최종 점검 결과 전달 |

## 반복 발생 이슈 패턴

- async 함수 체인: 부모 함수 async 선언 누락 → 빈번한 런타임 에러
- Firebase config localStorage 방식 → 기기 간 공유 불가 문제 (하드코딩으로 전환 완료)
- Netlify 배포 시 한글 폴더명 → 404 에러 (영문 폴더 복사 필수)
- Pikbox: PLATFORMS 배열 탭 정의와 실제 doSearch() 검색 대상이 불일치 → 탭은 있으나 결과 없는 버그 패턴
- Pikbox: Serper API 1회 검색 = 11회 API 호출 소모 (월 2,500회 / 11 = 약 227회 검색 가능)
- Pikbox: 대규모 탭 추가 시 전역 변수(`activeView` 등)가 추가 코드 내부에 재선언되는 패턴 → 전역 상태 블록으로 통합 필요
- Pikbox: 이벤트 리스너(ESC, 오버레이 클릭) 중복 등록 패턴 — 기존 공통 리스너가 커버하는 경우 제거 필요

## 검증 환경

- Playwright MCP 사용 가능: `mcp__playwright__browser_run_code`
- 반응형 뷰포트: 360px (모바일), 768px (태블릿), 1200px (PC)
- 단일 HTML 파일 테스트: `file://` 프로토콜로 직접 열기

## 배포 후 검증 원칙 (2026-03-03 추가)

- **파일 존재 확인 != 렌더링 검증**: Firebase 배포 완료 후에도 반드시 Playwright로 실제 브라우저 렌더링 확인
- **iframe 로드 검증 필수**: DeepDig 등 iframe 중첩 구조는 부모 페이지 로드와 iframe 내부 콘텐츠 렌더링을 분리 검증
- **캐시 주의**: 배포 후 즉시 테스트 시 브라우저 캐시로 구버전이 보일 수 있음 → `?nocache=timestamp` 파라미터 추가 후 검증
- **확실해진 것만 보고**: 사용자 원칙 — 추측·가정 보고 금지, 실제 브라우저에서 확인된 내용만 결과로 제시

### DeepDig 보고서 검증 체크리스트
1. `https://deepdig-app.web.app` 접속 → 보고서 카드 목록 정상 렌더링 확인
2. 각 보고서 카드 클릭 → iframe 내 HTML 정상 로드 확인
3. registry.js 캐시 버스팅 파라미터(`?v=YYYYMMDD`) 날짜 최신 여부 확인
