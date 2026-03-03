#!/usr/bin/env python3
"""
브랜드 전략 자동화 시스템
─────────────────────────
간략한 브랜드 정보를 입력하면
5단계 프로세스에 맞는 전략 산출물을 자동으로 생성합니다.

사용법:
    python brand_strategy_agent.py
    python brand_strategy_agent.py --input brand_info.txt  # 파일 입력 모드
"""

import anthropic
import os
import sys
import argparse
from datetime import datetime
from pathlib import Path

# ─── 설정 ───────────────────────────────────────────────────────────────────

MODEL = "claude-opus-4-6"
OUTPUT_BASE = Path(__file__).parent.parent / "결과물"

SYSTEM_PROMPT = """당신은 10년 이상의 경력을 가진 전문 브랜드 전략 컨설턴트입니다.
맥킨지, BCG급의 체계적인 분석 프레임워크를 활용하여 구체적이고 실행 가능한 전략을 제시합니다.
제공된 브랜드 정보가 제한적이더라도, 업종과 시장에 대한 전문 지식을 바탕으로 합리적으로 추론하여
실질적으로 도움이 되는 산출물을 마크다운 형식으로 작성합니다."""

# ─── 단계별 프롬프트 ─────────────────────────────────────────────────────────

def make_stage1_prompt(brand_text: str) -> str:
    return f"""아래 브랜드 정보를 바탕으로 1단계 현황 분석 보고서를 작성하세요.

[브랜드 기본 정보]
{brand_text}

# 1단계. 현황 분석 보고서

## 1. 시장 환경 분석
- 해당 업종의 시장 규모와 성장 트렌드
- 주요 성장 기회 요소
- 주요 위협 및 리스크 요소
- 핵심 시장 세분화(Segmentation)

## 2. 경쟁사 분석
- 주요 경쟁사 현황 (최소 3개사)
  | 경쟁사 | 포지셔닝 | 주요 강점 | 약점 |
  |--------|---------|---------|------|
- 경쟁 구도 특징
- 시장 내 공백(White Space) — 아직 선점되지 않은 포지션

## 3. 고객(타겟) 분석
### 페르소나 A (핵심 타겟)
- 이름/나이/직업/라이프스타일
- 핵심 니즈 & Pain Point
- 브랜드 선택 기준
- 주요 정보 탐색 채널

### 페르소나 B (잠재 타겟)
- 이름/나이/직업/라이프스타일
- 핵심 니즈 & Pain Point
- 브랜드 선택 기준
- 주요 정보 탐색 채널

## 4. 내부 현황 진단
| 구분 | 세부 내용 |
|------|---------|
| **강점(S)** | |
| **약점(W)** | |

## 5. SWOT 통합 분석
| 구분 | 기회(O) | 위협(T) |
|------|--------|--------|
| **강점(S)** | SO 전략: | ST 전략: |
| **약점(W)** | WO 전략: | WT 전략: |

## 6. 핵심 전략 과제 (Top 3)
반드시 해결해야 할 우선순위 과제를 이유와 함께 서술하세요.

1. **[과제명]** — 배경 및 이유
2. **[과제명]** — 배경 및 이유
3. **[과제명]** — 배경 및 이유
"""

