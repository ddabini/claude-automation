# design-reference-archiver 에이전트 메모리

최종 업데이트: 2026-03-03

## 관련 에이전트 메모리 참조

| 에이전트 | 참조 시점 | 참조 내용 |
|---------|----------|----------|
| strategy-planning | 기획 브리프 수신 시 | 컨셉·타깃·톤앤매너 → 레퍼런스 검색 방향 |
| design-asset-generator | 포인트 보고서 전달 시 | 에셋 생성에 필요한 컬러·레이아웃·폰트 방향 |
| leader | 컨펌 게이트 ① | 포인트 보고서 승인/수정 |

---

## 효과적인 검색 키워드 패턴

### 부동산/DID 광고 분야
- 영어: "luxury real estate digital signage poster dark gold typography vertical"
- 영어: "premium service advertisement dark background bold typography card layout"
- 영어: "property management service poster dark elegant vertical layout"
- 한국어: "부동산 서비스 광고 포스터 DID 세로형 다크 타이포"

### 다크 배경 프리미엄 포스터
- "dark premium poster design bold headline service list"
- "dark background bold typography vertical layout 2024"
- "luxury poster dark gold minimal typography"

---

## 플랫폼별 탐색 팁

### Pinterest
- 동적 JS 로딩으로 WebFetch를 통한 이미지 URL 직접 추출 불가
- CSS/디자인 토큰만 반환됨 — 이미지는 직접 방문만 가능
- 대신 보드/아이디어 링크를 수집해 사용자가 직접 탐색하도록 안내
- 효과적인 보드 유형: ideas/, 개인 큐레이션 보드

### Behance
- WebFetch로 갤러리 접근 시 메타데이터만 추출 가능 (JS 렌더링 필요)
- 갤러리 표지 이미지 URL: `mir-s3-cdn-cf.behance.net/projects/...` 패턴
- 검색 URL 패턴: `https://www.behance.net/search/projects/[검색어]`

### Dribbble / Freepik / Vecteezy
- Dribbble: 태그 기반 탐색이 가장 효과적 (dribbble.com/tags/[태그명])
- Freepik: 403 오류 자주 발생 — URL만 수집하고 직접 방문 안내
- Vecteezy: 상세 페이지보다 컬렉션 페이지가 더 많은 정보 포함

---

## 다크 배경 포스터 디자인 확정 패턴

### 검증된 컬러 조합
- 딥 네이비(#0D1B2A) + 골드(#C9A96E) + 화이트 = 프리미엄 부동산
- 차콜 블랙(#1A2E4A) + 오렌지(#FF6B35) + 화이트 = 모던 에너지
- 미드나이트(#1A1A2E) + 라이트 골드(#E8D5A3) + 크림 = 고급 레저/라이프스타일

### DID 세로형 (9:16) 레이아웃 원칙
- 5x5 룰: 한 화면당 5줄 이내, 줄당 5단어 이내
- 2160px 기준 타이틀 최소 120px 이상
- 3분할 구조: 상단 후킹 / 중단 서비스 / 하단 CTA
- 골드 포인트라인으로 섹션 구분

### 한국어 폰트 선택
- 타이틀(임팩트): Paperlogy ExtraBold (G Market Sans 기반, 무료)
- 본문(가독성): Pretendard Bold/Regular (시스템 UI 대체, 무료)
- 두 폰트 모두 한글+영문+숫자 균형 우수

---

## 레퍼런스 수집 품질 원칙 (2026-02-25 강화)

- **블로그 기사·뉴스 링크 수집 금지** — 실제 디자인 이미지 URL만 수집
- **Pinterest/Behance/Dribbble 실제 작업물 페이지** 링크 필수
- 수집된 레퍼런스를 design-asset-generator에 전달할 때 단순 URL 목록이 아닌 **디자인 분석 포인트** 함께 전달
- 에이전트가 레퍼런스를 "형식적으로 수집"하면 사용자가 즉시 감지 → 실질적 활용 책임 있음

## 주의 사항

- 바로이집 프로젝트는 `01_baroezip/` 하위에 저장
- 레퍼런스 폴더 구조: `레퍼런스/01_핀터레스트/`, `02_비헨스/`, `03_드리블/`, `04_기타플랫폼/`
- 이미지 직접 다운로드보다 URL 링크 수집 우선
- 수집 완료 후 반드시 디자인 포인트 보고서 작성 후 사용자(또는 leader) 컨펌 대기
