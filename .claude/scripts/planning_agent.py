#!/usr/bin/env python3
"""
기획안 작성 & 첨삭 에이전트
────────────────────────────────────────────────────────────────
분석 자료 또는 프로젝트 정보를 입력하면
① 실행 가능한 기획안 초안
② 논리 구조 첨삭
③ 설득력·임팩트 첨삭
④ 데이터·근거 보완 제안
⑤ 첨삭 반영 완성본
을 자동으로 생성합니다.

사용법:
    python planning_agent.py                        # 인터랙티브 입력
    python planning_agent.py --input project.txt    # 텍스트 파일 입력
    python planning_agent.py --dir ./결과물/브랜드명_2026  # 브랜드전략 결과물 폴더
"""

import anthropic
import os
import sys
import argparse
from pathlib import Path

# ─── 설정 ────────────────────────────────────────────────────────────────────

MODEL = "claude-opus-4-6"
OUTPUT_BASE = Path(__file__).parent.parent / "결과물"

SYSTEM_PROMPT = """당신은 맥킨지 출신의 전략 컨설턴트이자 기획서 전문 에디터입니다.
수백 건의 기획안을 작성하고 첨삭한 경험을 바탕으로,
의사결정자가 반드시 'Yes'를 선택하게 만드는 설득력 있는 기획안을 만듭니다.

기획안 작성 원칙:
- Why → What → How 순서로 논리 전개
- 숫자와 데이터로 주장을 뒷받침
- 의사결정자의 언어로 작성 (ROI, 리스크, 타임라인 중심)
- 복잡한 것을 단순하게, 추상적인 것을 구체적으로

첨삭 원칙:
- 논리의 비약이나 빈틈을 명확히 짚어냄
- 더 강한 표현·근거로 대체 제안
- 의사결정자가 가질 반론을 미리 예상하고 대응
- 모든 제안에 '왜 이렇게 바꿔야 하는지' 이유를 제시"""

# ─── 정보 수집 ────────────────────────────────────────────────────────────────

def collect_project_info() -> dict:
    print()
    print("=" * 65)
    print("  기획안 작성 & 첨삭 에이전트  |  Claude Opus 4.6")
    print("=" * 65)
    print()
    print("프로젝트 정보를 입력해주세요.")
    print("(분석이 완료된 내용 요약도 좋습니다. Enter로 다음 항목으로 이동)")
    print()

    questions = [
        ("title",       "1. 기획안 제목 또는 프로젝트명 *",         True),
        ("purpose",     "2. 기획 목적 (무엇을 결정/승인받기 위한 것인가) *", True),
        ("audience",    "3. 보고 대상 (경영진, 투자자, 팀장 등) *",   True),
        ("background",  "4. 배경 및 현황 (문제/기회 상황)",           False),
        ("goal",        "5. 달성하고자 하는 목표 (정량적 수치 포함)", False),
        ("strategy",    "6. 핵심 전략 또는 실행 방향",               False),
        ("budget",      "7. 예산 규모 (없으면 Enter)",               False),
        ("timeline",    "8. 실행 기간 또는 타임라인",                False),
        ("concern",     "9. 예상되는 반론 또는 우려 사항",            False),
        ("extra",       "10. 추가로 포함할 내용",                    False),
    ]

    info = {}
    for key, question, required in questions:
        while True:
            answer = input(f"  {question}: ").strip()
            if answer:
                info[key] = answer
                break
            elif not required:
                info[key] = ""
                break
            else:
                print("  ※ 필수 항목입니다.")
    return info


def load_from_file(filepath: str) -> str:
    with open(filepath, encoding="utf-8") as f:
        return f.read()


def load_from_dir(dirpath: str) -> str:
    """브랜드 전략 에이전트 결과물 폴더에서 내용을 로드합니다."""
    d = Path(dirpath)
    contents = []
    for filename in sorted(d.glob("*.md")):
        contents.append(f"\n\n{'='*50}\n# {filename.name}\n{'='*50}\n")
        contents.append(filename.read_text(encoding="utf-8"))
    return "\n".join(contents)


def format_project_text(info: dict) -> str:
    lines = []
    mapping = [
        ("title",      "기획안 제목"),
        ("purpose",    "기획 목적"),
        ("audience",   "보고 대상"),
        ("background", "배경/현황"),
        ("goal",       "달성 목표"),
        ("strategy",   "핵심 전략"),
        ("budget",     "예산"),
        ("timeline",   "타임라인"),
        ("concern",    "예상 반론"),
        ("extra",      "추가 정보"),
    ]
    for key, label in mapping:
        val = info.get(key, "")
        if val:
            lines.append(f"{label}: {val}")
    return "\n".join(lines)