def make_stage2_prompt(brand_text: str, stage1: str) -> str:
    return f"""아래 정보를 바탕으로 브랜드 아이덴티티 정의서를 작성하세요.

[브랜드 기본 정보]
{brand_text}

[1단계 현황 분석 핵심 내용]
{stage1[:3000]}

# 2단계. 브랜드 아이덴티티 정의서

## 1. 브랜드 코어
| 요소 | 내용 |
|------|------|
| **미션(Mission)** | 브랜드가 존재하는 이유 (1~2문장) |
| **비전(Vision)** | 5~10년 후 달성하고자 하는 모습 (1~2문장) |
| **핵심 가치 1** | 키워드 + 의미 설명 |
| **핵심 가치 2** | 키워드 + 의미 설명 |
| **핵심 가치 3** | 키워드 + 의미 설명 |

## 2. 브랜드 포지셔닝
### 포지셔닝 스테이트먼트
> "[브랜드명]은(는) **[핵심 타겟]**에게 **[핵심 혜택]**을 제공하는 **[카테고리]**이며,
> **[경쟁 브랜드]**와 달리 **[핵심 차별점]**을 가집니다."

### 핵심 차별점(USP) 3가지
1. **[차별점 1]** — 구체적 근거
2. **[차별점 2]** — 구체적 근거
3. **[차별점 3]** — 구체적 근거

### 포지셔닝 맵
텍스트로 표현 (X축: __, Y축: __ 기준으로 경쟁사 대비 위치 설명)

## 3. 브랜드 퍼스널리티
- **성격 형용사 5개**: (브랜드가 사람이라면 어떤 사람인가)
- **브랜드 아키타입**: [유형명] — 선택 이유 설명
- **톤앤매너**:
  - 말하는 방식: (예: 친근하되 전문적인, 격식 없이 따뜻한...)
  - 감정적 느낌: (예: 신뢰감 주는, 설레는, 안정적인...)
- **해서는 안 되는 것 (Anti-Brand)**:
  - 표현 방식: (예: 과장된 광고 언어, 딱딱한 공문체...)
  - 행동: (예: 고객 문의 무응답, 일관성 없는 메시지...)

## 4. 브랜드 프로미스 & 슬로건
- **핵심 약속**: 고객에게 일관되게 전달할 한 문장의 약속
- **슬로건 시안 A**: (특징: 감성적/직관적)
- **슬로건 시안 B**: (특징: 기능적/명확한)
- **슬로건 시안 C**: (특징: 도전적/강렬한)

## 5. 브랜드 스토리
브랜드의 탄생 배경, 고객과의 약속, 지향하는 세계관을 담은 200~300자 브랜드 스토리를 작성하세요.
(고객이 공감하고 기억할 수 있는 진정성 있는 내러티브)
"""

def make_stage3_prompt(brand_text: str, stage2: str) -> str:
    return f"""아래 정보를 바탕으로 브랜드 전략서를 수립하세요.

[브랜드 기본 정보]
{brand_text}

[2단계 브랜드 아이덴티티 핵심]
{stage2[:3000]}

# 3단계. 브랜드 전략서

## 1. 타겟 전략
| 구분 | 핵심 타겟 | 2차 타겟 |
|------|---------|---------|
| 타겟 정의 | | |
| 핵심 메시지 방향 | | |
| 주요 접점(Touchpoint) | | |
| 선택 이유 | | |

## 2. 메시지 전략
- **핵심 메시지(Core Message)**: 모든 커뮤니케이션의 중심이 되는 1개 메시지
- **서브 메시지** (핵심 메시지를 뒷받침하는 3개):
  1. [서브 메시지 1] — 목적 및 맥락
  2. [서브 메시지 2] — 목적 및 맥락
  3. [서브 메시지 3] — 목적 및 맥락

### 타겟별 메시지 변형
| 타겟 | 강조 포인트 | 어조 | 예시 카피 |
|------|-----------|------|---------|

## 3. 채널 전략
| 채널 유형 | 채널명 | 역할 | 콘텐츠 방향 | 목표 KPI |
|----------|--------|------|------------|---------|
| 소유(Owned) | 웹사이트 | | | |
| 소유(Owned) | SNS (Instagram) | | | |
| 소유(Owned) | SNS (기타) | | | |
| 유료(Paid) | 검색광고 | | | |
| 유료(Paid) | SNS 광고 | | | |
| 획득(Earned) | PR/미디어 | | | |
| 획득(Earned) | 인플루언서 | | | |

## 4. 브랜드 경험 전략 (고객 여정별)
| 여정 단계 | 고객 행동 | 브랜드 역할 | 핵심 접점 | 감정 목표 |
|---------|---------|-----------|---------|---------|
| 인지(Awareness) | | | | |
| 고려(Consideration) | | | | |
| 구매(Purchase) | | | | |
| 사용(Experience) | | | | |
| 충성(Loyalty) | | | | |

## 5. 콘텐츠 전략
### 핵심 콘텐츠 테마 (3~5개)
1. **[테마명]**: 목적 + 예시 소재
2. **[테마명]**: 목적 + 예시 소재
3. **[테마명]**: 목적 + 예시 소재

### 콘텐츠 포맷 추천
| 채널 | 추천 포맷 | 발행 주기 | 예시 |
|------|---------|---------|------|

## 6. 중장기 브랜드 로드맵
| 기간 | 단계명 | 핵심 목표 | 주요 실행 과제 | 성공 지표 |
|------|-------|---------|--------------|---------|
| 0~3개월 | 기반 구축 | | | |
| 3~6개월 | 인지도 확대 | | | |
| 6~12개월 | 신뢰도 강화 | | | |
| 12~24개월 | 충성 고객 확보 | | | |
"""

