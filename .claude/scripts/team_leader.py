#!/usr/bin/env python3
"""
팀장 에이전트 — 최상위 오케스트레이터
사용자의 지시사항을 분석해 적재적소의 에이전트에게 작업을 위임합니다.

사용법:
  python team_leader.py                    # 대화형 입력
  python team_leader.py --task "지시사항"  # 직접 입력
  python team_leader.py --input task.txt   # 파일 입력
"""

import sys
import os
import json
import argparse
import subprocess
import tempfile
import textwrap
from pathlib import Path
from datetime import datetime

import anthropic

# ── 경로 설정 ─────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent          # 클로드/
AGENTS: dict[str, dict] = {
    "brand_strategy": {
        "label": "브랜드 전략기획 에이전트",
        "script": BASE_DIR / "전략기획_에이전트/자동화시스템/brand_strategy_agent.py",
        "output_base": BASE_DIR / "전략기획_에이전트/결과물",
        "stdin_needed": False,
    },
    "planning": {
        "label": "사업 기획 에이전트",
        "script": BASE_DIR / "전략기획_에이전트/자동화시스템/planning_agent.py",
        "output_base": BASE_DIR / "전략기획_에이전트/결과물",
        "stdin_needed": False,
    },
    "design": {
        "label": "디자인 에이전트",
        "script": BASE_DIR / "디자인_에이전트/자동화시스템/design_agent.py",
        "output_base": BASE_DIR / "디자인_에이전트/결과물",
        "stdin_needed": True,   # 디자인 유형 선택 stdin
    },
    "program": {
        "label": "프로그램 개발 에이전트",
        "script": BASE_DIR / "프로그램개발_에이전트/자동화시스템/program_agent.py",
        "output_base": BASE_DIR / "프로그램개발_에이전트/결과물",
        "stdin_needed": True,   # 프로그램 유형 선택 stdin
    },
}

# ── 시스템 프롬프트 ───────────────────────────────────────────────────────────
SYSTEM_PROMPT = """당신은 크리에이티브 에이전시의 팀장 AI입니다.
사용자의 지시사항을 분석해 아래 4개 에이전트 중 필요한 것을 순서대로 실행할 계획을 JSON으로 출력하세요.

사용 가능한 에이전트:
1. brand_strategy — 브랜드 전략기획 (브랜드명·컨셉·타깃·포지셔닝·네이밍 등)
2. planning       — 사업 기획 (비즈니스 모델·실행 계획·마케팅 전략 등)
3. design         — 디자인 제작 (로고·포스터·소셜미디어·명함·브로슈어 등 시각물)
4. program        — 프로그램 개발 (웹앱·대시보드·계산기·폼·게임 등 단일 HTML)

판단 기준:
- "브랜드 만들어줘" → brand_strategy 먼저, 이후 design도 가능
- "로고 만들어줘" / "디자인 해줘" → design
- "앱 만들어줘" / "계산기 만들어줘" → program
- "사업 계획서" / "기획서" → planning
- 복합 요청은 논리적 순서대로 여러 에이전트 지정

출력 형식 (JSON만, 설명 없이):
{
  "summary": "한 줄 작업 요약",
  "tasks": [
    {
      "agent": "brand_strategy",
      "brief": "이 에이전트에게 전달할 구체적인 작업 브리프 (한국어, 상세하게)",
      "design_type": "로고",          // design 에이전트일 때만: 디자인 유형 한 가지
      "program_type": "웹앱",         // program 에이전트일 때만: 프로그램 유형 한 가지
      "use_strategy_output": false    // design 에이전트가 brand_strategy 결과를 이어받을 때 true
    }
  ]
}

design_type 선택지: 로고, 소셜미디어, 랜딩페이지, 배너, 이메일, 포스터, 브로슈어, 명함, 프레젠테이션, 컬러팔레트, 타이포, 기타
program_type 선택지: 웹앱, 대시보드, 자동화도구, 폼, 계산기, 게임, 기타
"""

# ── 유틸리티 ──────────────────────────────────────────────────────────────────

def print_header():
    print("\n" + "=" * 60)
    print("  🎯  팀장 에이전트  |  Claude Opus 4.6")
    print("=" * 60)

def print_divider(label: str = ""):
    width = 60
    if label:
        pad = (width - len(label) - 2) // 2
        print(f"\n{'─' * pad} {label} {'─' * (width - pad - len(label) - 2)}")
    else:
        print("─" * width)

