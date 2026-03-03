#!/bin/bash
# =========================================================
# 투자 데일리 브리핑 자동 생성 스크립트
# 매일 아침 8:30에 launchd가 실행 → 9시 전에 보고서 완성
# =========================================================

# 로그 파일 경로 설정
LOG_DIR="/Users/dabin/Library/Mobile Documents/com~apple~CloudDocs/클로드/04_deepdig/scripts/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/daily-report-$(date +%Y%m%d).log"

# 로그 기록 시작
echo "====== 투자 데일리 브리핑 자동 생성 시작: $(date) ======" >> "$LOG_FILE"

# 환경변수 로드 (PATH에 claude, netlify 등 포함)
source /Users/dabin/.zshenv 2>/dev/null

# Claude Code 중첩 세션 방지 해제 (테스트 시 기존 세션 안에서도 실행 가능하도록)
unset CLAUDECODE

# 오늘 날짜 정보 (한국어 형식)
MONTH=$(date +%-m)
DAY=$(date +%-d)
DATE_TAG="${MONTH}월${DAY}일"
DATE_FILE=$(date +%Y%m%d)
TODAY=$(date +%Y-%m-%d)

# 프롬프트를 heredoc으로 stdin에 전달하여 Claude Code 실행
cat <<PROMPT | /Users/dabin/.local/bin/claude -p --allowedTools "Task,Bash,Read,Write,Edit,Glob,Grep,WebFetch,WebSearch" >> "$LOG_FILE" 2>&1
오늘(${TODAY}) 투자 데일리 브리핑을 생성해줘.

## 작업 내용
1. research-crawler 에이전트를 실행하여 오늘자 한국주식, 미국주식, 부동산투자 주요 이슈를 조사
2. 제목: [${DATE_TAG}]투자 데일리 브리핑
3. 파일명: investment-daily-${DATE_FILE}.html
4. 저장위치: /Users/dabin/Library/Mobile Documents/com~apple~CloudDocs/클로드/04_deepdig/03_투자데일리브리핑/report/
5. 디자인은 반드시 01_소비자앱서비스트렌드조사의 보고서와 동일한 CSS 사용 (흰배경, Noto Sans KR, 브런치스타일)
6. 04_deepdig/registry.js에 새 보고서 자동 등록 (기존 cat_003 카테고리에 추가)
7. Netlify 재배포 (site ID: 9b53e031-a267-4d9d-937a-9cc08b6bfe21)

## 조사 범위
- 한국 주식: 전일 코스피/코스닥 마감, 외국인/기관 수급, 주요 종목 이슈
- 미국 주식: 뉴욕증시 마감(S&P500, 나스닥, 다우), 빅테크/AI, 연준 동향
- 부동산: 매매/전세 동향, 정책 변화, 주요 지역 이슈
- 종합: 오늘 주목 포인트, 주의 사항, 향후 전망
PROMPT

# 실행 결과 기록
EXIT_CODE=$?
echo "====== 완료: $(date) / 종료코드: $EXIT_CODE ======" >> "$LOG_FILE"

# 7일 지난 로그 자동 삭제
find "$LOG_DIR" -name "daily-report-*.log" -mtime +7 -delete 2>/dev/null