def make_stage4_prompt(brand_text: str, stage2: str, stage3: str) -> str:
    brand_name = brand_text.split('\n')[0].replace('브랜드명:', '').strip()
    return f"""아래 분석과 전략을 통합하여 최종 브랜드 전략 기획안을 작성하세요.

[브랜드 기본 정보]
{brand_text}

[브랜드 아이덴티티 요약]
{stage2[:2000]}

[브랜드 전략 요약]
{stage3[:2000]}

# 4단계. 브랜드 전략 기획안 — {brand_name}

---

## Executive Summary *(1페이지 핵심 요약)*
> 이 기획안의 핵심을 3~5줄로 요약하세요.
> 배경 → 전략 방향 → 핵심 실행과제 → 기대효과 순으로 작성

---

## 1. 현황 및 기획 배경
### 1-1. 시장 기회
(현황 분석에서 도출된 핵심 기회 요소)

### 1-2. 해결해야 할 과제
(브랜드가 반드시 해결해야 할 문제 2~3가지)

### 1-3. 기획 목적
(이 전략 기획안이 달성하고자 하는 구체적 목적)

---

## 2. 브랜드 전략 방향
| 요소 | 내용 |
|------|------|
| 미션 | |
| 비전 | |
| 포지셔닝 | |
| 핵심 타겟 | |
| 브랜드 프로미스 | |
| 추천 슬로건 | |

---

## 3. 크리에이티브 방향
### 핵심 메시지
(모든 커뮤니케이션의 중심 메시지)

### 비주얼 방향성
- 전체적인 분위기: (예: 따뜻하고 인간적인, 세련되고 미니멀한...)
- 색상 방향: (주요 색상 계열과 감정적 연상)
- 타이포그래피 방향: (서체 느낌)
- 사진/일러스트 방향: (어떤 이미지를 사용할지)

### 카피 방향
- 어조:
- 금지 표현:
- 핵심 키워드:

---

## 4. 실행 계획
### 4-1. 단기 우선순위 과제 (0~3개월)
| 번호 | 과제 | 담당 | 예산(추정) | 완료 시점 | 산출물 |
|-----|------|------|----------|---------|------|

### 4-2. 중기 실행과제 (3~12개월)
| 번호 | 과제 | 담당 | 예산(추정) | 완료 시점 | 산출물 |
|-----|------|------|----------|---------|------|

### 4-3. 마일스톤 타임라인
```
Month 1:  ████ [주요 실행 과제]
Month 2:  ████ [주요 실행 과제]
Month 3:  ████ [주요 실행 과제]
...
```

---

## 5. 예산 계획 (개략)
| 항목 | 세부 내용 | 비중(%) | 비고 |
|------|---------|--------|------|
| 브랜드 개발 | 로고·디자인·가이드라인 | | |
| 디지털 마케팅 | SNS·검색광고·콘텐츠 | | |
| PR/미디어 | 보도자료·인플루언서 | | |
| 오프라인 | 이벤트·인쇄물 | | |
| 기타 | 조사·분석·운영 | | |
| **합계** | | **100%** | |

---

## 6. KPI 및 성과 측정
| 단계 | 지표 | 현재 수준 | 3개월 목표 | 12개월 목표 | 측정 도구 |
|------|------|---------|---------|-----------|---------|
| 인지도 | 브랜드 검색량 | | | | |
| 인지도 | SNS 팔로워 | | | | |
| 선호도 | 브랜드 호감도 | | | | |
| 선호도 | NPS | | | | |
| 전환 | 웹사이트 방문 | | | | |
| 전환 | 전환율 | | | | |
| 충성 | 재구매율 | | | | |

---

## 7. 리스크 및 대응 방안
| 리스크 | 가능성 | 영향도 | 대응 방안 |
|--------|--------|--------|---------|
| | 상/중/하 | 상/중/하 | |

---

*본 기획안은 제공된 브랜드 정보를 기반으로 AI가 생성한 전략 초안입니다.
실제 실행 전 내부 검토 및 전문가 자문을 권장합니다.*

*작성일: {datetime.now().strftime('%Y년 %m월 %d일')}*
"""