def snapshot_dirs(base: Path) -> set[Path]:
    """결과물 폴더의 현재 상태 스냅샷"""
    if not base.exists():
        return set()
    return set(base.rglob("*/"))

def find_new_dirs(base: Path, before: set[Path]) -> list[Path]:
    """스냅샷 이후 새로 생성된 폴더 목록"""
    if not base.exists():
        return []
    after = set(base.rglob("*/"))
    new = sorted(after - before)
    # 최상위 새 폴더만 반환 (하위 폴더 중복 제거)
    result = []
    for d in new:
        if not any(d.is_relative_to(r) for r in result):
            result.append(d)
    return result

def latest_strategy_dir() -> Path | None:
    """전략기획 결과물 중 가장 최근 폴더 반환"""
    base = AGENTS["brand_strategy"]["output_base"]
    if not base.exists():
        return None
    candidates = sorted(
        [d for d in base.iterdir() if d.is_dir()],
        key=lambda d: d.stat().st_mtime,
        reverse=True,
    )
    return candidates[0] if candidates else None

# ── Claude 분석 ───────────────────────────────────────────────────────────────

def analyze_task(client: anthropic.Anthropic, instruction: str) -> dict:
    """Claude로 작업을 분석해 실행 계획 JSON 반환"""
    print_divider("작업 분석 중")
    print("📋 지시사항을 검토하고 에이전트 배치 계획을 수립합니다...")

    collected = []

    with client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=2048,
        thinking={"type": "adaptive"},
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": instruction}],
    ) as stream:
        for event in stream:
            if hasattr(event, "type"):
                if event.type == "content_block_delta":
                    delta = event.delta
                    if hasattr(delta, "type"):
                        if delta.type == "text_delta":
                            collected.append(delta.text)
                        elif delta.type == "thinking_delta":
                            pass  # 사고 과정은 표시 안 함

    raw = "".join(collected).strip()

    # JSON 블록 추출
    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0].strip()
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0].strip()

    try:
        plan = json.loads(raw)
    except json.JSONDecodeError:
        # JSON 파싱 실패 시 기본 계획
        print("⚠️  계획 파싱 실패. 수동으로 에이전트를 선택합니다.")
        plan = {"summary": instruction[:50], "tasks": []}

    return plan

# ── 에이전트 실행 ─────────────────────────────────────────────────────────────

def run_agent(
    agent_name: str,
    brief: str,
    extra_flags: list[str] | None = None,
    stdin_text: str | None = None,
) -> tuple[bool, list[Path]]:
    """
    하위 에이전트를 subprocess로 실행합니다.
    반환: (성공 여부, 새로 생성된 결과물 폴더 목록)
    """
    agent = AGENTS[agent_name]
    script = agent["script"]
    output_base = agent["output_base"]

    if not script.exists():
        print(f"  ❌ 스크립트 없음: {script}")
        return False, []

    # 브리프를 임시 파일로 저장
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".txt", delete=False, encoding="utf-8"
    ) as tmp:
        tmp.write(brief)
        brief_path = tmp.name

    # 실행 전 스냅샷
    before = snapshot_dirs(output_base)

    cmd = [sys.executable, str(script), "--input", brief_path]
    if extra_flags:
        cmd.extend(extra_flags)

    stdin_bytes = stdin_text.encode("utf-8") if stdin_text else None

    try:
        result = subprocess.run(
            cmd,
            input=stdin_bytes,
            capture_output=False,  # 에이전트 출력 그대로 표시
            text=False,
            timeout=1200,          # 20분 제한
        )
        success = result.returncode == 0
    except subprocess.TimeoutExpired:
        print("  ⏱️  시간 초과 (20분)")
        success = False
    except Exception as e:
        print(f"  ❌ 실행 오류: {e}")
        success = False
    finally:
        Path(brief_path).unlink(missing_ok=True)

    # 실행 후 새 폴더 탐색
    new_dirs = find_new_dirs(output_base, before)
    return success, new_dirs

# ── 메인 실행 루프 ────────────────────────────────────────────────────────────

