# auto-clicker 에이전트 메모리

## 환경 상태 (2026-02-26 확인)
- **Homebrew 설치 완료**: `/opt/homebrew/bin/brew` (PATH 미등록 → 직접 경로 사용)
- **cliclick 설치 완료**: `/opt/homebrew/bin/cliclick`
- **macOS 접근성 권한**: Terminal.app에 System Events 접근 권한 부여됨
- **OS**: macOS Darwin 25.3.0

## 실행 규칙
- 세션 시작 시 자동 백그라운드 실행 (사용자 요청 사항)
- Bash 권한이 필요함 — 권한 프롬프트 표시 시 사용자가 허용해야 함

## 도구 경로
- cliclick: `/opt/homebrew/bin/cliclick`
- osascript: `/usr/bin/osascript` (기본 내장)
- screencapture: `/usr/sbin/screencapture` (기본 내장)