def make_stage5_prompt(brand_text: str, stage3: str) -> str:
    return f"""아래 전략을 실제로 실행하고 관리하기 위한 가이드를 작성하세요.

[브랜드 기본 정보]
{brand_text}

[브랜드 전략 핵심]
{stage3[:2000]}

# 5단계. 브랜드 실행 및 관리 가이드

## 1. 브랜드 가이드라인 핵심 체크리스트
### 시각적 일관성
- [ ] 로고 사용 규정 수립 (최소 사이즈, 여백, 금지 변형)
- [ ] 브랜드 컬러 코드 정의 (Primary / Secondary / Accent)
- [ ] 폰트 가이드 (제목용 / 본문용 / 디지털용)
- [ ] 이미지 스타일 가이드 (사진 톤, 일러스트 방향)

### 커뮤니케이션 일관성
**OK 예시** (브랜드 톤에 맞는 표현):
- 예시 1:
- 예시 2:

**NG 예시** (피해야 할 표현):
- 예시 1:
- 예시 2:

## 2. 채널별 운영 체크리스트
### SNS 운영 (일/주/월 기준)
**매일**
- [ ] 댓글·DM 모니터링 및 응대 (응답 목표: 24시간 이내)
- [ ] 브랜드 언급 모니터링

**매주**
- [ ] 콘텐츠 캘린더 확인 및 예약 발행
- [ ] 주요 지표 점검 (도달, 참여율, 팔로워 증감)

**매월**
- [ ] 채널별 성과 리포트 작성
- [ ] 다음 달 콘텐츠 기획

### 웹사이트 관리
- [ ] 브랜드 메시지 일관성 점검 (분기 1회)
- [ ] SEO 키워드 성과 모니터링 (월 1회)
- [ ] 핵심 전환 지점 UX 점검 (분기 1회)

## 3. KPI 모니터링 대시보드
| 영역 | 지표 | 측정 도구 | 담당자 | 보고 주기 | 목표값 |
|------|------|---------|------|---------|------|
| 인지도 | 브랜드 검색량 | Google Search Console | | 주간 | |
| 인지도 | SNS 도달 수 | SNS Insight | | 주간 | |
| 선호도 | 게시물 참여율 | SNS Insight | | 월간 | |
| 선호도 | NPS 점수 | 설문 | | 분기 | |
| 전환 | 웹 방문자 수 | GA4 | | 주간 | |
| 전환 | 전환율 | GA4 | | 월간 | |
| 충성도 | 재방문율 | GA4 | | 월간 | |
| 충성도 | 구독자 증가율 | 채널별 도구 | | 월간 | |

## 4. 분기별 브랜드 감사(Brand Audit) 체크리스트
### 브랜드 인식 점검
- [ ] 내부 구성원 브랜드 이해도 조사
- [ ] 고객 브랜드 인식 설문 (NPS 포함)
- [ ] 소셜 리스닝 결과 분석 (긍정/부정 언급 비율)
- [ ] 경쟁사 포지셔닝 변화 체크

### 전략-실행 정합성 점검
- [ ] 모든 채널의 메시지가 브랜드 방향과 일치하는가?
- [ ] 비주얼 가이드라인이 외부 협력사까지 준수되고 있는가?
- [ ] KPI가 목표치를 향해 진행 중인가?
- [ ] 다음 분기 조정 사항 도출 및 문서화

## 5. 위기 대응 매뉴얼 (기본)
### 부정적 이슈 발생 시 대응 절차
```
1단계 (1시간 이내): 이슈 파악 → 내부 공유 → 임시 대응 여부 결정
2단계 (4시간 이내): 공식 대응 문구 초안 작성 → 내부 승인
3단계 (24시간 이내): 공식 입장 발표 (해당 채널)
4단계 (3일 이내): 후속 조치 및 결과 공유
```

### 커뮤니케이션 원칙
- 빠른 인정: 문제가 있다면 숨기지 않고 신속히 인정
- 공감 우선: 고객 피해에 대한 진심 어린 공감 표현
- 구체적 조치: 재발 방지를 위한 구체적 행동 제시
- 일관된 목소리: 채널별 상이한 메시지 금지

## 6. 클로드 에이전트 정기 업무 가이드
| 업무 | 주기 | 프롬프트 핵심 키워드 |
|------|------|------------------|
| 경쟁사 동향 분석 | 월 1회 | "최근 [경쟁사명]의 마케팅 변화와 우리 브랜드에 주는 시사점" |
| 콘텐츠 아이디어 발굴 | 주 1회 | "이번 주 [업종] 트렌드 기반 SNS 콘텐츠 아이디어 10개" |
| 고객 리뷰 분석 | 월 1회 | "이번 달 고객 리뷰 감성 분석 및 개선 인사이트" |
| 월간 성과 보고서 | 월 1회 | "[KPI 데이터]를 바탕으로 월간 브랜드 성과 보고서 작성" |
| 분기 전략 재점검 | 분기 1회 | "브랜드 전략 현황 점검 및 다음 분기 조정 제안" |
"""

