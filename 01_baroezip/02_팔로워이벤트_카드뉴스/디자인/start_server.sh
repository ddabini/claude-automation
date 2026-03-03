#!/bin/bash
# 로컬 HTTP 서버를 백그라운드에서 실행하는 스크립트
cd "/Users/dabin/Library/Mobile Documents/com~apple~CloudDocs/클로드/01_baroezip/02_팔로워이벤트_카드뉴스/디자인"
python3 -m http.server 8765 &
echo $! > /tmp/figma_capture_server.pid
echo "서버 시작됨 (PID: $!)"