def execute_plan(client: anthropic.Anthropic, plan: dict, instruction: str):
    """분석된 계획을 순서대로 실행"""
    tasks = plan.get("tasks", [])
    summary = plan.get("summary", instruction[:50])

    if not tasks:
        print("\n⚠️  실행할 작업이 없습니다. 지시사항을 더 구체적으로 입력해주세요.")
        return

    print_divider("실행 계획")
    print(f"📌 {summary}\n")
    for i, task in enumerate(tasks, 1):
        agent_label = AGENTS.get(task["agent"], {}).get("label", task["agent"])
        print(f"  {i}. {agent_label}")
        brief_preview = task.get("brief", "")[:80].replace("\n", " ")
        print(f"     └ {brief_preview}{'...' if len(task.get('brief','')) > 80 else ''}")

    print()
    input("▶  Enter를 눌러 실행을 시작합니다... ")

    results_log = []
    last_strategy_dirs: list[Path] = []

    for i, task in enumerate(tasks, 1):
        agent_name = task.get("agent", "")
        brief = task.get("brief", instruction)
        agent_label = AGENTS.get(agent_name, {}).get("label", agent_name)

        print_divider(f"[{i}/{len(tasks)}] {agent_label}")

        if agent_name not in AGENTS:
            print(f"  ❌ 알 수 없는 에이전트: {agent_name}")
            results_log.append({"agent": agent_name, "success": False, "dirs": []})
            continue

        # 에이전트별 추가 플래그 / stdin 구성
        extra_flags = []
        stdin_text = None

        if agent_name == "design":
            design_type = task.get("design_type", "기타")
            stdin_text = design_type + "\n"

            # 전략기획 결과를 이어받는 경우
            if task.get("use_strategy_output") and last_strategy_dirs:
                strat_dir = last_strategy_dirs[0]
                extra_flags = ["--dir", str(strat_dir)]
                print(f"  🔗 전략기획 결과 연동: {strat_dir.name}")

        elif agent_name == "program":
            program_type = task.get("program_type", "웹앱")
            stdin_text = program_type + "\n"

        elif agent_name in ("brand_strategy", "planning"):
            pass  # 추가 플래그 없음

        print(f"  📤 브리프 전달 중...\n")

        success, new_dirs = run_agent(agent_name, brief, extra_flags, stdin_text)

        # 전략기획 결과 저장 (다음 에이전트가 이어받을 수 있도록)
        if agent_name in ("brand_strategy", "planning") and new_dirs:
            last_strategy_dirs = new_dirs

        status = "✅ 완료" if success else "❌ 실패"
        results_log.append({
            "agent": agent_name,
            "label": agent_label,
            "success": success,
            "dirs": [str(d) for d in new_dirs],
        })
        print(f"\n  {status} — {agent_label}")
        if new_dirs:
            for d in new_dirs:
                print(f"     📁 {d}")

    # ── 최종 보고서 ──────────────────────────────────────────────────────────
    print_divider("최종 보고서")
    print(f"🕐 완료 시각: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")

    success_count = sum(1 for r in results_log if r["success"])
    print(f"  실행: {len(results_log)}개 에이전트  |  성공: {success_count}개  |  실패: {len(results_log) - success_count}개\n")

    for r in results_log:
        icon = "✅" if r["success"] else "❌"
        print(f"  {icon} {r.get('label', r['agent'])}")
        for d in r.get("dirs", []):
            print(f"     └ {d}")

    print()

# ── CLI 진입점 ────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="팀장 에이전트 — 자동 에이전트 오케스트레이터")
    parser.add_argument("--task", type=str, help="지시사항 직접 입력")
    parser.add_argument("--input", type=str, help="지시사항 텍스트 파일 경로")
    args = parser.parse_args()

    print_header()

    # 지시사항 수집
    if args.input:
        instruction = Path(args.input).read_text(encoding="utf-8").strip()
        print(f"\n📄 파일에서 지시사항 로드: {args.input}")
        print(f"   {instruction[:120]}{'...' if len(instruction) > 120 else ''}")
    elif args.task:
        instruction = args.task.strip()
    else:
        print("\n무엇을 만들어드릴까요?")
        print("(브랜드 전략·디자인·프로그램·기획 등 자유롭게 입력하세요)\n")
        instruction = ""
        while not instruction.strip():
            instruction = input("▶ 지시사항: ").strip()

    if not instruction:
        print("❌ 지시사항이 없습니다.")
        sys.exit(1)

    # Claude API 클라이언트
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY 환경 변수를 설정해주세요.")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    # 분석 → 실행
    plan = analyze_task(client, instruction)

    print_divider("")
    print(f"🗂️  분석 결과: {plan.get('summary', '')}")
    print(f"   총 {len(plan.get('tasks', []))}개 에이전트 투입 예정")

    execute_plan(client, plan, instruction)


if __name__ == "__main__":
    main()