def make_summary_prompt(brand_text: str, stage1: str, stage2: str, stage3: str) -> str:
    brand_name = brand_text.split('\n')[0].replace('브랜드명:', '').strip()
    return f"""다음 브랜드 전략 분석 결과를 경영진 보고용 1-Pager로 요약하세요.
핵심만 간결하게, 의사결정자가 한눈에 파악할 수 있도록 작성하세요.

브랜드명: {brand_name}

[참고 자료]
현황분석 요약: {stage1[:800]}
브랜드 정의 요약: {stage2[:800]}
전략 요약: {stage3[:800]}

# {brand_name} 브랜드 전략 1-Pager
*{datetime.now().strftime('%Y년 %m월 %d일')} 기준*

---

## 핵심 현황
> (시장 기회 + 브랜드 과제를 3~4줄로 요약)

---

## 브랜드 방향
| | |
|-|-|
| **미션** | |
| **포지셔닝** | |
| **핵심 타겟** | |
| **슬로건** | |
| **브랜드 약속** | |

---

## 3대 핵심 전략
| 전략 | 내용 | 기대효과 |
|------|------|--------|
| 전략 1 | | |
| 전략 2 | | |
| 전략 3 | | |

---

## 우선순위 실행과제 (Top 5)
| 순위 | 과제 | 기간 | 담당 | 기대효과 |
|-----|------|------|------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

---

## 핵심 KPI 목표
| 지표 | 현재 | 6개월 목표 | 12개월 목표 |
|------|------|---------|-----------|
| | | | |
| | | | |
| | | | |
"""

# ─── 핵심 함수 ────────────────────────────────────────────────────────────────

def collect_brand_info() -> dict:
    """인터랙티브 방식으로 브랜드 정보를 수집합니다."""
    print()
    print("=" * 65)
    print("  브랜드 전략 자동화 시스템  |  Claude Opus 4.6")
    print("=" * 65)
    print()
    print("브랜드에 대한 기본 정보를 입력해주세요.")
    print("(간략하게 입력해도 괜찮습니다. Enter를 누르면 다음으로 넘어갑니다.)")
    print()

    questions = [
        ("brand_name",      "1. 브랜드명 *",                    True),
        ("industry",        "2. 업종 / 카테고리 *",              True),
        ("product_service", "3. 주요 제품·서비스",               False),
        ("target",          "4. 예상 타겟 고객",                 False),
        ("competitors",     "5. 주요 경쟁사 (쉼표로 구분)",       False),
        ("strength",        "6. 브랜드 강점 또는 특징",           False),
        ("goal",            "7. 전략 목표 (인지도 확대, 리브랜딩 등)", False),
        ("additional",      "8. 추가로 전달할 내용",              False),
    ]

    info = {}
    for key, question, required in questions:
        while True:
            answer = input(f"  {question}: ").strip()
            if answer:
                info[key] = answer
                break
            elif not required:
                info[key] = "미입력"
                break
            else:
                print("  ※ 필수 항목입니다. 입력해주세요.")

    return info


