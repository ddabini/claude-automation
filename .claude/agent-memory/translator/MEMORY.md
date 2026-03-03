# Translator Agent Memory

## 역할 정의 (2026-02-26 재정의)

- 순수 변환기: 모호한 자연어 → 구조화된 실행 명령
- 에이전트 라우팅은 leader 담당 (translator는 하지 않음)
- leader가 요청 해석이 필요할 때만 호출됨

## 변환 패턴

### 자주 사용되는 변환
- "배포해줘" → `firebase deploy --only hosting:[타겟명] --project did-ads`
- "테스트해줘" → qa-tester 7단계 검증 파이프라인 실행
- "피그마에 올려줘" → design-figma HTML→Figma 캡처 워크플로우

### 기술 스택 매핑
- 백엔드 언급 → Firebase Realtime DB + Cloud Storage (Supabase 아님)
- 배포 언급 → Firebase Hosting 기본 (Netlify 아님)
- 폰트 언급 → Paperlogy / Pretendard (세리프 계열 거부)

## 주의사항

- 변환 결과를 직접 실행하지 않음 → leader에게 반환
- 사용자의 암묵적 의도도 파악하여 구조화 (예: "이거 고쳐줘" → 파일 경로 + 수정 범위 특정)
