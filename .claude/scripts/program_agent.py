#!/usr/bin/env python3
"""
프로그램 개발 에이전트
────────────────────────────────────────────────────────────────
목적과 구성을 입력하면 가독성 좋고 직관적인 프로그램을 자동으로 기획·개발합니다.

[지원 프로그램 유형]
  웹앱    : HTML/CSS/JS — 브라우저에서 파일 열기만 하면 바로 실행
  대시보드 : Chart.js 기반 데이터 시각화 웹 대시보드
  자동화   : Python 자동화·배치 스크립트 (파일 처리, 반복 작업)
  CLI     : Python 커맨드라인 유틸리티 (argparse + 컬러 출력)
  GUI     : Python/tkinter 데스크탑 앱 (창 형태)
  API서버  : Python/Flask REST API 백엔드

[실행 방법]
  python program_agent.py                       # 인터랙티브 입력
  python program_agent.py --input brief.txt     # 텍스트 파일 입력
  python program_agent.py --dir ../../전략기획_에이전트/결과물/01_브랜드명
"""

import anthropic
import os
import sys
import argparse
import re
import io
import json
import zipfile
import urllib.request
from pathlib import Path


# ─── 설정 ────────────────────────────────────────────────────────────────────

MODEL       = "claude-opus-4-6"
OUTPUT_BASE = Path(__file__).parent.parent / "결과물"

SYSTEM_PROMPT = """당신은 풀스택 시니어 개발자이자 UX 엔지니어입니다.
15년 경력으로 스타트업부터 대기업까지 다양한 프로덕트를 개발해왔습니다.

━━━ 핵심 제약 (반드시 준수) ━━━
모든 프로그램은 단일 HTML 파일 하나로 완성해야 합니다.
- 설치 불필요, 로그인 불필요
- 파일을 열거나 URL을 공유하면 누구나 즉시 실행
- CSS·JavaScript 모두 HTML 파일 안에 인라인으로 포함
- 외부 리소스는 CDN URL만 허용 (로컬 파일 참조 금지)
- 백엔드 서버 불필요: 모든 로직을 브라우저 JavaScript로 구현
  → Python 로직이 필요하면 JavaScript로 동등하게 변환
  → 데이터 영속성이 필요하면 localStorage / IndexedDB 사용
  → 파일 처리는 File API (drag-and-drop 또는 input[type=file]) 사용
  → 차트·수식·복잡한 연산도 CDN 라이브러리로 브라우저에서 처리

━━━ 개발 원칙 ━━━
1. 완성 코드 — 스켈레톤·TODO·placeholder 절대 금지. 복붙 즉시 실행 가능
2. 가독성 최우선 — 명확한 변수명, 모든 함수에 한국어 목적 주석
3. 직관적 UX — 설명서 없이도 누구나 쓸 수 있는 인터페이스
4. 한국어 UI — 모든 텍스트·레이블·에러 메시지는 한국어
5. CDN 의존성 최소화 — 꼭 필요한 것 1~2개 이하
6. 에러 처리 — 친절한 한국어 메시지, 페이지 리로드 없이 복구"""


# ─── 프로그램 유형 ────────────────────────────────────────────────────────────

PROGRAM_TYPES = {
    "웹앱": {
        "label": "웹 애플리케이션",
        "tech":  "HTML / CSS / JS — 단일 파일",
        "run":   "브라우저에서 열기 또는 URL 공유",
        "desc":  "범용 도구·폼·계산기·관리 화면 등",
        "ext":   ["html"],
    },
    "대시보드": {
        "label": "데이터 대시보드",
        "tech":  "HTML / Chart.js — 단일 파일",
        "run":   "브라우저에서 열기 또는 URL 공유",
        "desc":  "KPI·차트·데이터 시각화 화면",
        "ext":   ["html"],
    },
    "자동화도구": {
        "label": "자동화 웹 도구",
        "tech":  "HTML / JS — File API + localStorage",
        "run":   "브라우저에서 열기 또는 URL 공유",
        "desc":  "파일 변환·일괄 처리·자동화를 웹으로",
        "ext":   ["html"],
    },
    "폼": {
        "label": "입력 폼 & 수집기",
        "tech":  "HTML / JS — localStorage 저장",
        "run":   "브라우저에서 열기 또는 URL 공유",
        "desc":  "설문·신청서·체크리스트·데이터 수집",
        "ext":   ["html"],
    },
    "계산기": {
        "label": "계산·변환 도구",
        "tech":  "HTML / JS — 단일 파일",
        "run":   "브라우저에서 열기 또는 URL 공유",
        "desc":  "수식·단위 변환·견적·점수 계산 등",
        "ext":   ["html"],
    },
    "게임": {
        "label": "미니 게임",
        "tech":  "HTML / Canvas / JS — 단일 파일",
        "run":   "브라우저에서 열기 또는 URL 공유",
        "desc":  "퀴즈·퍼즐·캐주얼 게임",
        "ext":   ["html"],
    },
    "기타": {
        "label": "자유 형식",
        "tech":  "HTML / JS — 단일 파일",
        "run":   "브라우저에서 열기 또는 URL 공유",
        "desc":  "요구사항에 맞는 최적 구현 자동 선택",
        "ext":   ["html"],
    },
}