def load_brand_info_from_file(filepath: str) -> dict:
    """텍스트 파일에서 브랜드 정보를 로드합니다.

    파일 형식 예시:
        브랜드명: 아보카도랩
        업종: 친환경 생활용품
        제품·서비스: 제로웨이스트 주방용품
        타겟: 환경에 관심 있는 2030 여성
        ...
    """
    info = {}
    key_map = {
        "브랜드명": "brand_name",
        "업종": "industry",
        "카테고리": "industry",
        "제품": "product_service",
        "서비스": "product_service",
        "제품·서비스": "product_service",
        "타겟": "target",
        "경쟁사": "competitors",
        "강점": "strength",
        "특징": "strength",
        "목표": "goal",
        "추가": "additional",
    }
    with open(filepath, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if ":" in line:
                k, v = line.split(":", 1)
                k = k.strip()
                v = v.strip()
                for kor, eng in key_map.items():
                    if kor in k:
                        info[eng] = v
                        break

    defaults = {
        "product_service": "미입력", "target": "미입력",
        "competitors": "미입력", "strength": "미입력",
        "goal": "미입력", "additional": "미입력",
    }
    for k, v in defaults.items():
        info.setdefault(k, v)

    return info


def format_brand_text(info: dict) -> str:
    """브랜드 정보 딕셔너리를 프롬프트용 텍스트로 변환합니다."""
    return (
        f"브랜드명: {info.get('brand_name', '미입력')}\n"
        f"업종/카테고리: {info.get('industry', '미입력')}\n"
        f"주요 제품·서비스: {info.get('product_service', '미입력')}\n"
        f"예상 타겟 고객: {info.get('target', '미입력')}\n"
        f"주요 경쟁사: {info.get('competitors', '미입력')}\n"
        f"브랜드 강점/특징: {info.get('strength', '미입력')}\n"
        f"전략 목표: {info.get('goal', '미입력')}\n"
        f"추가 정보: {info.get('additional', '미입력')}"
    )


def run_stage(client: anthropic.Anthropic, label: str, prompt: str) -> str:
    """단계를 실행하고 결과 텍스트를 반환합니다. 스트리밍으로 진행 상황을 출력합니다."""
    print(f"\n  {label} 분석 중 ", end="", flush=True)
    result = ""
    dot_count = 0

    with client.messages.stream(
        model=MODEL,
        max_tokens=8000,
        thinking={"type": "adaptive"},
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            result += text
            dot_count += len(text)
            if dot_count >= 50:
                print(".", end="", flush=True)
                dot_count = 0

    print(" 완료 ✓")
    return result


def save_file(content: str, filename: str, output_dir: Path) -> Path:
    """산출물을 파일로 저장합니다."""
    filepath = output_dir / filename
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    return filepath


# ─── 폴더 넘버링 ──────────────────────────────────────────────────────────────

def next_numbered_dir(base: Path, name: str) -> Path:
    """결과물 폴더를 01_이름, 02_이름 ... 순서로 자동 넘버링합니다."""
    base.mkdir(parents=True, exist_ok=True)
    existing = [d for d in base.iterdir() if d.is_dir() and d.name[:2].isdigit()]
    numbers = [int(d.name[:2]) for d in existing] if existing else [0]
    next_num = max(numbers) + 1
    safe_name = name.replace("/", "_").replace(" ", "_")[:30]
    return base / f"{next_num:02d}_{safe_name}"


# ─── 메인 ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="브랜드 전략 자동화 시스템",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--input", "-i",
        type=str,
        help="브랜드 정보가 담긴 텍스트 파일 경로 (없으면 인터랙티브 입력)",
    )
    args = parser.parse_args()

    # API 키 확인
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print()
        print("  [오류] ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.")
        print("  터미널에서 다음 명령어를 실행하세요:")
        print("    export ANTHROPIC_API_KEY='your-api-key-here'")
        sys.exit(1)

    client = anthropic.Anthropic()

    # 브랜드 정보 수집
    if args.input:
        print(f"\n  파일에서 브랜드 정보를 불러옵니다: {args.input}")
        brand_info = load_brand_info_from_file(args.input)
        print(f"  브랜드명: {brand_info.get('brand_name', '알 수 없음')}")
    else:
        brand_info = collect_brand_info()

    brand_text = format_brand_text(brand_info)
    brand_name = brand_info.get("brand_name", "브랜드")

    # 결과물 폴더 생성 (자동 넘버링)
    output_dir = next_numbered_dir(OUTPUT_BASE, brand_name)
    output_dir.mkdir(parents=True, exist_ok=True)

    print()
    print("─" * 65)
    print(f"  분석 시작: {brand_name}")
    print(f"  결과물 저장 위치: {output_dir}")
    print("─" * 65)

    # ── 5단계 순차 실행 ──────────────────────────────────────────────────────

    results = {}

    try:
        # 1단계: 현황 분석
        results["stage1"] = run_stage(
            client, "[1단계] 현황 분석",
            make_stage1_prompt(brand_text)
        )
        save_file(results["stage1"], "1단계_현황분석.md", output_dir)

        # 2단계: 브랜드 정의
        results["stage2"] = run_stage(
            client, "[2단계] 브랜드 정의",
            make_stage2_prompt(brand_text, results["stage1"])
        )
        save_file(results["stage2"], "2단계_브랜드정의서.md", output_dir)

        # 3단계: 전략 수립
        results["stage3"] = run_stage(
            client, "[3단계] 전략 수립",
            make_stage3_prompt(brand_text, results["stage2"])
        )
        save_file(results["stage3"], "3단계_브랜드전략서.md", output_dir)

        # 4단계: 기획안 작성
        results["stage4"] = run_stage(
            client, "[4단계] 기획안 작성",
            make_stage4_prompt(brand_text, results["stage2"], results["stage3"])
        )
        save_file(results["stage4"], "4단계_브랜드전략기획안.md", output_dir)

        # 5단계: 실행 관리 가이드
        results["stage5"] = run_stage(
            client, "[5단계] 실행·관리 가이드",
            make_stage5_prompt(brand_text, results["stage3"])
        )
        save_file(results["stage5"], "5단계_실행관리가이드.md", output_dir)

        # 통합 1-Pager 요약
        results["summary"] = run_stage(
            client, "[최종] 1-Pager 요약",
            make_summary_prompt(
                brand_text,
                results["stage1"], results["stage2"], results["stage3"]
            )
        )
        save_file(results["summary"], "0_전략요약_1pager.md", output_dir)

    except anthropic.AuthenticationError:
        print("\n  [오류] API 키가 유효하지 않습니다. ANTHROPIC_API_KEY를 확인하세요.")
        sys.exit(1)
    except anthropic.RateLimitError:
        print("\n  [오류] API 요청 한도를 초과했습니다. 잠시 후 다시 시도하세요.")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n  [중단] 사용자가 작업을 중단했습니다.")
        print(f"  지금까지 생성된 파일은 {output_dir} 에 저장되어 있습니다.")
        sys.exit(0)

    # ── 완료 메시지 ───────────────────────────────────────────────────────────

    total_chars = sum(len(v) for v in results.values())
    print()
    print("=" * 65)
    print(f"  분석 완료! — {brand_name} 브랜드 전략")
    print("=" * 65)
    print()
    print(f"  📁 {output_dir}")
    print()
    print("  생성된 산출물:")
    print("    ├─ 0_전략요약_1pager.md       ← 경영진 보고용 핵심 요약")
    print("    ├─ 1단계_현황분석.md          ← 시장·경쟁·고객 분석")
    print("    ├─ 2단계_브랜드정의서.md       ← 미션·비전·포지셔닝")
    print("    ├─ 3단계_브랜드전략서.md       ← 타겟·메시지·채널 전략")
    print("    ├─ 4단계_브랜드전략기획안.md   ← 통합 기획안 (실행계획 포함)")
    print("    └─ 5단계_실행관리가이드.md     ← KPI·운영·위기대응 가이드")
    print()
    print(f"  총 {total_chars:,}자 분량의 전략 문서가 생성되었습니다.")
    print()


if __name__ == "__main__":
    main()