# ─── 프롬프트 ─────────────────────────────────────────────────────────────────

def make_draft_prompt(project_text: str) -> str:
    return f"""아래 프로젝트 정보를 바탕으로 실행 가능한 기획안 초안을 작성하세요.

[프로젝트 정보]
{project_text}

---

기획안은 의사결정자가 보고 즉시 판단할 수 있도록 작성합니다.
Why → What → How 구조를 철저히 지키세요.

# 기획안 초안

## Executive Summary
> (전체 기획안의 핵심을 3~5줄로 압축. 바쁜 의사결정자가 이것만 봐도 판단할 수 있게)
> **기획 목적** | **핵심 전략** | **기대 효과** | **필요 자원**

---

## 1. 기획 배경 및 목적
### 1-1. 현황 및 문제 인식
(Why — 왜 지금 이 기획이 필요한가? 데이터·사례로 뒷받침)

### 1-2. 기획 목적
(이 기획안으로 달성하고자 하는 구체적 목적)

### 1-3. 기회의 창 (Window of Opportunity)
(지금 실행해야 하는 이유 — 타이밍의 당위성)

---

## 2. 목표 설정
| 구분 | 지표 | 현재 | 목표 | 달성 기간 |
|------|------|------|------|---------|
| 정량 목표 | | | | |
| 정성 목표 | | | | |

---

## 3. 전략 방향
### 핵심 전략 (What)
(무엇을 할 것인가 — 3개 이하의 명확한 전략 축)

**전략 1: [전략명]**
- 내용:
- 기대효과:

**전략 2: [전략명]**
- 내용:
- 기대효과:

**전략 3: [전략명]**
- 내용:
- 기대효과:

---

## 4. 실행 계획 (How)
### 4-1. 단계별 실행 로드맵
| 단계 | 기간 | 핵심 활동 | 담당 | 산출물 |
|------|------|---------|------|------|
| 1단계 | | | | |
| 2단계 | | | | |
| 3단계 | | | | |

### 4-2. 타임라인
```
[월/주 단위 주요 마일스톤을 텍스트로 표현]
```

---

## 5. 자원 계획
### 예산
| 항목 | 금액 | 비중 | 비고 |
|------|------|------|------|
| | | | |
| **합계** | | 100% | |

### 인력 및 역할
| 역할 | 담당자 | 투입 기간 | 주요 책임 |
|------|------|---------|---------|

---

## 6. 기대 효과 및 ROI
### 정량적 효과
(수치로 표현 가능한 기대 효과 — 매출, 비용절감, 고객수 등)

### 정성적 효과
(브랜드, 조직역량, 고객경험 등)

### ROI 추정
(투자 대비 예상 수익률 또는 손익분기점)

---

## 7. 리스크 및 대응 방안
| 리스크 | 가능성 | 영향도 | 대응 방안 |
|--------|--------|--------|---------|
| | 상/중/하 | 상/중/하 | |

---

## 8. 의사결정 요청 사항
(보고 대상에게 구체적으로 무엇을 결정해달라고 요청하는지 명확히)
- 승인 사항:
- 필요 자원:
- 결정 기한:
"""


def make_logic_edit_prompt(project_text: str, draft: str) -> str:
    return f"""아래 기획안 초안의 논리 구조를 심층 분석하고 첨삭하세요.

[프로젝트 배경]
{project_text[:1500]}

[기획안 초안]
{draft}

---

# 📋 논리 구조 첨삭 리포트

## 총평
(기획안 전체 논리 흐름에 대한 2~3줄 평가)

**논리 완성도**: ★★★☆☆ (5점 만점으로 평가 + 이유)

---

## 구조 진단

### ✅ 잘된 점
(논리적으로 탄탄한 부분 — 구체적으로 어느 섹션의 어떤 부분인지)

### 🔴 핵심 논리 문제 (반드시 수정)
각 문제마다 아래 형식으로 작성:

**문제 1: [문제 제목]**
- 위치: [섹션명]
- 현재 내용: `(문제가 되는 원문 발췌)`
- 문제점: (왜 논리적으로 약한지)
- 개선 방향: (어떻게 바꿔야 하는지)
- 수정 예시: `(대체 문장 또는 구조 제안)`

**문제 2: [문제 제목]**
(동일 형식 반복)

### 🟡 보완 권장 사항
(치명적이지는 않지만 강화하면 좋은 부분)

---

## Why-What-How 흐름 점검
| 구성요소 | 현재 상태 | 개선 필요 여부 | 개선 방향 |
|---------|---------|------------|---------|
| Why (배경/문제) | | | |
| What (목표/전략) | | | |
| How (실행계획) | | | |
| So What (기대효과) | | | |

---

## 의사결정자 관점 시뮬레이션
보고 대상이 읽으면서 가질 수 있는 의문과 반론:

1. **"[예상 질문 1]"**
   - 현재 기획안의 대응: (있는지/없는지)
   - 추가해야 할 내용:

2. **"[예상 질문 2]"**
   - 현재 기획안의 대응:
   - 추가해야 할 내용:

3. **"[예상 질문 3]"**
   - 현재 기획안의 대응:
   - 추가해야 할 내용:
"""