# ─── 정보 수집 ────────────────────────────────────────────────────────────────

def collect_program_brief() -> dict:
    print()
    print("=" * 65)
    print("  프로그램 개발 에이전트  |  Claude Opus 4.6")
    print("=" * 65)
    print()
    print("  지원 유형:")
    types_list = list(PROGRAM_TYPES.keys())
    for i, t in enumerate(types_list, 1):
        info = PROGRAM_TYPES[t]
        print(f"  {i:2}. {t:<8}  {info['desc']}")
    print()

    data = {}

    # 유형 선택
    while True:
        raw = input("  프로그램 유형 (번호 또는 이름): ").strip()
        if not raw:
            continue
        selected = []
        for item in raw.split(","):
            item = item.strip()
            if item.isdigit() and 1 <= int(item) <= len(types_list):
                selected.append(types_list[int(item) - 1])
            elif item in PROGRAM_TYPES:
                selected.append(item)
            else:
                match = [t for t in PROGRAM_TYPES if item in t]
                if match:
                    selected.extend(match[:1])
        if selected:
            data["types"] = selected
            print(f"  → 선택: {', '.join(selected)}")
            break
        print("  ※ 유효한 유형을 입력해주세요.")

    print()
    questions = [
        ("project",  "1. 프로그램명 *",                                       True),
        ("purpose",  "2. 목적 — 이 프로그램이 해결하는 문제 *",               True),
        ("user",     "3. 주 사용자 (예: 기획자, 영업팀, 나 혼자)",             False),
        ("features", "4. 핵심 기능 목록 * (쉼표 또는 줄바꿈으로 구분)",        True),
        ("data",     "5. 입력 데이터 형태 (예: CSV 파일, 직접 입력, API)",     False),
        ("ui_style", "6. UI 스타일 (예: 심플/다크/컬러풀, 없으면 Enter)",     False),
        ("reference","7. 참고 서비스·앱 (예: Notion, Linear, 없으면 Enter)", False),
        ("extra",    "8. 추가 요청·제약 조건",                                False),
    ]

    for key, question, required in questions:
        while True:
            answer = input(f"  {question}: ").strip()
            if answer or not required:
                data[key] = answer
                break
            print("  ※ 필수 항목입니다.")

    return data


def format_brief(data: dict) -> str:
    return "\n".join([
        f"프로그램명: {data.get('project', '미정')}",
        f"유형: {', '.join(data.get('types', ['기타']))}",
        f"목적: {data.get('purpose', '')}",
        f"주 사용자: {data.get('user', '일반 사용자')}",
        f"핵심 기능:\n{data.get('features', '')}",
        f"입력 데이터: {data.get('data', '미정')}",
        f"UI 스타일: {data.get('ui_style', '클린 미니멀')}",
        f"참고 서비스: {data.get('reference', '없음')}",
        f"추가 요청: {data.get('extra', '없음')}",
    ])


def load_from_file(filepath: str) -> tuple[str, str]:
    path = Path(filepath)
    if not path.exists():
        print(f"  [오류] 파일 없음: {filepath}")
        sys.exit(1)
    content = path.read_text(encoding="utf-8")
    first_line = content.strip().split("\n")[0]
    project_name = (
        first_line.replace("프로그램명:", "").replace("#", "").strip()[:30]
        or "프로젝트"
    )
    return content, project_name


