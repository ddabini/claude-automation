# research-crawler 에이전트 메모리

## 관련 에이전트 메모리 참조

| 에이전트 | 참조 시점 | 참조 내용 |
|---------|----------|----------|
| strategy-planning | 조사 데이터 전달 시 | 시장 데이터·경쟁사 분석·트렌드를 기획에 활용 |
| leader | 조사 결과 품질 확인 | 출처 검증·최신성·균형성 확인 |
| deploy-manager | DeepDig 자동 아카이빙 시 | registry.js 등록 + Firebase 재배포 |

## 사용자 주거·부동산 조사 선호
- 국토교통부 주거실태조사, 통계청 인구이동통계, 농림부 귀농귀촌 통계 = 최우선 A급 출처
- KDI 경제교육정보센터(eiec.kdi.re.kr)에서 국토부 보고서 요약본 접근 가능
- 통계청 URL이 kostat.go.kr → mods.go.kr로 이전됨 (리다이렉트 주의)

## 보고서 생성 패턴 (확정)
- 단일 HTML 파일 (Noto Sans KR CDN + @media print 포함)
- **디자인 표준 고정**: 1번 보고서(consumer-app-usage) CSS와 동일하게 유지 — 임의 변경 절대 금지
  - 흰 배경(#ffffff), Noto Sans KR, 900px 컨테이너, 브런치 스타일
- 폴더 구조: `04_deepdig/[NN]_[주제명]/report/` + `raw-data/sources.md`
- registry.js에 cat_XXX + rpt_XXX 순번으로 등록 (folderPath 필드 필수)
- **리포트 제목 규칙**: 연간`[2025]제목` / 월간`[3월]제목` / 주간`[3월1주차]제목` / 데일리`[3월21일]제목` (괄호-제목 사이 띄어쓰기 없음)

## iCloud 동기화 주의
- 04_deepdig의 기존 파일이 로컬에 없을 수 있음 (iCloud 미다운로드)
- 기존 registry.js를 Read로 읽은 후 Write로 전체 재작성 방식 사용
- 폴더 없으면 mkdir -p로 먼저 생성

## 유용한 검색 전략
- "국토교통부 주거실태조사 [연도]" → 보도자료 + KDI 요약본 병행 검색
- "통계청 인구이동통계 결과" → korea.kr 정책브리핑에서 요약 접근
- 연령별 세부 통계는 보도자료 본문보다 첨부 PDF/HWP에 있음 (웹 크롤링 한계)
- kr.investing.com, econmingle.com → 임대차 시장 최신 트렌드 통계 유용

## 조사된 주제 이력
- 2026-02-27: 소비자 앱서비스 이용행태 (cat_001, rpt_001) — `01_소비자앱서비스트렌드조사/`
- 2026-02-27: 연령별 주거 행태 및 부동산 이동 (cat_002, rpt_002) — `02_연령별주거행태부동산이동/`
- 2026-02-27~: 투자 데일리 브리핑 (cat_003, rpt_003~rpt_007) — `03_투자데일리브리핑/` (자동화 스크립트 매일 10:00 실행)
  - rpt_003: 2/27 | rpt_004: 2/28 | rpt_005: 3/1(일) | rpt_006: 3/3(화) [수동] | rpt_007: 3/2(월) 공휴일
  - **다음 브리핑은 rpt_008부터 시작**
  - 3/3 보고서 핵심: 이란 호르무즈 봉쇄, WTI +6.28%($71.23), 코스피 -1.26%(6,165) 급락 개장, 나스닥 +0.36% 보합

## 데일리 자동화 스크립트
- 위치: `04_deepdig/scripts/daily-investment-report.sh`
- launchd plist: `~/Library/LaunchAgents/com.deepdig.daily-investment-report.plist`
- heredoc으로 stdin 전달 + `unset CLAUDECODE` (중첩 세션 방지)
- 테스트 성공: 10분 소요, 종료코드 0