def make_impact_edit_prompt(project_text: str, draft: str) -> str:
    return f"""아래 기획안의 설득력과 임팩트를 강화하는 첨삭을 수행하세요.
의사결정자가 읽고 'Yes'를 선택하게 만드는 것이 목표입니다.

[프로젝트 배경]
{project_text[:1500]}

[기획안 초안]
{draft[:4000]}

---

# 💡 설득력·임팩트 강화 첨삭

## 전체 설득력 진단
**현재 설득력**: ★★★☆☆
(의사결정자 입장에서 평가 — 어떤 부분이 설득력 있고 없는지)

---

## Executive Summary 강화
현재 Executive Summary의 문제점과 더 강력한 버전 제안:

**현재 버전 문제점:**

**개선된 Executive Summary:**
> (의사결정자가 5초 안에 'Yes' 하고 싶게 만드는 버전으로 다시 작성)

---

## 섹션별 임팩트 강화

### 1. 배경/문제 섹션
- **현재**: (약한 표현 발췌)
- **문제**: (왜 임팩트가 없는지)
- **강화안**: (더 강렬하고 설득력 있는 표현)
- **이유**: (왜 이 표현이 더 효과적인지)

### 2. 목표 섹션
- **현재**: (약한 표현)
- **강화안**: (더 명확하고 야심찬 표현)
- **이유**:

### 3. 전략 섹션
- **현재**: (약한 표현)
- **강화안**: (더 차별화되고 강력한 표현)
- **이유**:

### 4. 기대효과 섹션
- **현재**: (약한 표현)
- **강화안**: (ROI·수치 중심의 강력한 표현)
- **이유**:

---

## 설득 기법 적용 제안

### 손실 회피 (Loss Aversion) 활용
(지금 실행하지 않으면 잃는 것을 강조하는 표현 제안)

### 사회적 증거 (Social Proof) 활용
(업계 사례·벤치마크를 활용해 리스크를 낮추는 표현 제안)

### 구체성의 힘 활용
(모호한 표현 → 구체적 수치·기간·담당자로 전환 제안 3가지)

---

## 핵심 카피 개선
기획안에서 가장 중요한 문장 3개를 선정하고 더 강력한 버전으로 교체:

| 현재 문장 | 개선 문장 | 개선 이유 |
|---------|---------|---------|
| | | |
| | | |
| | | |
"""


def make_data_edit_prompt(project_text: str, draft: str) -> str:
    return f"""아래 기획안에서 데이터와 근거가 부족한 부분을 찾아 보완 방향을 제안하세요.

[프로젝트 배경]
{project_text[:1500]}

[기획안 초안]
{draft[:4000]}

---

# 📊 데이터·근거 보완 제안

## 근거 충실도 진단
**현재 수준**: ★★☆☆☆
(데이터·근거의 충실도 평가)

---

## 근거 부족 구간 및 보완 제안

각 항목마다 아래 형식으로 작성:

**[섹션명] — 근거 보완 필요**
- 현재 주장: `(근거 없이 주장만 있는 문장)`
- 부족한 이유: (왜 설득력이 약한지)
- 필요한 근거 유형: (시장 데이터 / 고객 조사 / 경쟁사 사례 / 재무 수치 등)
- 구체적 보완 방향:
  - 찾아야 할 데이터: (어떤 숫자/사실이 필요한지)
  - 참고할 출처: (업종 리포트, 통계청, 업계 자료 등)
  - 없을 경우 대안: (자체 조사 설계 또는 합리적 추정 방법)

---

## 우선순위별 데이터 확보 과제
| 우선순위 | 필요 데이터 | 용도 | 확보 방법 | 난이도 |
|---------|-----------|------|---------|------|
| 🔴 필수 | | | | |
| 🟡 권장 | | | | |
| 🟢 있으면 좋음 | | | | |

---

## 벤치마크 사례 제안
기획안을 뒷받침할 수 있는 유사 업종/프로젝트 성공 사례 방향:

1. **국내 사례**: (어떤 유형의 사례를 찾으면 좋은지)
2. **해외 사례**: (글로벌 레퍼런스 방향)
3. **수치 벤치마크**: (업계 평균치, 성장률 등 확인 포인트)

---

## 자체 데이터 생성 제안
외부 데이터를 구하기 어려울 때 자체적으로 만들 수 있는 근거:

- **간이 설문 설계안**: (5문항 이내로 핵심 인사이트를 얻을 수 있는 설문)
- **파일럿 테스트 설계**: (소규모 실험으로 데이터를 만드는 방법)
- **전문가 인터뷰 질문지**: (업계 전문가에게 물어볼 핵심 질문 5가지)
"""