def load_from_strategy_dir(dirpath: str) -> tuple[str, str]:
    base = Path(dirpath)
    if not base.exists():
        print(f"  [오류] 폴더 없음: {dirpath}")
        sys.exit(1)
    texts = []
    for md in sorted(base.glob("*.md"))[:3]:
        texts.append(f"=== {md.name} ===\n{md.read_text(encoding='utf-8')}")
    project_name = (
        base.name.split("_", 1)[-1][:30]
        if "_" in base.name else base.name[:30]
    )
    return "\n\n".join(texts), project_name


# ─── 프롬프트 ────────────────────────────────────────────────────────────────

def prompt_planning(brief: str, prog_types: list) -> str:
    type_lines = "\n".join(
        f"- {t}: {PROGRAM_TYPES.get(t, {}).get('tech', '')} / {PROGRAM_TYPES.get(t, {}).get('desc', '')}"
        for t in prog_types
    )
    return f"""다음 요구사항을 분석해 프로그램 기획서를 작성해주세요.

[요구사항]
{brief}

[선택된 유형]
{type_lines}

## 1. 프로그램 개요
- 한 줄 핵심 설명
- 해결하는 문제와 기대 효과
- 현재 없을 때 vs 있을 때의 차이

## 2. 기술 스택 선정 및 이유
- 최종 선택 기술 스택
- 선택 이유 (가독성·실행 편의성·유지보수 기준)
- 사용할 외부 라이브러리/CDN (최소화 원칙)

## 3. 핵심 기능 목록
| 기능 | 우선순위 | 설명 |
|------|---------|------|
- Must Have (핵심) / Nice to Have (추가) 구분

## 4. UX 원칙 (이 프로그램 전용)
- 인터페이스 설계 원칙 3~5가지
- 사용자 플로우 (User Flow) 요약
- 주요 상태: 초기·로딩·성공·에러 상태 처리 방법

## 5. 파일 구조
- 생성될 파일 목록과 각 파일의 역할

## 6. 실행 환경 요구사항
- 필요 Python 버전, 브라우저, pip 패키지 등"""


def prompt_uiux(brief: str, planning: str) -> str:
    return f"""다음 기획서를 바탕으로 UI/UX 설계서를 작성해주세요.

[요구사항]
{brief}

[기획서]
{planning[:3000]}

## 1. 화면 구성도 (텍스트 와이어프레임)
- ASCII 아트로 각 화면의 레이아웃을 그려주세요
- 주요 컴포넌트 위치와 역할 표기

## 2. 디자인 시스템
- 배경·주 색상·강조색 (HEX 코드로)
- 폰트: 패밀리, 크기 체계 (h1/h2/body/caption)
- 버튼·입력창·카드 등 컴포넌트 스펙

## 3. 인터랙션 설계
- 각 버튼·입력·결과 표시의 동작 흐름
- 로딩 / 성공 / 에러 / 빈 상태 (Empty State) 처리
- 애니메이션 타이밍 (transition 값)

## 4. 가독성 체크리스트
- 폰트 최소 크기, 색상 대비비 (4.5:1 이상)
- 버튼 클릭 영역 (최소 44px)
- 모바일 대응 여부"""


def prompt_code(brief: str, planning: str, uiux: str, prog_types: list) -> str:
    return f"""다음 기획서와 설계서를 바탕으로 완성된 프로그램 코드를 작성해주세요.

[요구사항]
{brief}

[기획서 요약]
{planning[:2500]}

[UI/UX 설계 요약]
{uiux[:2000]}

━━━ 출력 형식 (필수) ━━━
반드시 단일 HTML 파일 하나로 완성하세요.
- ```html 코드블록 하나에 전체 코드를 담을 것
- CSS는 <style> 태그 안에 인라인
- JavaScript는 <script> 태그 안에 인라인
- 외부 파일 참조 금지 (CDN URL은 허용)
- 이 파일만 공유하면 설치·로그인 없이 누구나 실행 가능해야 함

━━━ 코드 작성 규칙 ━━━
- 완성 코드만 (TODO·placeholder·'여기에 구현' 절대 금지)
- 모든 함수에 한국어 목적 주석 한 줄
- CSS 변수(--color-primary 등)로 테마 색상 관리
- 반응형: 모바일(360px) · 태블릿(768px) · PC(1200px)
- 모든 인터랙션에 transition: 0.2s ease 적용
- 빈 상태(Empty State) 화면 + 로딩 상태 포함
- 에러는 alert 대신 인라인 메시지 박스로 표시

━━━ 데이터 처리 방식 ━━━
- 데이터 저장: localStorage (간단) / IndexedDB (대용량)
- 파일 읽기: <input type="file"> + FileReader API
- 파일 내보내기: Blob + URL.createObjectURL 다운로드
- 차트: Chart.js CDN
- 엑셀 처리: SheetJS (xlsx) CDN
- 수학 연산: Math 내장 객체 (라이브러리 불필요)"""


