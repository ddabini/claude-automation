# /deploy — 배포 자동화

사용자가 `/deploy`를 입력하면 완성된 파일을 **Firebase Hosting**에 자동 배포한다.
(Netlify는 2026-02-28 크레딧 소진으로 Firebase로 전면 이전)

---

## 실행 순서

### Step 1. 배포 대상 확인
사용자에게 물어본다 (한 번에):
```
1. 배포할 파일/폴더 경로 (없으면 가장 최근 개발 파일 자동 탐지)
2. 기존 사이트 업데이트인지, 신규 배포인지
```
→ 입력 즉시 자동 실행 시작.

### Step 2. 배포 플랫폼 자동 판단

| 조건 | 선택 |
|------|------|
| 기존 배포 이력이 있는 프로젝트 | 기존 플랫폼·타겟 유지 |
| 새 프로젝트 (기본) | Firebase Hosting |
| 사용자가 플랫폼 직접 지정 | 지정된 플랫폼 사용 |

**Firebase Hosting 멀티사이트 현황:**

| 프로젝트 | Firebase 도메인 | 타겟명 |
|---------|----------------|--------|
| DeepDig | https://deepdig-app.web.app | deepdig |
| Pikbox | https://pikbox-app.web.app | pikbox |
| DID 광고 관리자 | https://did-ad-manager.web.app | didadmin |

- Firebase 프로젝트: `did-ads`
- 설정 파일: `클로드/firebase.json` + `클로드/.firebaserc`
- 전체 배포: `firebase deploy --only hosting --project did-ads`
- 개별 배포: `firebase deploy --only hosting:[타겟명] --project did-ads`

### Step 3. deploy-manager 에이전트 호출
`deploy-manager` 에이전트를 실행하여 배포 수행:
1. CLI 사전 검증 (firebase 설치·로그인 확인)
2. 배포 대상 검증 (파일 존재, API 키 노출 검사)
3. 배포 환경 준비 (index.html 확인, firebase.json 타겟 설정)
4. 배포 실행
5. 배포 후 접속 테스트 (curl 200 OK 확인)

### Step 4. 결과 보고
```
✅ 배포 완료
🔗 URL: https://[사이트명].web.app
📊 상태: 200 OK — 정상 접속 확인
📁 배포 파일: [파일 목록]
🔧 배포 명령: firebase deploy --only hosting:[타겟명] --project did-ads
```

### Step 5. QA 연결 (선택)
- 배포 전 QA 미수행 시: "배포 전 QA 테스트를 실행할까요?" 확인
- 사용자 승인 → `qa-tester` 에이전트 선행 실행 후 배포

---

## 신규 사이트 추가 배포 시

기존 3개 사이트 외 새 프로젝트를 배포할 때:
1. `firebase.json`에 새 호스팅 타겟 추가
2. `.firebaserc`에 타겟 매핑 추가
3. `firebase deploy --only hosting:[새타겟명] --project did-ads`
4. 배포 완료 후 deploy-manager 에이전트 메모리에 이력 추가

## 배포 실패 시 대응

| 실패 유형 | 조치 |
|----------|------|
| Firebase CLI 미설치 | `npm install -g firebase-tools` 안내 |
| 미로그인 | `firebase login` 안내 (expect 자동 처리 가능) |
| 권한 없음 | Firebase 프로젝트 권한 확인 안내 |
| 배포 성공 but 접속 불가 | firebase.json 라우팅 설정 점검 → 재배포 |
| 503 에러 | 캐시 버스팅 (`?v=YYYYMMDD`) 적용 후 재배포 |
