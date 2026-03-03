# design-asset-generator 에이전트 메모리

## 관련 에이전트 메모리 참조

| 에이전트 | 참조 시점 | 참조 내용 |
|---------|----------|----------|
| design-reference-archiver | 포인트 보고서 수신 시 | 컬러·레이아웃·톤앤매너·TOP 레퍼런스 |
| design-figma | 에셋 가이드 전달 시 | 메인폰트·컬러 팔레트·에셋 목록·레이아웃 |
| program-development | 에셋 가이드 전달 시 | 개발에 필요한 폰트·컬러·에셋 경로 |
| leader | 컨펌 게이트 ② | 에셋 적용 가이드 승인/보완 |

## 바로이집 풀케어 DID 광고 프로젝트 (2026-02-25)

### 프로젝트 경로
`/Users/dabin/Library/Mobile Documents/com~apple~CloudDocs/클로드/01_baroezip/03_풀케어서비스_DID광고/디자인/assets/`

### 확정 스타일 가이드
- 배경: 딥 네이비 #0D1B2A
- 메인 골드: #C9A96E
- 밝은 골드: #E8D5A3
- 어두운 골드: #A8854A / #8A6A35
- 아이콘 스타일: 면채움(Solid Fill) + 골드 그라디언트 (라인아트 X)

### 확정 폰트
- 메인(타이틀): Paperlogy ExtraBold 800
  CDN: `https://cdn.jsdelivr.net/gh/e-hwan/paperlogy@latest/fonts/Paperlogy-8ExtraBold.woff2`
- 서브(본문): Pretendard Variable
  CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css`

### 에셋 목록 (v3 면채움 스타일)
- icon-tax.svg: 세무사 (계산기+문서 조합)
- icon-legal.svg: 법무사 (저울+법봉 조합)
- icon-negotiate.svg: 협상 (악수+말풍선 조합)
- icon-interior.svg: 인테리어 (집+페인트롤러 조합)
- icon-shield.svg: 방패+체크 (신뢰 강조)
- icon-team.svg: 4명 전담팀 (사람 실루엣 4개)
- icon-key.svg: 황금 열쇠 메인 비주얼
- deco-line.svg: 골드 구분선 (다이아몬드 중앙 장식)
- deco-badge.svg: 숫자 배지 01/02/03
- deco-quote.svg: 대형 따옴표 장식
- visual-house.svg: 집/건물 실루엣 600×500px
- visual-document.svg: 등기권리증 320×420px

### SVG 에셋 제작 패턴 (재사용)
```
<defs>
  <!-- 골드 메인 그라디언트 — 모든 에셋 공통 -->
  <linearGradient id="goldMain" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#E8D5A3"/>
    <stop offset="50%" style="stop-color:#C9A96E"/>
    <stop offset="100%" style="stop-color:#A8854A"/>
  </linearGradient>
  <filter id="glow">
    <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#C9A96E" flood-opacity="0.3"/>
  </filter>
</defs>
```

### 레이아웃 (2160×3840px 세로형 4 Zone)
- Zone1 (Y:0~1152): 후킹 헤드라인
- Zone2 (Y:1152~2112): 브랜드 정체성 + 열쇠 비주얼
- Zone3 (Y:2112~3072): 서비스 강점 2×2 카드 그리드
- Zone4 (Y:3072~3840): CTA + 신뢰 지표

---

## 사용자 선호 확정 (2026-02-25)

### 텍스트 처리
- gradient-clip 텍스트 효과 → 가독성 저하로 반려됨
- 솔리드 컬러 + text-shadow 조합 선호 (220px 이상 대형 텍스트에서 특히 효과적)

### 아이콘 스타일
- 라인아트 아이콘 → 사용자 거부 패턴 있음
- 면채움(Solid Fill) + 골드 그라디언트 → v3에서 승인

### 서비스 목록 레이아웃
- 세로 나열(텍스트만) → 텍스트 겹침 및 단조로움으로 반려
- 가로 배치 카드 (아이콘 왼쪽 + 텍스트 오른쪽) → 공간 효율적, 선호

### 에셋 적용 가이드 작성 의무
- HTML에 에셋을 실제로 적용하는 것까지 design-asset-generator 책임 범위
- 에셋 파일만 생성하고 HTML 미적용 시 → 사용자 피드백으로 반려

---