def prompt_readme(brief: str, planning: str, prog_types: list) -> str:
    type_info = PROGRAM_TYPES.get(prog_types[0], {})
    return f"""다음 프로그램의 README.md를 작성해주세요.
읽는 사람이 기술 비전문가여도 5분 안에 설치·실행할 수 있어야 합니다.

[요구사항]
{brief}

[기획 요약]
{planning[:2000]}

[실행 방법]
{type_info.get('run', '')}

README에 포함:

# (프로그램명)
> 한 줄 설명

## ✨ 주요 기능
- 기능 3~5가지 (emoji + 한 줄)

## 🚀 빠른 시작
### 필요 환경
### 설치 방법 (단계별 번호 목록)
### 실행 방법

## 📖 사용 방법
- 각 기능 상세 사용법 (스크린샷 대신 텍스트로 설명)
- 예시 입력/출력

## ⚙️ 설정 및 커스터마이징
- 수정 가능한 값과 방법 (코드 내 어디를 바꾸면 되는지)

## ❓ 자주 묻는 질문
- 예상 오류 3가지와 해결 방법

## 📄 라이선스
MIT"""


# ─── API 스트리밍 호출 ────────────────────────────────────────────────────────

def run_stage(client, label: str, prompt: str, max_tokens: int = 8000) -> str:
    print(f"\n  {label} ", end="", flush=True)
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


# ─── 파일 저장 ────────────────────────────────────────────────────────────────

def save_file(content: str, filename: str, output_dir: Path) -> Path:
    filepath = output_dir / filename
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    return filepath


def extract_and_save_code(content: str, output_dir: Path, project_name: str) -> list[str]:
    """마크다운 응답에서 코드 블록을 추출해 실행 가능한 파일로 저장."""
    files_dir = output_dir / "파일"
    files_dir.mkdir(exist_ok=True)
    saved = []

    # HTML 블록
    html_blocks = re.findall(r'```html\n(.*?)```', content, re.DOTALL)
    for i, block in enumerate(html_blocks, 1):
        suffix = f"_{i}" if len(html_blocks) > 1 else ""
        fname = f"{project_name}{suffix}.html"
        (files_dir / fname).write_text(block.strip(), encoding="utf-8")
        print(f"  → HTML:   파일/{fname}")
        saved.append(fname)

    # Python 블록
    py_blocks = re.findall(r'```python\n(.*?)```', content, re.DOTALL)
    for i, block in enumerate(py_blocks, 1):
        suffix = f"_{i}" if len(py_blocks) > 1 else ""
        fname = f"{project_name}{suffix}.py"
        (files_dir / fname).write_text(block.strip(), encoding="utf-8")
        print(f"  → Python: 파일/{fname}")
        saved.append(fname)

    # JavaScript 블록 (독립 .js 파일)
    js_blocks = re.findall(r'```javascript\n(.*?)```', content, re.DOTALL)
    for i, block in enumerate(js_blocks, 1):
        if len(block.strip()) > 200:
            suffix = f"_{i}" if len(js_blocks) > 1 else ""
            fname = f"{project_name}{suffix}.js"
            (files_dir / fname).write_text(block.strip(), encoding="utf-8")
            print(f"  → JS:     파일/{fname}")
            saved.append(fname)

    # CSS 블록 (독립 .css 파일)
    css_blocks = re.findall(r'```css\n(.*?)```', content, re.DOTALL)
    for i, block in enumerate(css_blocks, 1):
        if len(block.strip()) > 200:
            suffix = f"_{i}" if len(css_blocks) > 1 else ""
            fname = f"{project_name}_style{suffix}.css"
            (files_dir / fname).write_text(block.strip(), encoding="utf-8")
            print(f"  → CSS:    파일/{fname}")
            saved.append(fname)

    # requirements.txt
    req_blocks = re.findall(r'```requirements.*?\n(.*?)```', content, re.DOTALL)
    if req_blocks:
        req = req_blocks[-1].strip()
        (files_dir / "requirements.txt").write_text(req, encoding="utf-8")
        print(f"  → Deps:   파일/requirements.txt")
        saved.append("requirements.txt")

    return saved