def make_final_prompt(project_text: str, draft: str,
                       logic_edit: str, impact_edit: str, data_edit: str) -> str:
    return f"""아래 기획안 초안과 3종의 첨삭 리포트를 모두 반영하여
최종 완성본 기획안을 작성하세요.

[프로젝트 배경]
{project_text[:1000]}

[첨삭 핵심 요약]
논리 구조 핵심 개선점: {logic_edit[:1500]}

설득력 강화 핵심 개선점: {impact_edit[:1500]}

데이터 보완 핵심 제안: {data_edit[:1000]}

---

첨삭 내용을 최대한 반영하되, 원래 기획안의 구조는 유지하세요.
개선된 표현, 강화된 논리, 추가된 근거를 녹여 완성도 높은 최종본을 작성합니다.
데이터가 없는 곳은 [확인 필요: 어떤 데이터] 형태로 표시하세요.

# ✅ 기획안 최종 완성본

## Executive Summary
> (첨삭 반영 — 5초 안에 Yes 하게 만드는 강력한 버전)

---

## 1. 기획 배경 및 목적
### 1-1. 현황 및 문제 인식
(논리·데이터 강화 반영)

### 1-2. 기획 목적

### 1-3. 기회의 창
(지금 실행해야 하는 이유 — 임팩트 강화 반영)

---

## 2. 목표 설정
| 구분 | 지표 | 현재 | 목표 | 달성 기간 |
|------|------|------|------|---------|

---

## 3. 전략 방향

**전략 1: [전략명]**
**전략 2: [전략명]**
**전략 3: [전략명]**

---

## 4. 실행 계획
### 4-1. 단계별 실행 로드맵
| 단계 | 기간 | 핵심 활동 | 담당 | 산출물 |
|------|------|---------|------|------|

### 4-2. 타임라인

---

## 5. 자원 계획
### 예산
| 항목 | 금액 | 비중 | 비고 |
|------|------|------|------|

---

## 6. 기대 효과 및 ROI
(설득력·임팩트 강화 반영 — 수치 중심)

---

## 7. 리스크 및 대응 방안
| 리스크 | 가능성 | 영향도 | 대응 방안 |
|--------|--------|--------|---------|

---

## 8. 의사결정 요청 사항

---

## 📎 첨삭 반영 사항 요약
*(이 기획안에 반영된 주요 개선 내용 — 3~5줄)*
"""


# ─── 핵심 실행 함수 ───────────────────────────────────────────────────────────

