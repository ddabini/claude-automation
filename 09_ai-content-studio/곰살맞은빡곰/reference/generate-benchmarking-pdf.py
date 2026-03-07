#!/usr/bin/env python3
"""
김햄찌 벤치마킹 분석 보고서 PDF 생성 스크립트
Pretendard 폰트 + reportlab 사용
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# --- 폰트 등록 (TTF만 지원 — OTF PostScript outline 미지원) ---
FONT_DIR = os.path.expanduser("~/Library/Fonts")
pdfmetrics.registerFont(TTFont("Pretendard", f"{FONT_DIR}/NanumBarunGothic.ttf"))
pdfmetrics.registerFont(TTFont("Pretendard-Bold", f"{FONT_DIR}/NanumBarunGothicBold.ttf"))
pdfmetrics.registerFont(TTFont("Pretendard-SemiBold", f"{FONT_DIR}/NanumBarunGothicBold.ttf"))

# --- 색상 팔레트 ---
PRIMARY = HexColor("#1a1a2e")      # 진한 네이비
ACCENT = HexColor("#e94560")       # 레드 액센트
ACCENT2 = HexColor("#0f3460")      # 블루
BG_LIGHT = HexColor("#f8f9fa")     # 라이트 그레이 배경
BG_TABLE_HEADER = HexColor("#1a1a2e")
TEXT_DARK = HexColor("#212529")
TEXT_GRAY = HexColor("#6c757d")
BORDER = HexColor("#dee2e6")
SUCCESS = HexColor("#198754")
WARNING = HexColor("#fd7e14")

# --- 스타일 정의 ---
styles = {
    "cover_title": ParagraphStyle(
        "cover_title", fontName="Pretendard-Bold", fontSize=28,
        leading=36, textColor=white, alignment=TA_LEFT,
    ),
    "cover_subtitle": ParagraphStyle(
        "cover_subtitle", fontName="Pretendard", fontSize=14,
        leading=20, textColor=HexColor("#cccccc"), alignment=TA_LEFT,
    ),
    "cover_date": ParagraphStyle(
        "cover_date", fontName="Pretendard", fontSize=11,
        leading=16, textColor=HexColor("#999999"), alignment=TA_LEFT,
    ),
    "h1": ParagraphStyle(
        "h1", fontName="Pretendard-Bold", fontSize=20,
        leading=28, textColor=PRIMARY, spaceBefore=24, spaceAfter=12,
    ),
    "h2": ParagraphStyle(
        "h2", fontName="Pretendard-Bold", fontSize=15,
        leading=22, textColor=ACCENT2, spaceBefore=18, spaceAfter=8,
    ),
    "h3": ParagraphStyle(
        "h3", fontName="Pretendard-SemiBold", fontSize=12,
        leading=18, textColor=TEXT_DARK, spaceBefore=12, spaceAfter=6,
    ),
    "body": ParagraphStyle(
        "body", fontName="Pretendard", fontSize=10,
        leading=16, textColor=TEXT_DARK, spaceAfter=4,
    ),
    "body_bold": ParagraphStyle(
        "body_bold", fontName="Pretendard-Bold", fontSize=10,
        leading=16, textColor=TEXT_DARK, spaceAfter=4,
    ),
    "bullet": ParagraphStyle(
        "bullet", fontName="Pretendard", fontSize=10,
        leading=16, textColor=TEXT_DARK, leftIndent=16, spaceAfter=3,
        bulletIndent=4, bulletFontSize=10,
    ),
    "quote": ParagraphStyle(
        "quote", fontName="Pretendard-SemiBold", fontSize=10,
        leading=16, textColor=ACCENT2, leftIndent=16, spaceAfter=4,
        borderPadding=8, borderWidth=0,
    ),
    "code": ParagraphStyle(
        "code", fontName="Pretendard", fontSize=9,
        leading=14, textColor=TEXT_DARK, leftIndent=12,
        spaceAfter=2, backColor=BG_LIGHT,
    ),
    "caption": ParagraphStyle(
        "caption", fontName="Pretendard", fontSize=8,
        leading=12, textColor=TEXT_GRAY, alignment=TA_RIGHT,
    ),
    "footer": ParagraphStyle(
        "footer", fontName="Pretendard", fontSize=8,
        leading=12, textColor=TEXT_GRAY, alignment=TA_CENTER,
    ),
}

# --- 테이블 헬퍼 ---
def make_table(headers, rows, col_widths=None):
    """테이블 생성 헬퍼"""
    header_style = ParagraphStyle(
        "th", fontName="Pretendard-Bold", fontSize=9,
        leading=13, textColor=white, alignment=TA_CENTER,
    )
    cell_style = ParagraphStyle(
        "td", fontName="Pretendard", fontSize=9,
        leading=13, textColor=TEXT_DARK, alignment=TA_LEFT,
    )
    cell_center = ParagraphStyle(
        "td_center", fontName="Pretendard", fontSize=9,
        leading=13, textColor=TEXT_DARK, alignment=TA_CENTER,
    )

    data = [[Paragraph(h, header_style) for h in headers]]
    for row in rows:
        cells = []
        for i, cell in enumerate(row):
            # 숫자/퍼센트 열은 가운데 정렬
            s = cell_center if (len(row) > 2 and i >= len(row) - 2) else cell_style
            cells.append(Paragraph(str(cell), s))
        data.append(cells)

    w = col_widths or [None] * len(headers)
    t = Table(data, colWidths=w, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BG_TABLE_HEADER),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Pretendard-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BACKGROUND", (0, 1), (-1, -1), white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, BG_LIGHT]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
    ]))
    return t

def make_highlight_box(text, bg_color=BG_LIGHT, text_color=TEXT_DARK):
    """강조 박스"""
    box_style = ParagraphStyle(
        "box", fontName="Pretendard-SemiBold", fontSize=10,
        leading=16, textColor=text_color, backColor=bg_color,
        borderPadding=(10, 10, 10, 10), spaceAfter=8,
    )
    return Paragraph(text, box_style)

# --- 페이지 템플릿 ---
def cover_page(canvas, doc):
    """표지 배경"""
    canvas.saveState()
    w, h = A4
    # 배경 그라데이션 (진한 네이비)
    canvas.setFillColor(PRIMARY)
    canvas.rect(0, 0, w, h, fill=True)
    # 액센트 바
    canvas.setFillColor(ACCENT)
    canvas.rect(0, h * 0.42, w, 4, fill=True)
    # 하단 장식
    canvas.setFillColor(HexColor("#16213e"))
    canvas.rect(0, 0, w, h * 0.15, fill=True)
    canvas.restoreState()

def normal_page(canvas, doc):
    """일반 페이지 헤더/푸터"""
    canvas.saveState()
    w, h = A4
    # 상단 바
    canvas.setFillColor(PRIMARY)
    canvas.rect(0, h - 12 * mm, w, 12 * mm, fill=True)
    canvas.setFillColor(ACCENT)
    canvas.rect(0, h - 12 * mm, w, 1, fill=True)
    # 헤더 텍스트
    canvas.setFont("Pretendard-Bold", 8)
    canvas.setFillColor(white)
    canvas.drawString(20 * mm, h - 9 * mm, "Benchmarking Report")
    canvas.drawRightString(w - 20 * mm, h - 9 * mm, "vs")
    # 페이지 번호
    canvas.setFont("Pretendard", 8)
    canvas.setFillColor(TEXT_GRAY)
    canvas.drawCentredString(w / 2, 10 * mm, f"- {doc.page} -")
    canvas.restoreState()

# --- 보고서 콘텐츠 빌드 ---
def build_report():
    output_path = os.path.expanduser(
        "~/Library/Mobile Documents/com~apple~CloudDocs/"
        "클로드/09_ai-content-studio/곰살맞은빡곰/reference/"
        "benchmarking-김햄찌-analysis.pdf"
    )

    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=20 * mm, bottomMargin=20 * mm,
    )

    story = []
    W = A4[0] - 40 * mm  # 본문 영역 너비

    # ========== 표지 ==========
    story.append(Spacer(1, 120))
    story.append(Paragraph("BENCHMARKING<br/>ANALYSIS", styles["cover_title"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "vs",
        styles["cover_subtitle"]
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "YouTube AI Shorts",
        ParagraphStyle("cs2", fontName="Pretendard-Bold", fontSize=18,
                       leading=24, textColor=ACCENT)
    ))
    story.append(Spacer(1, 40))
    story.append(Paragraph("2026.03.07", styles["cover_date"]))
    story.append(Paragraph("AI Content Studio", styles["cover_date"]))
    story.append(PageBreak())

    # ========== 1. 채널 개요 ==========
    story.append(Paragraph("1. 채널 개요", styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=12))

    story.append(make_table(
        ["항목", "내용"],
        [
            ["채널명", "정서불안 김햄찌 (@정서불안김햄찌)"],
            ["구독자", "69.2만명 (YouTube 인증 채널)"],
            ["총 영상 수", "156개"],
            ["콘셉트", "정서불안 햄스터의 도파민 터지는 일상"],
            ["캐릭터", "포토리얼리스틱 햄스터 (직장인 설정)"],
            ["팬덤 호칭", "해씨들"],
            ["비즈니스", "네이버 스마트스토어 굿즈 + 포토이즘 콜라보"],
        ],
        col_widths=[W * 0.25, W * 0.75],
    ))
    story.append(Spacer(1, 12))

    # ========== 2. AI 도구 분석 ==========
    story.append(Paragraph("2. AI 도구 분석 (핵심)", styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=12))

    story.append(Paragraph("현재 도구 조합 (2026년 2~3월)", styles["h2"]))
    story.append(make_highlight_box(
        "영상: Sora / Kling / Nano Banana / Higglesfield<br/>"
        "음향: Capcut sound / suno / eleven labs<br/>"
        "편집: Capcut",
        bg_color=HexColor("#e8f4f8"), text_color=ACCENT2,
    ))

    story.append(Paragraph("이전 도구 조합 (2025년 12월)", styles["h2"]))
    story.append(make_highlight_box(
        "영상: Sora / HiLuo Premium / Kling / Nano Banana<br/>"
        "음향: Capcut sound / suno<br/>"
        "편집: Capcut",
        bg_color=HexColor("#fff3e0"), text_color=WARNING,
    ))

    story.append(Paragraph("도구 변화 핵심 포인트", styles["h2"]))
    story.append(make_table(
        ["변화", "설명"],
        [
            ["HiLuo Premium 탈락", "최신 영상에서 Hailuo 완전 제거"],
            ["Higglesfield 추가", "Hailuo를 대체하는 새로운 I2V 도구"],
            ["eleven labs 추가", "TTS/보이스 생성 도구 추가 (캐릭터 음성)"],
            ["Sora 유지", "계속 핵심 도구로 사용 중"],
            ["Kling 유지", "중국산 I2V 도구, 꾸준히 사용"],
            ["Nano Banana 유지", "이미지 생성 도구로 계속 사용"],
        ],
        col_widths=[W * 0.3, W * 0.7],
    ))
    story.append(Spacer(1, 8))

    story.append(Paragraph("멀티소싱 전략", styles["h2"]))
    for b in [
        "한 도구에 의존하지 않음 — 4개 이상의 AI 영상 도구를 동시에 사용",
        "같은 시작 이미지를 각 도구에 넣고, 가장 좋은 결과물을 선별",
        "도구를 지속적으로 교체/테스트하며 최적 조합을 찾아감",
        "이것이 일관된 고품질의 비결: 양산 후 선별",
    ]:
        story.append(Paragraph(f"  {b}", styles["bullet"]))

    story.append(PageBreak())

    # ========== 3. Shorts 성과 분석 ==========
    story.append(Paragraph("3. Shorts 성과 분석", styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=12))

    story.append(Paragraph("조회수 분포 (최신 44개 Shorts)", styles["h2"]))
    story.append(make_table(
        ["조회수 구간", "영상 수", "비율"],
        [
            ["300만+", "8개", "18%"],
            ["200~300만", "18개", "41%"],
            ["100~200만", "15개", "34%"],
            ["100만 미만", "3개", "7%"],
        ],
        col_widths=[W * 0.4, W * 0.3, W * 0.3],
    ))
    story.append(Spacer(1, 6))
    story.append(make_highlight_box(
        "평균 조회수: ~230만회 | 최고: 441만회 (선택적 만성피로) | 최저: 90만회 (대박 기원)",
        bg_color=HexColor("#e8f5e9"), text_color=SUCCESS,
    ))

    story.append(Paragraph("TOP 10 Shorts", styles["h2"]))
    story.append(make_table(
        ["순위", "제목", "조회수"],
        [
            ["1", "선택적 만성피로", "441만"],
            ["2", "제철음식", "384만"],
            ["3", "보편적인 기대감", "344만"],
            ["4", "폼생폼사", "343만"],
            ["5", "조삼모사", "336만"],
            ["6", "저항할수업따!", "335만"],
            ["7", "그렇게 햄꼰이 된다", "332만"],
            ["8", "도끼는 믿는게 아니다", "325만"],
            ["9", "직장인의 언어영역", "313만"],
            ["10", "칠전팔큐", "300만"],
        ],
        col_widths=[W * 0.12, W * 0.58, W * 0.3],
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("풀버전 동영상", styles["h2"]))
    story.append(make_table(
        ["제목", "길이", "조회수"],
        [
            ["햄스터가 말아주는 애정템 브이로그", "1:04", "6.4만"],
            ["잔혹한 당신, PT쌤", "1:01", "19만"],
            ["사사롭게 빡치는 것", "1:10", "28만"],
            ["깊은 사랑의 맛", "0:44", "25만"],
            ["가만히 있으면 절반은 가는 걸", "1:08", "25만"],
            ["찐찐찐...막", "0:55", "29만"],
        ],
        col_widths=[W * 0.55, W * 0.15, W * 0.3],
    ))

    story.append(PageBreak())

    # ========== 4. 콘텐츠 전략 분석 ==========
    story.append(Paragraph("4. 콘텐츠 전략 분석", styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=12))

    story.append(Paragraph("제목 패턴", styles["h2"]))
    for b in [
        "4글자 사자성어/신조어: 조삼모사, 자강두찐, 칠전팔큐, 폼생폼사",
        "직장인 키워드: 직장인이여~, 업무의 일환, 직장인의 언어영역",
        "공감형 문장: 한 번씩은 겪어본 것, 의외로 많은 소비형태",
        "짧고 임팩트 있는 2~6글자가 대부분",
    ]:
        story.append(Paragraph(f"  {b}", styles["bullet"]))

    story.append(Paragraph("콘텐츠 주제 분류", styles["h2"]))
    story.append(make_table(
        ["주제", "예시"],
        [
            ["직장 생활", "출퇴근, 회의, 개발자 소통, PT, 야근"],
            ["일상 공감", "만성피로, 음식, 소비, 연말"],
            ["인간관계", "동료, 점심 메이트, 선후배"],
            ["자기계발 패러디", "미라클 모닝, 마음다짐, 주의력"],
        ],
        col_widths=[W * 0.25, W * 0.75],
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("업로드 패턴 및 영상 구조", styles["h2"]))
    for b in [
        "Shorts: 주 2~3회 / 풀버전: 주 1~2회 / 커뮤니티: 주 1~2회",
        "Shorts + 풀버전 이중 업로드 전략 (같은 소재를 티저 + 풀버전 분할)",
        "풀버전 길이: 44초 ~ 1분 10초 (1분 내외)",
        "자막이 핵심 — 햄스터가 직접 대사를 하는 형태",
        "시리즈 묶기: '현대인들이 자주 겪는 기이현상' 등",
        "워터마크 없음 (유료 플랜 사용)",
    ]:
        story.append(Paragraph(f"  {b}", styles["bullet"]))

    story.append(PageBreak())

    # ========== 5. 캐릭터 일관성 비결 ==========
    story.append(Paragraph("5. 캐릭터 일관성 비결", styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=12))

    story.append(Paragraph("왜 김햄찌 햄스터는 항상 같아 보이는가?", styles["h2"]))
    consistency_items = [
        ("Nano Banana로 시작 이미지 생성",
         "같은 캐릭터 reference를 일관되게 사용하여 이미지 단계에서 외형 고정"),
        ("멀티 도구 양산 후 선별",
         "같은 시작 이미지를 Sora, Kling, Higglesfield에 동시 투입 → 캐릭터가 가장 일관된 결과만 선택 (장면당 3~4회 생성)"),
        ("유료 플랜의 품질 차이",
         "Sora(유료), Kling(유료 추정) → 고해상도 + 워터마크 없음 + 더 나은 모션 품질"),
        ("편집으로 마무리",
         "CapCut에서 여러 도구의 클립을 조합. 한 영상 = 여러 도구에서 생성된 best pick 클립의 조합"),
    ]
    for i, (title, desc) in enumerate(consistency_items, 1):
        story.append(Paragraph(f"<b>{i}. {title}</b>", styles["body_bold"]))
        story.append(Paragraph(f"    {desc}", styles["bullet"]))
        story.append(Spacer(1, 4))

    story.append(Paragraph("모션 자연스러움의 비결", styles["h2"]))
    for b in [
        "여러 도구에서 생성 후 자연스러운 것만 선별 (슬로우모션 같은 부자연스러운 결과는 버림)",
        "짧은 클립 단위 편집 (6초 클립에서 필요한 2~3초만 사용)",
        "Sora의 모션 품질이 현재 가장 우수 (Hailuo보다 자연스러움)",
    ]:
        story.append(Paragraph(f"  {b}", styles["bullet"]))

    # ========== 6. 음향 전략 ==========
    story.append(Spacer(1, 12))
    story.append(Paragraph("6. 음향 전략", styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=12))

    story.append(make_table(
        ["도구", "용도"],
        [
            ["Capcut sound", "기본 효과음 (발걸음, 문 여닫기, 환경음 등)"],
            ["suno", "AI 배경음악 생성 (분위기별 맞춤)"],
            ["eleven labs", "캐릭터 TTS 음성 (햄스터 목소리)"],
            ["저작권 음악", "특별 영상에 사용 (Disney 등)"],
        ],
        col_widths=[W * 0.25, W * 0.75],
    ))
    story.append(Spacer(1, 8))
    story.append(make_highlight_box(
        "음향이 영상 몰입도의 50% 이상을 차지.<br/>"
        "무음 AI 영상에 효과음 + 배경음악 + TTS를 입히는 후반 작업이 핵심.",
        bg_color=HexColor("#fff8e1"), text_color=WARNING,
    ))

    story.append(PageBreak())

    # ========== 7. 빡곰 적용 인사이트 ==========
    story.append(Paragraph("7. 빡곰에 적용할 인사이트", styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=12))

    story.append(Paragraph("즉시 적용 가능", styles["h2"]))
    story.append(make_table(
        ["항목", "김햄찌 방식", "빡곰 적용"],
        [
            ["멀티 도구", "Sora+Kling+Higglesfield+NanoBanana", "Hailuo Free + Kling + Sora(향후)"],
            ["양산 후 선별", "같은 장면 4개 도구로 생성 best pick", "같은 프롬프트 3~4회 생성 선별"],
            ["짧은 클립 편집", "6초 클립에서 2~3초만 사용", "Hailuo 6초 핵심 구간만 추출"],
            ["자막 대사", "햄스터가 직접 말하는 형태", "빡곰 대사 자막 추가"],
            ["효과음", "Capcut + suno", "CapCut 효과음 + suno 배경음악"],
        ],
        col_widths=[W * 0.18, W * 0.41, W * 0.41],
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("중기 과제", styles["h2"]))
    story.append(make_table(
        ["항목", "설명"],
        [
            ["TTS 도입", "eleven labs로 빡곰 전용 목소리 만들기"],
            ["Sora 도입", "모션 품질이 가장 우수 — 유료 플랜 검토"],
            ["Higglesfield 테스트", "김햄찌가 Hailuo 대신 선택한 도구 — 테스트 필요"],
            ["시리즈화", "'사회생활 만점 빡곰' 같은 시리즈 카테고리"],
            ["풀버전+Shorts", "1분 풀버전 + Shorts 티저 이중 업로드"],
        ],
        col_widths=[W * 0.3, W * 0.7],
    ))

    story.append(Spacer(1, 10))
    story.append(Paragraph("현재 한계 비교: 김햄찌 vs 빡곰", styles["h2"]))
    story.append(make_table(
        ["항목", "김햄찌", "빡곰 (현재)"],
        [
            ["영상 도구", "유료 4개", "무료 1개 (Hailuo Free)"],
            ["이미지 도구", "Nano Banana", "MCP Gemini + Nano Banana"],
            ["음향", "Capcut + suno + eleven labs", "없음 (미적용)"],
            ["편집", "CapCut", "미적용"],
            ["워터마크", "없음 (유료)", "있음 (무료)"],
            ["양산량", "장면당 4+ 후보", "장면당 1~2 후보"],
        ],
        col_widths=[W * 0.2, W * 0.4, W * 0.4],
    ))

    # 핵심 결론 박스
    story.append(Spacer(1, 16))
    story.append(make_highlight_box(
        "<b>핵심 결론</b><br/><br/>"
        "김햄찌의 품질 비결은 단일 도구의 성능이 아니라,<br/>"
        "<b>멀티 도구 양산 후 선별 + 편집 + 음향</b>의 3단 프로세스.<br/><br/>"
        "우리가 당장 따라잡으려면:<br/>"
        "1. Hailuo에서 같은 장면 3~4회 생성 후 best pick (무료 가능)<br/>"
        "2. CapCut에서 편집 + 효과음 추가 (무료)<br/>"
        "3. suno로 배경음악 생성 (무료 tier 있음)<br/>"
        "이 3단계만 추가해도 현재 대비 품질 대폭 향상",
        bg_color=HexColor("#fce4ec"), text_color=ACCENT,
    ))

    story.append(PageBreak())

    # ========== 8. 커뮤니티/비즈니스 모델 ==========
    story.append(Paragraph("8. 커뮤니티 / 비즈니스 모델", styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=12))

    biz_items = [
        ("커뮤니티 게시물 활발", "주 1~2회, 좋아요 6천~1.4만개, 댓글 200~500개"),
        ("팬 호칭 사용", "'해씨들' → 빡곰도 고유 팬 호칭 필요"),
        ("굿즈 판매", "시즌그리팅, 노트 → 캐릭터 IP 수익화"),
        ("콜라보", "포토이즘 프레임 → 오프라인 접점 확대"),
        ("1인칭 말투", "햄스터가 직접 팬에게 말하는 톤 ('해씨들~!')"),
    ]
    for title, desc in biz_items:
        story.append(Paragraph(f"<b>{title}</b>", styles["body_bold"]))
        story.append(Paragraph(f"    {desc}", styles["bullet"]))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="40%", thickness=0.5, color=TEXT_GRAY, spaceAfter=8))
    story.append(Paragraph(
        "AI Content Studio | Benchmarking Report | 2026.03.07",
        styles["footer"]
    ))

    # --- 빌드 ---
    doc.build(
        story,
        onFirstPage=cover_page,
        onLaterPages=normal_page,
    )
    print(f"PDF 생성 완료: {output_path}")
    return output_path


if __name__ == "__main__":
    build_report()