# ─── Netlify 자동 배포 ───────────────────────────────────────────────────────

def deploy_to_netlify(html_file: Path, project_name: str) -> str | None:
    """
    NETLIFY_TOKEN 환경변수가 있으면 Netlify에 자동 배포 후 공유 URL을 반환.
    토큰 발급: https://app.netlify.com/user/applications → Personal access tokens
    """
    token = os.environ.get("NETLIFY_TOKEN")
    if not token:
        return None

    print("\n  🚀 Netlify 배포 중 ", end="", flush=True)

    # HTML 파일을 index.html 이름으로 ZIP 압축
    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(html_file, "index.html")
    zip_buf.seek(0)
    zip_data = zip_buf.read()

    # Netlify Sites API로 새 사이트 생성 & 배포
    req = urllib.request.Request(
        "https://api.netlify.com/api/v1/sites",
        data=zip_data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/zip",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            site = json.loads(resp.read().decode())
            url  = site.get("ssl_url") or site.get("url", "")
            print(f"완료 ✓")
            return url
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if "401" in str(e.code):
            print(f"\n  [배포 오류] NETLIFY_TOKEN이 유효하지 않습니다.")
        else:
            print(f"\n  [배포 오류] {e.code} — {body[:120]}")
        return None
    except Exception as e:
        print(f"\n  [배포 오류] {e}")
        return None


# ─── 폴더 넘버링 ─────────────────────────────────────────────────────────────

def next_numbered_dir(base: Path, name: str) -> Path:
    base.mkdir(parents=True, exist_ok=True)
    existing = [d for d in base.iterdir() if d.is_dir() and d.name[:2].isdigit()]
    numbers  = [int(d.name[:2]) for d in existing] if existing else [0]
    next_num = max(numbers) + 1
    safe     = name.replace("/", "_").replace(" ", "_")[:30]
    return base / f"{next_num:02d}_{safe}"


# ─── 메인 ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="프로그램 개발 에이전트")
    parser.add_argument("--input", "-i", type=str, help="요구사항 텍스트 파일")
    parser.add_argument("--dir",   "-d", type=str, help="전략기획 결과물 폴더 경로")
    args = parser.parse_args()

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("\n  [오류] ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.")
        print("  export ANTHROPIC_API_KEY='sk-ant-...'")
        sys.exit(1)

    client = anthropic.Anthropic()

    # ── 요구사항 수집 ─────────────────────────────────────────────────────────
    if args.dir:
        print(f"\n  전략기획 결과물 로드: {args.dir}")
        brief_text, project_name = load_from_strategy_dir(args.dir)
        brief_text = f"[전략기획 결과물 기반]\n프로젝트명: {project_name}\n\n{brief_text[:5000]}"
        prog_types = ["웹앱"]
        print(f"  프로젝트명: {project_name}  /  기본 유형: 웹앱")
        override = input("  프로그램 유형 변경 (그대로면 Enter): ").strip()
        if override and override in PROGRAM_TYPES:
            prog_types = [override]
    elif args.input:
        print(f"\n  파일 로드: {args.input}")
        brief_text, project_name = load_from_file(args.input)
        raw = input("  프로그램 유형: ").strip()
        prog_types = [t.strip() for t in raw.split(",") if t.strip() in PROGRAM_TYPES] or ["기타"]
    else:
        data        = collect_program_brief()
        brief_text  = format_brief(data)
        project_name = data.get("project", "프로그램")
        prog_types  = data.get("types", ["기타"])

    # ── 폴더 생성 ─────────────────────────────────────────────────────────────
    # 구조: 결과물/프로젝트명/01_유형/
    safe_name   = project_name.replace("/", "_").replace(" ", "_")[:30]
    project_dir = OUTPUT_BASE / safe_name
    type_label  = "_".join(prog_types[:2])
    output_dir  = next_numbered_dir(project_dir, type_label)
    output_dir.mkdir(parents=True, exist_ok=True)

    print()
    print("─" * 65)
    print(f"  개발 시작: {project_name}  /  {', '.join(prog_types)}")
    print(f"  결과물:   {output_dir}")
    print("─" * 65)

    results     = {}
    saved_files = []
    deploy_url  = None

    try:
        # 1단계: 기획
        results["planning"] = run_stage(
            client,
            "[1/4] 요구사항 분석 & 기획",
            prompt_planning(brief_text, prog_types),
        )
        save_file(results["planning"], "1_기획서.md", output_dir)

        # 2단계: UI/UX 설계
        results["uiux"] = run_stage(
            client,
            "[2/4] UI/UX 설계",
            prompt_uiux(brief_text, results["planning"]),
        )
        save_file(results["uiux"], "2_UIUX_설계서.md", output_dir)

        # 3단계: 코드 개발 (max_tokens 크게)
        results["code"] = run_stage(
            client,
            "[3/4] 코드 개발",
            prompt_code(brief_text, results["planning"], results["uiux"], prog_types),
            max_tokens=32000,
        )
        save_file(results["code"], "3_코드_산출물.md", output_dir)

        # 코드 블록 추출 → 실행 파일 저장
        safe_project = project_name.replace(" ", "_")[:20]
        saved_files  = extract_and_save_code(results["code"], output_dir, safe_project)

        # Netlify 자동 배포 (NETLIFY_TOKEN 있으면 실행)
        files_dir  = output_dir / "파일"
        html_files = list(files_dir.glob("*.html"))
        if html_files:
            deploy_url = deploy_to_netlify(html_files[0], project_name)
            if deploy_url:
                # 공유 URL을 파일로 저장
                (output_dir / "공유URL.txt").write_text(
                    f"공유 URL: {deploy_url}\n\n"
                    f"이 URL을 공유하면 누구나 설치·로그인 없이 바로 사용할 수 있습니다.\n",
                    encoding="utf-8",
                )

        # 4단계: README
        results["readme"] = run_stage(
            client,
            "[4/4] README & 사용 가이드",
            prompt_readme(brief_text, results["planning"], prog_types),
            max_tokens=4000,
        )
        save_file(results["readme"], "README.md", output_dir)

    except anthropic.AuthenticationError:
        print("\n  [오류] API 키가 유효하지 않습니다.")
        sys.exit(1)
    except anthropic.RateLimitError:
        print("\n  [오류] API 요청 한도 초과. 잠시 후 재시도하세요.")
        sys.exit(1)
    except KeyboardInterrupt:
        print(f"\n\n  [중단] 지금까지 생성된 파일: {output_dir}")
        sys.exit(0)

    # ── 완료 메시지 ───────────────────────────────────────────────────────────
    total_chars = sum(len(v) for v in results.values())

    print()
    print("=" * 65)
    print(f"  개발 완료! ─ {project_name}")
    print("=" * 65)
    print()
    print(f"  📁 {output_dir}")
    print()
    print("  생성된 산출물:")
    print("    ├─ 1_기획서.md        ← 기능 목록 · 기술 스택 · UX 원칙")
    print("    ├─ 2_UIUX_설계서.md   ← 와이어프레임 · 컴포넌트 스펙")
    print("    ├─ 3_코드_산출물.md    ← 전체 코드 + 설명")
    print("    ├─ README.md          ← 사용 가이드")
    print("    └─ 파일/              ← 즉시 실행 가능한 HTML 파일")
    if saved_files:
        for f in saved_files:
            print(f"         └─ {f}")
    print()

    # 공유 방법 안내
    if deploy_url:
        print("  ─" * 32)
        print(f"  🔗 공유 URL (누구나 바로 접속 가능):")
        print(f"     {deploy_url}")
        print("  ─" * 32)
    else:
        html_files_final = list((output_dir / "파일").glob("*.html"))
        if html_files_final:
            print("  🔗 공유하는 방법 (택 1):")
            print()
            print("  [방법 1] Netlify Drop — 30초 만에 URL 생성 (추천)")
            print("    1. https://app.netlify.com/drop 접속")
            print(f"    2. 아래 파일을 드래그 앤 드롭:")
            print(f"       {html_files_final[0]}")
            print("    3. 생성된 URL 복사해서 공유")
            print()
            print("  [방법 2] NETLIFY_TOKEN 설정 → 다음 실행부터 자동 배포")
            print("    1. https://app.netlify.com/user/applications 에서 토큰 발급")
            print("    2. export NETLIFY_TOKEN='your-token'")
            print()
            print("  [방법 3] 파일 직접 전달")
            print(f"    → {html_files_final[0].name} 파일만 전송하면 수신자가 브라우저에서 열기 가능")

    print()
    print(f"  총 {total_chars:,}자 분량의 코드 및 문서가 생성되었습니다.")
    print()


if __name__ == "__main__":
    main()