def run_stage(client: anthropic.Anthropic, label: str, prompt: str,
              max_tokens: int = 8000) -> str:
    print(f"\n  {label} 작성 중 ", end="", flush=True)
    result = ""
    char_count = 0

    with client.messages.stream(
        model=MODEL,
        max_tokens=max_tokens,
        thinking={"type": "adaptive"},
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            result += text
            char_count += len(text)
            if char_count >= 60:
                print(".", end="", flush=True)
                char_count = 0

    print(" 완료 ✓")
    return result


def save_file(content: str, filename: str, output_dir: Path) -> Path:
    filepath = output_dir / filename
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    return filepath


# ─── 폴더 넘버링 ─────────────────────────────────────────────────────────────

def next_numbered_dir(base: Path, name: str) -> Path:
    """결과물 폴더를 01_이름, 02_이름 ... 순서로 자동 넘버링합니다."""
    base.mkdir(parents=True, exist_ok=True)
    existing = [d for d in base.iterdir() if d.is_dir() and d.name[:2].isdigit()]
    numbers = [int(d.name[:2]) for d in existing] if existing else [0]
    next_num = max(numbers) + 1
    safe_name = name.replace("/", "_").replace(" ", "_")[:30]
    return base / f"{next_num:02d}_{safe_name}"


# ─── 메인 ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="기획안 작성 & 첨삭 에이전트",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--input", "-i", type=str,
                        help="프로젝트 정보 텍스트 파일 경로")
    parser.add_argument("--dir", "-d", type=str,
                        help="브랜드 전략 결과물 폴더 경로 (*.md 파일 자동 로드)")
    args = parser.parse_args()

    # API 키 확인
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("\n  [오류] ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.")
        print("  export ANTHROPIC_API_KEY='sk-ant-...'")
        sys.exit(1)

    client = anthropic.Anthropic()

    # 프로젝트 정보 수집
    if args.dir:
        print(f"\n  결과물 폴더에서 내용을 불러옵니다: {args.dir}")
        raw_content = load_from_dir(args.dir)
        project_text = raw_content[:6000]
        title = Path(args.dir).name
    elif args.input:
        print(f"\n  파일에서 내용을 불러옵니다: {args.input}")
        project_text = load_from_file(args.input)
        title = Path(args.input).stem
    else:
        info = collect_project_info()
        project_text = format_project_text(info)
        title = info.get("title", "기획안")

    # 출력 폴더 생성 (자동 넘버링)
    output_dir = next_numbered_dir(OUTPUT_BASE, f"기획안_{title}")
    output_dir.mkdir(parents=True, exist_ok=True)

    print()
    print("─" * 65)
    print(f"  기획안 작성 시작: {title}")
    print(f"  결과물 저장 위치: {output_dir}")
    print("─" * 65)

    results = {}

    try:
        # ── 1. 기획안 초안 ────────────────────────────────────────────────
        results["draft"] = run_stage(
            client, "[초안] 기획안 작성",
            make_draft_prompt(project_text)
        )
        save_file(results["draft"], "1_기획안_초안.md", output_dir)

        # ── 2. 논리 구조 첨삭 ─────────────────────────────────────────────
        results["logic"] = run_stage(
            client, "[첨삭 1/3] 논리 구조 강화",
            make_logic_edit_prompt(project_text, results["draft"])
        )
        save_file(results["logic"], "2_첨삭_논리구조.md", output_dir)

        # ── 3. 설득력·임팩트 첨삭 ────────────────────────────────────────
        results["impact"] = run_stage(
            client, "[첨삭 2/3] 설득력·임팩트 강화",
            make_impact_edit_prompt(project_text, results["draft"])
        )
        save_file(results["impact"], "3_첨삭_설득력임팩트.md", output_dir)

        # ── 4. 데이터·근거 보완 제안 ──────────────────────────────────────
        results["data"] = run_stage(
            client, "[첨삭 3/3] 데이터·근거 보완 제안",
            make_data_edit_prompt(project_text, results["draft"])
        )
        save_file(results["data"], "4_첨삭_데이터근거.md", output_dir)

        # ── 5. 첨삭 반영 최종 완성본 ──────────────────────────────────────
        results["final"] = run_stage(
            client, "[최종] 첨삭 반영 완성본",
            make_final_prompt(
                project_text,
                results["draft"],
                results["logic"],
                results["impact"],
                results["data"],
            ),
            max_tokens=10000,
        )
        save_file(results["final"], "5_기획안_최종완성본.md", output_dir)

    except anthropic.AuthenticationError:
        print("\n  [오류] API 키가 유효하지 않습니다.")
        sys.exit(1)
    except anthropic.RateLimitError:
        print("\n  [오류] API 요청 한도 초과. 잠시 후 재시도하세요.")
        sys.exit(1)
    except KeyboardInterrupt:
        print(f"\n\n  [중단] 지금까지 생성된 파일은 {output_dir} 에 저장되어 있습니다.")
        sys.exit(0)

    # ── 완료 ──────────────────────────────────────────────────────────────
    total_chars = sum(len(v) for v in results.values())
    print()
    print("=" * 65)
    print(f"  완료! — {title}")
    print("=" * 65)
    print()
    print(f"  📁 {output_dir}")
    print()
    print("  생성된 산출물:")
    print("    ├─ 1_기획안_초안.md           ← 실행 가능한 기획안 초안")
    print("    ├─ 2_첨삭_논리구조.md         ← 논리 흐름 점검 & 개선 제안")
    print("    ├─ 3_첨삭_설득력임팩트.md     ← 설득력·임팩트 강화 제안")
    print("    ├─ 4_첨삭_데이터근거.md       ← 데이터·근거 보완 제안")
    print("    └─ 5_기획안_최종완성본.md     ← 첨삭 전부 반영한 완성본")
    print()
    print(f"  총 {total_chars:,}자 분량의 기획 문서가 생성되었습니다.")
    print()


if __name__ == "__main__":
    main()
