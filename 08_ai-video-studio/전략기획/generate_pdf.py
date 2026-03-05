#!/usr/bin/env python3
"""
VELA 기획서 PDF 생성 스크립트
— 전문적인 레이아웃 + 보라색 테마 + NotoSansKR 폰트
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black, Color
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, Image
)
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Circle, Polygon
from reportlab.graphics import renderPDF

# ─── 폰트 등록 (Regular + Bold 별도 파일로 weight 차이 구현) ───
FONT_REGULAR = "/tmp/noto-fonts/NotoSansKR-Regular-fs.ttf"
FONT_BOLD = "/tmp/noto-fonts/NotoSansKR-Bold-fs.ttf"
pdfmetrics.registerFont(TTFont("NotoSansKR", FONT_REGULAR))
pdfmetrics.registerFont(TTFont("NotoSansKR-Bold", FONT_BOLD))

# ─── 컬러 팔레트 ───
PRIMARY = HexColor("#7C3AED")       # 메인 보라색
PRIMARY_DARK = HexColor("#5B21B6")  # 진한 보라
PRIMARY_LIGHT = HexColor("#EDE9FE") # 연한 보라 배경
ACCENT = HexColor("#A78BFA")        # 밝은 보라
DARK_BG = HexColor("#1E1B4B")       # 표지 배경 (아주 진한 남보라)
TEXT_DARK = HexColor("#1F2937")      # 본문 텍스트
TEXT_GRAY = HexColor("#6B7280")      # 보조 텍스트
TEXT_LIGHT = HexColor("#9CA3AF")     # 연한 텍스트
BG_LIGHT = HexColor("#F9FAFB")      # 연한 회색 배경
TABLE_HEADER = HexColor("#7C3AED")  # 테이블 헤더
TABLE_ALT = HexColor("#F5F3FF")     # 테이블 교대 행
WHITE = white
BLACK = black
BORDER_GRAY = HexColor("#E5E7EB")

# ─── 페이지 설정 ───
PAGE_W, PAGE_H = A4  # 210 x 297 mm
MARGIN_LEFT = 25 * mm
MARGIN_RIGHT = 25 * mm
MARGIN_TOP = 25 * mm
MARGIN_BOTTOM = 25 * mm
CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT

# ─── 출력 경로 ───
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "VELA_기획서_v1.0.pdf")


# ═══════════════════════════════════════════════════
# 스타일 정의
# ═══════════════════════════════════════════════════

# 본문 기본
style_body = ParagraphStyle(
    "Body", fontName="NotoSansKR", fontSize=10, leading=16,
    textColor=TEXT_DARK, alignment=TA_JUSTIFY, spaceAfter=6
)

# 본문 작은 글씨
style_small = ParagraphStyle(
    "Small", fontName="NotoSansKR", fontSize=8, leading=12,
    textColor=TEXT_GRAY, alignment=TA_LEFT
)

# 섹션 타이틀 (큰)
style_h1 = ParagraphStyle(
    "H1", fontName="NotoSansKR-Bold", fontSize=22, leading=30,
    textColor=PRIMARY_DARK, spaceBefore=0, spaceAfter=12
)

# 서브섹션 타이틀
style_h2 = ParagraphStyle(
    "H2", fontName="NotoSansKR-Bold", fontSize=15, leading=22,
    textColor=PRIMARY, spaceBefore=16, spaceAfter=8
)

# 소제목
style_h3 = ParagraphStyle(
    "H3", fontName="NotoSansKR-Bold", fontSize=12, leading=18,
    textColor=TEXT_DARK, spaceBefore=12, spaceAfter=6
)

# 목차 스타일
style_toc = ParagraphStyle(
    "TOC", fontName="NotoSansKR", fontSize=12, leading=24,
    textColor=TEXT_DARK, leftIndent=10
)

style_toc_sub = ParagraphStyle(
    "TOCSub", fontName="NotoSansKR", fontSize=10, leading=20,
    textColor=TEXT_GRAY, leftIndent=30
)

# 블록 인용
style_quote = ParagraphStyle(
    "Quote", fontName="NotoSansKR", fontSize=10, leading=16,
    textColor=PRIMARY_DARK, leftIndent=15, borderPadding=8,
    spaceBefore=8, spaceAfter=8
)

# 강조 텍스트
style_highlight = ParagraphStyle(
    "Highlight", fontName="NotoSansKR-Bold", fontSize=11, leading=16,
    textColor=PRIMARY, alignment=TA_LEFT
)

# 테이블 헤더 셀
style_th = ParagraphStyle(
    "TH", fontName="NotoSansKR-Bold", fontSize=9, leading=13,
    textColor=WHITE, alignment=TA_CENTER
)

# 테이블 셀
style_td = ParagraphStyle(
    "TD", fontName="NotoSansKR", fontSize=9, leading=13,
    textColor=TEXT_DARK, alignment=TA_LEFT
)

# 테이블 셀 (가운데)
style_td_center = ParagraphStyle(
    "TDCenter", fontName="NotoSansKR", fontSize=9, leading=13,
    textColor=TEXT_DARK, alignment=TA_CENTER
)

# 코드 블록 스타일
style_code = ParagraphStyle(
    "Code", fontName="NotoSansKR", fontSize=8.5, leading=13,
    textColor=TEXT_DARK, leftIndent=10, rightIndent=10,
    spaceBefore=4, spaceAfter=4, backColor=BG_LIGHT
)

# 캡션
style_caption = ParagraphStyle(
    "Caption", fontName="NotoSansKR", fontSize=8, leading=12,
    textColor=TEXT_GRAY, alignment=TA_CENTER, spaceBefore=4, spaceAfter=12
)


# ═══════════════════════════════════════════════════
# 유틸리티 함수
# ═══════════════════════════════════════════════════

def make_table(headers, rows, col_widths=None):
    """전문적인 테이블 생성"""
    # 헤더 행 생성
    header_cells = [Paragraph(h, style_th) for h in headers]
    # 데이터 행 생성
    data = [header_cells]
    for row in rows:
        data.append([Paragraph(str(cell), style_td) for cell in row])

    if col_widths is None:
        col_widths = [CONTENT_W / len(headers)] * len(headers)

    t = Table(data, colWidths=col_widths, repeatRows=1)

    # 스타일 적용
    style_cmds = [
        # 헤더 배경 + 텍스트
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'NotoSansKR-Bold'),
        # 테두리
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ('LINEBELOW', (0, 0), (-1, 0), 1.5, PRIMARY),
        # 패딩
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        # 정렬
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        # 라운드 느낌 헤더
        ('ROUNDEDCORNERS', [4, 4, 0, 0]),
    ]
    # 교대 행 배경색
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), TABLE_ALT))

    t.setStyle(TableStyle(style_cmds))
    return t


def section_divider():
    """섹션 구분선"""
    return HRFlowable(
        width="100%", thickness=1, color=PRIMARY_LIGHT,
        spaceAfter=12, spaceBefore=8
    )


def purple_box(text, width=CONTENT_W):
    """보라색 배경 강조 박스"""
    data = [[Paragraph(text, ParagraphStyle(
        "BoxText", fontName="NotoSansKR-Bold", fontSize=11, leading=18,
        textColor=PRIMARY_DARK, alignment=TA_CENTER
    ))]]
    t = Table(data, colWidths=[width])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PRIMARY_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
    ]))
    return t


def info_card(title, value, color=PRIMARY):
    """정보 카드 (KPI 등)"""
    data = [
        [Paragraph(title, ParagraphStyle("CardTitle", fontName="NotoSansKR", fontSize=8, textColor=TEXT_GRAY, alignment=TA_CENTER))],
        [Paragraph(value, ParagraphStyle("CardValue", fontName="NotoSansKR-Bold", fontSize=16, textColor=color, alignment=TA_CENTER, spaceBefore=4))],
    ]
    t = Table(data, colWidths=[CONTENT_W / 3 - 8])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_GRAY),
    ]))
    return t


def kpi_row(cards_data):
    """KPI 카드 3개를 나란히 배치"""
    cards = [info_card(t, v) for t, v in cards_data]
    row_data = [cards]
    w = CONTENT_W / 3 - 4
    t = Table(row_data, colWidths=[w + 2, w + 2, w + 2])
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
    ]))
    return t


def flow_arrow_table(steps, colors=None):
    """플로우 화살표 다이어그램 (가로 배치)"""
    if colors is None:
        colors = [PRIMARY] * len(steps)

    cells = []
    for i, (step, color) in enumerate(zip(steps, colors)):
        cells.append(Paragraph(step, ParagraphStyle(
            f"FlowStep{i}", fontName="NotoSansKR-Bold", fontSize=8,
            textColor=WHITE, alignment=TA_CENTER, leading=12
        )))
        if i < len(steps) - 1:
            cells.append(Paragraph("→", ParagraphStyle(
                f"Arrow{i}", fontName="NotoSansKR-Bold", fontSize=14,
                textColor=PRIMARY, alignment=TA_CENTER
            )))

    n_cols = len(steps) * 2 - 1
    step_w = (CONTENT_W - 15 * (len(steps) - 1)) / len(steps)
    widths = []
    for i in range(n_cols):
        if i % 2 == 0:
            widths.append(step_w)
        else:
            widths.append(15)

    data = [cells]
    t = Table(data, colWidths=widths)

    style_cmds = [
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]
    for i in range(n_cols):
        if i % 2 == 0:
            idx = i // 2
            c = colors[idx] if idx < len(colors) else PRIMARY
            style_cmds.append(('BACKGROUND', (i, 0), (i, 0), c))
            style_cmds.append(('ROUNDEDCORNERS', [4, 4, 4, 4]))

    t.setStyle(TableStyle(style_cmds))
    return t


def vertical_flow(steps):
    """세로 플로우 다이어그램"""
    data = []
    for i, step in enumerate(steps):
        data.append([Paragraph(step, ParagraphStyle(
            f"VStep{i}", fontName="NotoSansKR", fontSize=9,
            textColor=WHITE, alignment=TA_CENTER, leading=13
        ))])
        if i < len(steps) - 1:
            data.append([Paragraph("↓", ParagraphStyle(
                f"VArrow{i}", fontName="NotoSansKR", fontSize=12,
                textColor=ACCENT, alignment=TA_CENTER
            ))])

    t = Table(data, colWidths=[CONTENT_W * 0.5])
    style_cmds = [
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]
    for i in range(len(data)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (0, i), PRIMARY))
            style_cmds.append(('TOPPADDING', (0, i), (0, i), 8))
            style_cmds.append(('BOTTOMPADDING', (0, i), (0, i), 8))
        else:
            style_cmds.append(('TOPPADDING', (0, i), (0, i), 2))
            style_cmds.append(('BOTTOMPADDING', (0, i), (0, i), 2))

    t.setStyle(TableStyle(style_cmds))
    # 가운데 정렬을 위해 outer table
    outer = Table([[t]], colWidths=[CONTENT_W])
    outer.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER')]))
    return outer


# ═══════════════════════════════════════════════════
# 페이지 템플릿 (헤더/푸터/페이지번호)
# ═══════════════════════════════════════════════════

class VelaDocTemplate(SimpleDocTemplate):
    """VELA 커스텀 문서 템플릿"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.page_count = 0
        self._is_cover = True  # 표지는 헤더/푸터 없음

    def afterPage(self):
        self.page_count += 1


def header_footer(canvas_obj, doc):
    """헤더 + 푸터 그리기"""
    canvas_obj.saveState()

    # 표지(1페이지)와 목차(2페이지)는 건너뜀
    page_num = canvas_obj.getPageNumber()
    if page_num <= 2:
        canvas_obj.restoreState()
        return

    # ─── 헤더 ───
    # 상단 보라색 라인
    canvas_obj.setStrokeColor(PRIMARY)
    canvas_obj.setLineWidth(2)
    canvas_obj.line(MARGIN_LEFT, PAGE_H - 18 * mm, PAGE_W - MARGIN_RIGHT, PAGE_H - 18 * mm)

    # 헤더 텍스트
    canvas_obj.setFont("NotoSansKR", 8)
    canvas_obj.setFillColor(TEXT_GRAY)
    canvas_obj.drawString(MARGIN_LEFT, PAGE_H - 15 * mm, "VELA — AI 영상 제작·편집 플랫폼 기획서")
    canvas_obj.drawRightString(PAGE_W - MARGIN_RIGHT, PAGE_H - 15 * mm, "v1.0  |  2026-03-05")

    # ─── 푸터 ───
    canvas_obj.setStrokeColor(BORDER_GRAY)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(MARGIN_LEFT, 18 * mm, PAGE_W - MARGIN_RIGHT, 18 * mm)

    # 페이지 번호
    display_num = page_num - 2  # 표지·목차 제외
    canvas_obj.setFont("NotoSansKR-Bold", 9)
    canvas_obj.setFillColor(PRIMARY)
    canvas_obj.drawCentredString(PAGE_W / 2, 12 * mm, str(display_num))

    # 푸터 텍스트
    canvas_obj.setFont("NotoSansKR", 7)
    canvas_obj.setFillColor(TEXT_LIGHT)
    canvas_obj.drawString(MARGIN_LEFT, 12 * mm, "CONFIDENTIAL — 내부 문서")
    canvas_obj.drawRightString(PAGE_W - MARGIN_RIGHT, 12 * mm, "Strategy Planning Agent")

    canvas_obj.restoreState()


# ═══════════════════════════════════════════════════
# 표지 페이지
# ═══════════════════════════════════════════════════

def build_cover(story):
    """표지 페이지 생성"""
    # 표지는 별도 캔버스로 그릴 예정 — Spacer로 공간 확보 (프레임 높이보다 약간 작게)
    frame_h = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM - 20
    story.append(Spacer(1, frame_h))
    story.append(PageBreak())


def draw_cover(canvas_obj, doc):
    """표지 배경 + 타이포 직접 그리기"""
    page_num = canvas_obj.getPageNumber()
    if page_num != 1:
        return

    canvas_obj.saveState()

    # 전체 배경 — 진한 남보라
    canvas_obj.setFillColor(DARK_BG)
    canvas_obj.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # 장식용 그라데이션 원 (보라색 글로우)
    for i in range(5):
        alpha = 0.03 + i * 0.01
        r = 200 - i * 30
        canvas_obj.setFillColor(Color(0.486, 0.227, 0.929, alpha))
        canvas_obj.circle(PAGE_W * 0.7, PAGE_H * 0.6, r, fill=1, stroke=0)

    # 상단 액센트 라인
    canvas_obj.setStrokeColor(PRIMARY)
    canvas_obj.setLineWidth(3)
    canvas_obj.line(MARGIN_LEFT, PAGE_H - 40 * mm, MARGIN_LEFT + 60 * mm, PAGE_H - 40 * mm)

    # 분류 태그
    canvas_obj.setFont("NotoSansKR", 10)
    canvas_obj.setFillColor(ACCENT)
    canvas_obj.drawString(MARGIN_LEFT, PAGE_H - 55 * mm, "AI VIDEO PRODUCTION PLATFORM")

    # 메인 타이틀 — VELA
    canvas_obj.setFont("NotoSansKR-Bold", 64)
    canvas_obj.setFillColor(WHITE)
    canvas_obj.drawString(MARGIN_LEFT, PAGE_H - 95 * mm, "VELA")

    # 서브 타이틀
    canvas_obj.setFont("NotoSansKR", 18)
    canvas_obj.setFillColor(Color(1, 1, 1, 0.9))
    canvas_obj.drawString(MARGIN_LEFT, PAGE_H - 115 * mm, "AI 영상 제작·편집 플랫폼 기획서")

    # 슬로건
    canvas_obj.setFont("NotoSansKR", 12)
    canvas_obj.setFillColor(ACCENT)
    canvas_obj.drawString(MARGIN_LEFT, PAGE_H - 135 * mm, '"텍스트에서 스크린으로, 생각이 영상이 되다"')

    # 하단 정보 블록
    y_info = 60 * mm
    canvas_obj.setStrokeColor(Color(1, 1, 1, 0.15))
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(MARGIN_LEFT, y_info + 20 * mm, PAGE_W - MARGIN_RIGHT, y_info + 20 * mm)

    info_items = [
        ("버전", "v1.0 (최종)"),
        ("작성일", "2026-03-05"),
        ("분류", "내부 기획 문서 (프로토타입)"),
        ("작성", "Strategy Planning Agent"),
    ]

    canvas_obj.setFont("NotoSansKR", 9)
    for i, (label, value) in enumerate(info_items):
        y = y_info + 8 * mm - i * 12
        canvas_obj.setFillColor(TEXT_LIGHT)
        canvas_obj.drawString(MARGIN_LEFT, y, label)
        canvas_obj.setFillColor(WHITE)
        canvas_obj.drawString(MARGIN_LEFT + 25 * mm, y, value)

    # 하단 장식 바
    canvas_obj.setFillColor(PRIMARY)
    canvas_obj.rect(0, 0, PAGE_W, 5 * mm, fill=1, stroke=0)

    canvas_obj.restoreState()


# ═══════════════════════════════════════════════════
# 목차 페이지
# ═══════════════════════════════════════════════════

def build_toc(story):
    """목차 페이지"""
    story.append(Paragraph("목차", style_h1))
    story.append(Spacer(1, 8))

    toc_items = [
        ("01", "Executive Summary", "3"),
        ("02", "왜 지금인가 (Why Now)", "4"),
        ("03", "VELA란 무엇인가 (What)", "5"),
        ("04", "기능 설계 (Feature Spec)", "6"),
        ("", "Phase 1 — MVP 핵심 기능", "6"),
        ("", "Phase 2 확장 기능", "8"),
        ("", "Phase 3 데스크톱 & 로컬 AI", "9"),
        ("05", "기술 아키텍처", "10"),
        ("06", "UI/UX 설계", "12"),
        ("07", "기술 스택 & 선택 근거", "13"),
        ("08", "개발 로드맵", "14"),
        ("09", "리스크 & 대응 방안", "16"),
        ("10", "비용 추정", "17"),
        ("11", "즉시 실행 액션 아이템", "18"),
    ]

    for num, title, page in toc_items:
        if num:
            # 메인 항목
            row_data = [[
                Paragraph(num, ParagraphStyle("TocNum", fontName="NotoSansKR-Bold", fontSize=12, textColor=PRIMARY)),
                Paragraph(title, ParagraphStyle("TocTitle", fontName="NotoSansKR-Bold", fontSize=12, textColor=TEXT_DARK, leading=20)),
                Paragraph(page, ParagraphStyle("TocPage", fontName="NotoSansKR", fontSize=12, textColor=TEXT_GRAY, alignment=TA_RIGHT)),
            ]]
            t = Table(row_data, colWidths=[12 * mm, CONTENT_W - 30 * mm, 18 * mm])
            t.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('LINEBELOW', (0, 0), (-1, -1), 0.5, BORDER_GRAY),
            ]))
        else:
            # 서브 항목
            row_data = [[
                Paragraph("", style_td),
                Paragraph(f"  — {title}", ParagraphStyle("TocSub", fontName="NotoSansKR", fontSize=10, textColor=TEXT_GRAY, leading=18)),
                Paragraph(page, ParagraphStyle("TocSubPage", fontName="NotoSansKR", fontSize=10, textColor=TEXT_LIGHT, alignment=TA_RIGHT)),
            ]]
            t = Table(row_data, colWidths=[12 * mm, CONTENT_W - 30 * mm, 18 * mm])
            t.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
            ]))

        story.append(t)

    story.append(PageBreak())


# ═══════════════════════════════════════════════════
# 본문 각 섹션
# ═══════════════════════════════════════════════════

def build_executive_summary(story):
    """Executive Summary (p3)"""
    story.append(Paragraph("Executive Summary", style_h1))
    story.append(section_divider())

    story.append(Paragraph(
        "이 문서는 AI 기반 영상 제작·편집 플랫폼 <b>VELA</b>의 1차 구축 기획서입니다.",
        style_body
    ))
    story.append(Spacer(1, 8))

    # KPI 카드 3개
    story.append(kpi_row([
        ("개발 기간", "4~6주"),
        ("월 운영 비용", "5~7만원"),
        ("추가 셋업 비용", "0원"),
    ]))
    story.append(Spacer(1, 16))

    # 현재 상황
    story.append(Paragraph("현재 상황", style_h2))
    story.append(Paragraph(
        "영상 콘텐츠 제작에 5개 이상의 분산된 툴이 사용되고 있습니다. "
        "AI 생성(Runway/Kling), 편집(Premiere/CapCut), 자막(Whisper 별도), BGM(Suno 별도)이 "
        "각각 다른 플랫폼에 올라가 있어 영상 1편당 반복적인 파일 변환·창 전환 비용이 발생합니다.",
        style_body
    ))
    story.append(Spacer(1, 8))

    # 비교 테이블
    story.append(Paragraph("Before → After", style_h3))
    story.append(make_table(
        ["구분", "현재", "VELA"],
        [
            ["워크플로우", "5개 툴 + 파일 변환 반복", "단일 플랫폼 원스톱"],
            ["제작 시간", "영상 1편당 2~4시간", "15~30분 목표"],
            ["비용", "도구별 월 구독료 합산", "~$38~53/월 (AI API + 인프라)"],
        ],
        col_widths=[CONTENT_W * 0.2, CONTENT_W * 0.4, CONTENT_W * 0.4]
    ))
    story.append(Spacer(1, 12))

    # 결론 박스
    story.append(purple_box(
        "Phase 1은 4~6주, 월 5~7만 원으로 영상 제작 생산성을 즉시 개선할 수 있는 투자입니다.<br/>"
        "중장기적으로 Phase 3 로컬 AI 전환 시 외부 API 비용을 점진적으로 대체할 수 있습니다."
    ))

    story.append(PageBreak())


def build_why_now(story):
    """왜 지금인가 (p4)"""
    story.append(Paragraph("왜 지금인가 (Why Now)", style_h1))
    story.append(section_divider())

    # 현상 유지의 비용
    story.append(Paragraph("현상 유지의 비용", style_h2))

    costs = [
        ("시간 비용", "AI 생성 툴 → 편집 툴 파일 이동·변환에 작업마다 10~20분 낭비. 4개 창을 오가며 집중력 전환 비용 발생."),
        ("도구 비용", "현재 구독 중인 영상 툴 비용이 분산 지출. VELA Phase 1 운영 비용 ~$53/월과 직접 비교 가능."),
        ("기회 비용", "영상 제작 장벽으로 인해 착수하지 못한 마케팅·커뮤니케이션 영상. SNS 쇼트폼 콘텐츠의 경쟁력은 발행 속도와 양에 달려 있음."),
    ]

    for title, desc in costs:
        data = [[
            Paragraph(f"<b>{title}</b>", ParagraphStyle("CostTitle", fontName="NotoSansKR-Bold", fontSize=10, textColor=PRIMARY_DARK, leading=15)),
        ], [
            Paragraph(desc, style_body),
        ]]
        t = Table(data, colWidths=[CONTENT_W - 10])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 10),
            ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ]))
        outer = Table([[t]], colWidths=[CONTENT_W])
        outer.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER')]))
        story.append(outer)
        story.append(Spacer(1, 6))

    story.append(Spacer(1, 8))

    # 기회의 창
    story.append(Paragraph("기회의 창이 열린 이유", style_h2))

    reasons = [
        ("AI 영상 API 상업적 성숙 (2024~2025)", "Runway Gen-3 Alpha, Kling AI 2.0, Stability SVD 등 외부 API 연동 가능 시점 도래"),
        ("기존 강자의 대응 지연", "Adobe, DaVinci Resolve는 AI를 '추가 기능'으로 탑재 중. AI-First 올인원 툴은 아직 파편화 상태"),
        ("글로벌 AI 영상 시장 성장", "2024년 $5.1B → 2030년 $29.1B 예상 (CAGR 34.2%)"),
        ("기존 인프라 재사용 가능", "Firebase Auth/Storage를 did-ad-manager, Pikbox에서 이미 운영 중. 인프라 셋업 비용 0"),
    ]

    for i, (title, desc) in enumerate(reasons):
        num = str(i + 1)
        row = [[
            Paragraph(num, ParagraphStyle("ReasonNum", fontName="NotoSansKR-Bold", fontSize=18, textColor=PRIMARY, alignment=TA_CENTER)),
            Paragraph(f"<b>{title}</b><br/>{desc}", ParagraphStyle("ReasonText", fontName="NotoSansKR", fontSize=10, textColor=TEXT_DARK, leading=15)),
        ]]
        t = Table(row, colWidths=[15 * mm, CONTENT_W - 15 * mm])
        t.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(t)

    story.append(PageBreak())


def build_what_is_vela(story):
    """VELA란 무엇인가 (p5)"""
    story.append(Paragraph("VELA란 무엇인가 (What)", style_h1))
    story.append(section_divider())

    # 프로젝트 정보
    story.append(make_table(
        ["구분", "내용"],
        [
            ["브랜드명", "VELA (벨라) — Video + Elevate + AI"],
            ["슬로건", '"텍스트에서 스크린으로, 생각이 영상이 되다"'],
            ["플랫폼", "웹 앱 → Electron 데스크톱 앱 (Phase 3)"],
        ],
        col_widths=[CONTENT_W * 0.25, CONTENT_W * 0.75]
    ))
    story.append(Spacer(1, 12))

    # 핵심 가치
    story.append(purple_box(
        "VELA = 텍스트 한 줄 입력 → 완성 영상까지<br/>"
        "생성 + 편집 + 자막 + BGM + 내보내기를 하나의 플랫폼에서"
    ))
    story.append(Spacer(1, 16))

    # 경쟁 포지셔닝
    story.append(Paragraph("경쟁 포지셔닝", style_h2))
    story.append(make_table(
        ["항목", "Runway", "Pika", "CapCut AI", "VELA (목표)"],
        [
            ["텍스트→영상", "O", "O", "O", "O"],
            ["이미지→영상", "O", "O", "O", "O"],
            ["타임라인 편집", "기초", "X", "O", "O (Phase 2)"],
            ["자동 자막", "X", "X", "O", "O"],
            ["BGM 자동 추천", "X", "X", "O", "O"],
            ["로컬 AI (오프라인)", "X", "X", "X", "O (Phase 3)"],
            ["내부 커스터마이징", "X", "X", "X", "O"],
            ["월 비용 (기본)", "$35+", "$28+", "$10~30", "~$38~53"],
        ],
        col_widths=[CONTENT_W * 0.22, CONTENT_W * 0.17, CONTENT_W * 0.15, CONTENT_W * 0.2, CONTENT_W * 0.26]
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        "<b>VELA의 유일한 차별점:</b> 내부 워크플로우에 완전히 맞춤 설계 + Phase 3 이후 로컬 AI로 외부 API 의존도 감소",
        style_highlight
    ))

    story.append(PageBreak())


def build_feature_spec(story):
    """기능 설계 (p6-9)"""
    story.append(Paragraph("기능 설계 (Feature Spec)", style_h1))
    story.append(section_divider())

    # ─── Phase 1 MVP ───
    story.append(Paragraph("Phase 1 — MVP 핵심 기능", style_h2))

    # A. 텍스트 → 영상
    story.append(Paragraph("A. 텍스트 → 영상 생성", style_h3))
    story.append(Paragraph("사용자 플로우", style_highlight))
    story.append(Spacer(1, 4))

    story.append(vertical_flow([
        "프롬프트 입력 + 스타일 선택",
        "AI 프롬프트 최적화 (GPT-4o)",
        "생성 요청 + 진행률 표시 (WebSocket)",
        "미리보기 → MP4 다운로드 or 편집",
    ]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("완료 기준 (DoD)", style_highlight))
    dod_items = [
        "프롬프트 입력 후 5분 이내에 영상 생성 완료",
        "생성 중 WebSocket 실시간 진행률 표시",
        "MP4 (H.264) 포맷 다운로드",
        "생성 실패 시 명확한 오류 메시지 + 재시도 기능",
        "API 폴백: Runway 실패 → Kling AI 자동 전환",
    ]
    for item in dod_items:
        story.append(Paragraph(f"  •  {item}", style_body))

    story.append(Spacer(1, 12))

    # B. 이미지 → 영상
    story.append(Paragraph("B. 이미지 → 영상 변환", style_h3))
    story.append(Paragraph(
        "드래그앤드롭 이미지 업로드 (JPG/PNG/WebP, 최대 10MB) → 모션 스타일 선택 (Zoom In/Out, Pan Left/Right, Cinematic Float) → 영상 길이 선택 (3초/5초/10초) → 생성 & 다운로드",
        style_body
    ))
    story.append(Spacer(1, 8))

    # C. AI 자동 자막
    story.append(Paragraph("C. AI 자동 자막 생성", style_h3))
    story.append(make_table(
        ["기능", "상세", "기술"],
        [
            ["음성 인식", "영상 업로드 → 자동 자막 생성", "OpenAI Whisper API"],
            ["자막 편집", "타이밍/내용 수정 가능한 에디터", "자체 UI"],
            ["내보내기", "SRT 파일 다운로드", "자체 구현"],
            ["자막 병합", "영상에 자막 하드 인코딩", "FFmpeg"],
        ],
        col_widths=[CONTENT_W * 0.2, CONTENT_W * 0.45, CONTENT_W * 0.35]
    ))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "성능 기준: 한국어 음성 정확도 88~92% (배경 소음 없는 조건, Whisper large-v3 벤치마크 WER 8~12%)",
        style_small
    ))

    story.append(Spacer(1, 8))

    # D. 내보내기
    story.append(Paragraph("D. 내보내기 (Export)", style_h3))
    story.append(make_table(
        ["옵션", "내용"],
        [
            ["포맷", "MP4 (H.264) — 범용 호환성"],
            ["해상도", "1080p / 720p"],
            ["비율", "16:9 (가로) / 9:16 (세로) / 1:1 (정방형)"],
            ["자막", "없음 / 하드 인코딩 / SRT 별도"],
            ["예상 시간", "내보내기 전 예상 렌더 시간 표시"],
        ],
        col_widths=[CONTENT_W * 0.2, CONTENT_W * 0.8]
    ))

    story.append(PageBreak())

    # ─── Phase 2 ───
    story.append(Paragraph("Phase 2 — 편집 고도화", style_h2))

    story.append(Paragraph("타임라인 에디터 (트랙 기반)", style_h3))

    # 타임라인 UI 다이어그램
    tl_data = [
        [Paragraph("<b>도구 바</b>", style_td), Paragraph("선택 / 컷 / 트랜지션 / 텍스트 / 색보정", style_td)],
        [Paragraph("<b>미리보기</b>", style_td), Paragraph("WebGL 실시간 30fps 렌더", style_td)],
        [Paragraph("<b>트랙 01 (영상)</b>", style_td), Paragraph("[클립 1] [클립 2] [클립 3]", style_td)],
        [Paragraph("<b>트랙 02 (오디오)</b>", style_td), Paragraph("[───── BGM 트랙 ─────]", style_td)],
        [Paragraph("<b>트랙 03 (자막)</b>", style_td), Paragraph("[자막1] [자막2] [자막3]", style_td)],
        [Paragraph("<b>트랙 04 (이펙트)</b>", style_td), Paragraph("[오버레이]", style_td)],
    ]
    t = Table(tl_data, colWidths=[CONTENT_W * 0.3, CONTENT_W * 0.7])
    t.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ('BACKGROUND', (0, 0), (0, -1), BG_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    # 핵심 편집 기능
    story.append(Paragraph("핵심 편집 기능", style_highlight))
    edit_features = [
        "클립 드래그앤드롭 배치, 컷/분할/병합",
        "트랜지션 효과 10종 (페이드, 크로스 디졸브, 슬라이드 등)",
        "클립 속도 조절 (0.25x ~ 4x), 볼륨 조절",
        "색보정 필터 (밝기/대비/채도/색온도)",
        "씬 감지 자동 컷 (FFmpeg scdetect)",
        "BGM 자동 추천 (영상 분위기 분석 → Suno API)",
    ]
    for f in edit_features:
        story.append(Paragraph(f"  •  {f}", style_body))

    story.append(Spacer(1, 12))

    # AI 편집 보조
    story.append(Paragraph("AI 편집 보조 도구", style_h3))
    story.append(make_table(
        ["기능", "설명", "기술"],
        [
            ["씬 감지 자동 컷", "장면 전환 자동 감지 → 클립 자동 분할", "FFmpeg scdetect"],
            ["배경 제거", "인물/사물 배경 누끼", "rembg"],
            ["BGM 추천", "영상 분위기 → 음악 매칭", "Suno API"],
            ["실시간 프리뷰", "타임라인 편집 즉시 반영", "WebGL 오프스크린 렌더"],
        ],
        col_widths=[CONTENT_W * 0.2, CONTENT_W * 0.45, CONTENT_W * 0.35]
    ))

    story.append(Spacer(1, 16))

    # ─── Phase 3 ───
    story.append(Paragraph("Phase 3 — 데스크톱 & 로컬 AI", style_h2))

    phase3_items = [
        ("Electron 래핑", "Mac .dmg / Windows .exe"),
        ("네이티브 파일 시스템 접근", "로컬 파일 직접 열기/저장"),
        ("Whisper.cpp", "자막 비용 $0"),
        ("rembg Python 서비스", "배경 제거 비용 $0"),
        ("Stable Diffusion 로컬", "이미지 생성 비용 $0"),
        ("클라우드-로컬 동기화", "작업 이어하기 + 오프라인 편집"),
    ]

    for title, desc in phase3_items:
        story.append(Paragraph(f"  •  <b>{title}</b> — {desc}", style_body))

    story.append(Spacer(1, 16))

    # Phase별 비용 절감 로드맵 요약 (빈 공간 활용)
    story.append(Paragraph("Phase별 비용 절감 로드맵", style_h3))
    story.append(make_table(
        ["Phase", "기간", "외부 API 의존도", "월 비용 전망"],
        [
            ["Phase 1 (MVP)", "4~6주", "높음 (Wan 2.1 + Kling)", "~$38~53"],
            ["Phase 2 (편집)", "8~12주", "중간 (자막·배경 로컬 전환)", "~$25~40"],
            ["Phase 3 (데스크톱)", "16~20주", "낮음 (핵심만 클라우드)", "~$10~20"],
            ["Phase 4 (플랫폼)", "이후", "최소 (선택적 클라우드)", "~$5~15"],
        ],
        col_widths=[CONTENT_W * 0.22, CONTENT_W * 0.18, CONTENT_W * 0.35, CONTENT_W * 0.25]
    ))
    story.append(Spacer(1, 8))
    story.append(purple_box(
        "Phase 3 완료 시 월 운영 비용 60~70% 절감 목표 — 외부 API 의존에서 자체 AI 인프라로 점진 전환"
    ))

    story.append(PageBreak())


def build_tech_architecture(story):
    """기술 아키텍처 (p10-11)"""
    story.append(Paragraph("기술 아키텍처", style_h1))
    story.append(section_divider())

    story.append(Paragraph("전체 시스템 구조", style_h2))

    # 아키텍처 다이어그램 — 레이어별 테이블
    layers = [
        ("클라이언트 (브라우저)", "React 18 + TypeScript + Zustand + Vite\nWebGL Canvas 렌더 레이어 + Socket.io Client", PRIMARY),
        ("백엔드 API 서버 (Cloud Run)", "Node.js + Express\nAI API 프록시 (폴백 체인) + BullMQ 작업 큐 + FFmpeg 워커", HexColor("#5B21B6")),
        ("인프라 & 스토리지", "Firebase Auth + Storage + Firestore\nUpstash Redis (서버리스)", HexColor("#7E22CE")),
        ("외부 AI API / 로컬 AI", "Runway · Kling · Stability · Whisper · Suno\nWan 2.1 (RunPod Serverless)", HexColor("#9333EA")),
    ]

    arch_data = []
    for label, desc, color in layers:
        arch_data.append([
            Paragraph(f"<b>{label}</b>", ParagraphStyle("ArchLabel", fontName="NotoSansKR-Bold", fontSize=10, textColor=WHITE, alignment=TA_CENTER, leading=14)),
        ])
        arch_data.append([
            Paragraph(desc.replace("\n", "<br/>"), ParagraphStyle("ArchDesc", fontName="NotoSansKR", fontSize=9, textColor=WHITE, alignment=TA_CENTER, leading=13)),
        ])
        if color != layers[-1][2]:
            arch_data.append([
                Paragraph("▼", ParagraphStyle("ArchArrow", fontName="NotoSansKR", fontSize=14, textColor=ACCENT, alignment=TA_CENTER)),
            ])

    t = Table(arch_data, colWidths=[CONTENT_W * 0.8])
    style_cmds = [
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]
    row_idx = 0
    for i, (_, _, color) in enumerate(layers):
        # 레이블 행
        style_cmds.append(('BACKGROUND', (0, row_idx), (0, row_idx), color))
        style_cmds.append(('TOPPADDING', (0, row_idx), (0, row_idx), 10))
        style_cmds.append(('BOTTOMPADDING', (0, row_idx), (0, row_idx), 2))
        row_idx += 1
        # 설명 행
        style_cmds.append(('BACKGROUND', (0, row_idx), (0, row_idx), color))
        style_cmds.append(('TOPPADDING', (0, row_idx), (0, row_idx), 2))
        style_cmds.append(('BOTTOMPADDING', (0, row_idx), (0, row_idx), 10))
        row_idx += 1
        # 화살표 행
        if i < len(layers) - 1:
            style_cmds.append(('TOPPADDING', (0, row_idx), (0, row_idx), 2))
            style_cmds.append(('BOTTOMPADDING', (0, row_idx), (0, row_idx), 2))
            row_idx += 1

    t.setStyle(TableStyle(style_cmds))
    # 가운데 정렬
    outer = Table([[t]], colWidths=[CONTENT_W])
    outer.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER')]))
    story.append(outer)
    story.append(Spacer(1, 16))

    # 데이터 흐름도
    story.append(Paragraph("데이터 흐름도 (텍스트→영상 핵심 루프)", style_h2))

    story.append(vertical_flow([
        "사용자: 텍스트 입력 + 스타일 선택",
        "프론트: GPT-4o로 프롬프트 최적화",
        "백엔드: BullMQ에 영상 생성 Job 등록",
        "워커: Wan 2.1 API 호출 (30초~3분)",
        "워커: Firebase Storage 업로드",
        "프론트: 영상 스트리밍 재생",
    ]))
    story.append(Spacer(1, 12))

    # 폴백 체인
    story.append(Paragraph("AI API 폴백 체인", style_h2))

    fb_data = [
        [
            Paragraph("<b>1순위</b>", ParagraphStyle("FB", fontName="NotoSansKR-Bold", fontSize=9, textColor=WHITE, alignment=TA_CENTER)),
            Paragraph("→", ParagraphStyle("FBA", fontName="NotoSansKR-Bold", fontSize=12, textColor=PRIMARY, alignment=TA_CENTER)),
            Paragraph("<b>2순위</b>", ParagraphStyle("FB2", fontName="NotoSansKR-Bold", fontSize=9, textColor=WHITE, alignment=TA_CENTER)),
            Paragraph("→", ParagraphStyle("FBA2", fontName="NotoSansKR-Bold", fontSize=12, textColor=PRIMARY, alignment=TA_CENTER)),
            Paragraph("<b>3순위</b>", ParagraphStyle("FB3", fontName="NotoSansKR-Bold", fontSize=9, textColor=WHITE, alignment=TA_CENTER)),
            Paragraph("→", ParagraphStyle("FBA3", fontName="NotoSansKR-Bold", fontSize=12, textColor=HexColor("#EF4444"), alignment=TA_CENTER)),
            Paragraph("<b>실패</b>", ParagraphStyle("FB4", fontName="NotoSansKR-Bold", fontSize=9, textColor=WHITE, alignment=TA_CENTER)),
        ],
        [
            Paragraph("Wan 2.1\n(RunPod)", ParagraphStyle("FBD", fontName="NotoSansKR", fontSize=8, textColor=WHITE, alignment=TA_CENTER, leading=11)),
            Paragraph("", style_td),
            Paragraph("Kling AI\n(비용 효율)", ParagraphStyle("FBD2", fontName="NotoSansKR", fontSize=8, textColor=WHITE, alignment=TA_CENTER, leading=11)),
            Paragraph("", style_td),
            Paragraph("Stability\n(폴백)", ParagraphStyle("FBD3", fontName="NotoSansKR", fontSize=8, textColor=WHITE, alignment=TA_CENTER, leading=11)),
            Paragraph("", style_td),
            Paragraph("오류 메시지\n+ 재시도 안내", ParagraphStyle("FBD4", fontName="NotoSansKR", fontSize=8, textColor=WHITE, alignment=TA_CENTER, leading=11)),
        ],
    ]

    cw = CONTENT_W / 10
    t = Table(fb_data, colWidths=[cw*2.2, cw*0.8, cw*2.2, cw*0.8, cw*2.2, cw*0.8, cw*2.2])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), HexColor("#16A34A")),  # 녹색
        ('BACKGROUND', (2, 0), (2, -1), HexColor("#CA8A04")),  # 노란색
        ('BACKGROUND', (4, 0), (4, -1), HexColor("#EA580C")),  # 주황색
        ('BACKGROUND', (6, 0), (6, -1), HexColor("#DC2626")),  # 빨간색
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
    ]))
    story.append(t)

    story.append(PageBreak())


def build_ui_ux(story):
    """UI/UX 설계 (p12)"""
    story.append(Paragraph("UI/UX 설계", style_h1))
    story.append(section_divider())

    story.append(Paragraph("주요 화면 구성", style_h2))

    screens = [
        ("대시보드", "빠른 시작 카드 (텍스트→영상, 이미지→영상, 영상 편집), 최근 프로젝트 목록, 사용량 통계"),
        ("영상 생성 화면", "좌측: 프롬프트 입력 + 스타일/해상도 선택 + 비용 예상\n우측: 미리보기 + 진행률 표시 + 다운로드/편집 버튼"),
        ("편집 화면 (Phase 2)", "좌측: AI 도구 패널 (자막, BGM, 배경제거, 씬분할)\n중앙: WebGL 실시간 미리보기\n하단: 타임라인 (영상/오디오/자막/이펙트 트랙)"),
    ]

    for title, desc in screens:
        data = [[
            Paragraph(f"<b>{title}</b>", ParagraphStyle("ScreenTitle", fontName="NotoSansKR-Bold", fontSize=11, textColor=PRIMARY, leading=16)),
        ], [
            Paragraph(desc.replace("\n", "<br/>"), style_body),
        ]]
        t = Table(data, colWidths=[CONTENT_W])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_LIGHT),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 4),
            ('TOPPADDING', (0, 1), (-1, 1), 6),
            ('BOTTOMPADDING', (0, 1), (-1, 1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 14),
            ('RIGHTPADDING', (0, 0), (-1, -1), 14),
            ('BOX', (0, 0), (-1, -1), 1, BORDER_GRAY),
            ('ROUNDEDCORNERS', [6, 6, 6, 6]),
        ]))
        story.append(t)
        story.append(Spacer(1, 8))

    story.append(Spacer(1, 8))

    # 사용자 핵심 플로우
    story.append(Paragraph("사용자 핵심 플로우", style_h2))
    story.append(vertical_flow([
        "대시보드 → '텍스트로 영상 만들기'",
        "프롬프트 입력 + 스타일/해상도 선택",
        "영상 생성 (진행률 40~90초)",
        "미리보기 → MP4 다운로드 or 편집",
        "편집 → 자막 + BGM + 클립 조정",
        "내보내기 → 렌더링 → 완료",
    ]))

    story.append(PageBreak())


def build_tech_stack(story):
    """기술 스택 & 선택 근거 (p13)"""
    story.append(Paragraph("기술 스택 & 선택 근거", style_h1))
    story.append(section_divider())

    # 프론트엔드
    story.append(Paragraph("프론트엔드", style_h2))
    story.append(make_table(
        ["기술", "선택 근거", "미선택 대안"],
        [
            ["React 18 + TS", "npm 주간 2천만+ DL, 타입 안전성", "Vue 3: 생태계 상대적 작음"],
            ["Zustand", "경량 8KB, 보일러플레이트 없음", "Redux: 복잡도 과다"],
            ["Vite", "HMR < 1초, ES Module 네이티브", "CRA: 느린 빌드"],
            ["WebGL (PixiJS)", "실시간 컴포지팅 60fps, GPU 가속", "Canvas 2D: 성능 한계"],
            ["TailwindCSS", "빠른 UI 구축, 디자인 토큰 일관성", "Styled-comp: 런타임 비용"],
        ],
        col_widths=[CONTENT_W * 0.25, CONTENT_W * 0.45, CONTENT_W * 0.3]
    ))
    story.append(Spacer(1, 12))

    # 백엔드
    story.append(Paragraph("백엔드", style_h2))
    story.append(make_table(
        ["기술", "선택 근거", "미선택 대안"],
        [
            ["Node.js + Express", "AI API 비동기 처리, 프론트와 언어 통일", "Python FastAPI: 언어 분리"],
            ["BullMQ + Redis", "비동기 큐, 재시도/실패 처리", "RabbitMQ: 설정 복잡"],
            ["FFmpeg", "업계 표준, 완전 오픈소스", "상용 솔루션: 비용"],
            ["Socket.io", "실시간 진행률, 양방향 통신", "SSE: 단방향 제한"],
        ],
        col_widths=[CONTENT_W * 0.25, CONTENT_W * 0.45, CONTENT_W * 0.3]
    ))
    story.append(Spacer(1, 12))

    # AI 서비스
    story.append(Paragraph("AI 서비스", style_h2))
    story.append(make_table(
        ["서비스", "용도", "선택 근거"],
        [
            ["Wan 2.1 (RunPod)", "텍스트→영상 (1순위)", "오픈소스, 자체 호스팅, API 독립"],
            ["Kling AI 2.0", "텍스트→영상 (폴백)", "비용 효율, 빠른 응답"],
            ["OpenAI Whisper", "자막/음성인식", "한국어 WER 8~12%"],
            ["GPT-4o", "프롬프트 최적화", "$2.50/1M tokens"],
            ["Suno API", "BGM 생성", "영상 분위기 맞춤"],
            ["rembg", "배경 제거", "로컬 실행, 비용 $0"],
        ],
        col_widths=[CONTENT_W * 0.25, CONTENT_W * 0.35, CONTENT_W * 0.4]
    ))
    story.append(Spacer(1, 12))

    # 인프라
    story.append(Paragraph("인프라", style_h2))
    story.append(make_table(
        ["기술", "선택 근거"],
        [
            ["Firebase Auth", "기존 운영 경험, 소셜 로그인 내장"],
            ["Firebase Storage", "기존 인프라 재사용, CDN 내장"],
            ["Firestore", "실시간 동기화, 오프라인 지원"],
            ["Cloud Run", "사용 없을 때 비용 $0, Docker 재현"],
            ["Upstash Redis", "서버리스, BullMQ 백엔드, 무료 티어"],
        ],
        col_widths=[CONTENT_W * 0.3, CONTENT_W * 0.7]
    ))

    story.append(PageBreak())


def build_roadmap(story):
    """개발 로드맵 (p14-15)"""
    story.append(Paragraph("개발 로드맵", style_h1))
    story.append(section_divider())

    # Phase 1
    story.append(Paragraph("Phase 1 — MVP (4~6주)", style_h2))

    # 전환 기준 박스
    story.append(purple_box(
        "전환 기준: MVP 3개 기능 DoD 충족 · 내부 사용자 3명 이상 주 1회 사용 · 영상 생성 성공률 85%+"
    ))
    story.append(Spacer(1, 8))

    story.append(make_table(
        ["주차", "작업 항목", "레이어"],
        [
            ["1주차", "프로젝트 셋업 (Vite+React+TS+Tailwind), Firebase 연동", "프론트"],
            ["1주차", "Express 서버, BullMQ+Redis, AI API 프록시", "백엔드"],
            ["2주차", "텍스트→영상 E2E (API + 큐 + WebSocket + UI)", "풀스택"],
            ["3주차", "이미지→영상 변환 (Stability SVD + 업로드 UI)", "풀스택"],
            ["4주차", "Whisper 자막 생성 + 편집 UI + SRT 내보내기", "풀스택"],
            ["5주차", "내보내기 기능, 프로젝트 저장/불러오기", "풀스택"],
            ["6주차", "버그 수정 + 내부 테스트 + 성능 최적화", "QA"],
        ],
        col_widths=[CONTENT_W * 0.12, CONTENT_W * 0.68, CONTENT_W * 0.2]
    ))
    story.append(Spacer(1, 16))

    # Phase 2
    story.append(Paragraph("Phase 2 — 편집 고도화 (8~12주)", style_h2))
    story.append(make_table(
        ["주차", "작업 항목"],
        [
            ["7~8주", "WebGL 타임라인 에디터 (트랙 UI, 클립 배치, 재생)"],
            ["9~10주", "씬 감지 자동 컷, 트랜지션 10종, 속도/색보정"],
            ["11주", "BGM 추천 시스템 (Suno API + 분위기 분석)"],
            ["12주", "실시간 프리뷰 최적화, 4K 내보내기"],
        ],
        col_widths=[CONTENT_W * 0.15, CONTENT_W * 0.85]
    ))
    story.append(Spacer(1, 16))

    # Phase 3
    story.append(Paragraph("Phase 3 — 데스크톱 앱 (16~20주)", style_h2))
    story.append(make_table(
        ["주차", "작업 항목"],
        [
            ["13~15주", "Electron 래핑 (로컬 파일, 자동 업데이트, 네이티브 메뉴)"],
            ["16~17주", "로컬 AI 통합 (Whisper.cpp, rembg Python)"],
            ["18~19주", "클라우드-로컬 동기화, 오프라인 편집"],
            ["20주", "패키징 (Mac .dmg / Windows .exe) + 내부 배포"],
        ],
        col_widths=[CONTENT_W * 0.15, CONTENT_W * 0.85]
    ))
    story.append(Spacer(1, 16))

    # Phase 4
    story.append(Paragraph("Phase 4 — 플랫폼화", style_h2))
    phase4 = [
        "팀 협업 (워크스페이스, 코멘트, 버전 히스토리, 권한 관리)",
        "템플릿 마켓 (크리에이터 업로드 + 수익화)",
        "영상 스타일 전이 (레퍼런스 → 내 영상 스타일 적용)",
        "API 오픈 (외부 서비스 연동)",
    ]
    for item in phase4:
        story.append(Paragraph(f"  •  {item}", style_body))

    story.append(PageBreak())


def build_risks(story):
    """리스크 & 대응 방안 (p16)"""
    story.append(Paragraph("리스크 & 대응 방안", style_h1))
    story.append(section_divider())

    # 기술 리스크
    story.append(Paragraph("기술 리스크", style_h2))
    story.append(make_table(
        ["리스크", "심각도", "대응 방안"],
        [
            ["AI API 응답 지연 (30초~5분)", "높음", "BullMQ 비동기 + WebSocket 진행률 + 예상 시간"],
            ["AI API 서비스 중단/가격 급변", "높음", "멀티 프로바이더 폴백 (Wan → Kling → Stability)"],
            ["브라우저 영상 처리 성능 한계", "중간", "경량 편집은 WebGL, 고품질은 서버 FFmpeg"],
            ["Electron 앱 용량 (200MB+)", "낮음", "로컬 AI 모델 선택적 다운로드"],
            ["WebCodecs 브라우저 호환성", "중간", "최신 Chrome/Edge 권장 + FFmpeg.wasm 폴백"],
        ],
        col_widths=[CONTENT_W * 0.35, CONTENT_W * 0.12, CONTENT_W * 0.53]
    ))
    story.append(Spacer(1, 16))

    # 비용 리스크
    story.append(Paragraph("비용 리스크 & 3중 통제", style_h2))

    controls = [
        ("1", "사용자별 일일 생성 한도", "예: 영상 5개/일"),
        ("2", "생성 전 예상 비용 고지", '"이 작업에 약 $0.35 사용됩니다"'),
        ("3", "월별 예산 캡 설정", "초과 시 자동 알림 + 생성 일시 중지"),
    ]

    for num, title, desc in controls:
        row = [[
            Paragraph(num, ParagraphStyle("CtrlNum", fontName="NotoSansKR-Bold", fontSize=20, textColor=WHITE, alignment=TA_CENTER)),
            Paragraph(f"<b>{title}</b><br/>{desc}", ParagraphStyle("CtrlText", fontName="NotoSansKR", fontSize=10, textColor=TEXT_DARK, leading=15)),
        ]]
        t = Table(row, colWidths=[12 * mm, CONTENT_W - 12 * mm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), PRIMARY),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (1, 0), (1, -1), 12),
            ('BOX', (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ]))
        story.append(t)
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 12))

    story.append(purple_box(
        "Phase 3 이후 로컬 AI 전환 시: Whisper.cpp (자막 $0) + rembg (배경제거 $0) → 장기적 외부 API 의존도 감소"
    ))

    story.append(Spacer(1, 12))

    # 저작권
    story.append(Paragraph("저작권 & 법적 이슈", style_h2))
    story.append(make_table(
        ["이슈", "대응"],
        [
            ["AI 생성 영상 저작권", "각 API 이용약관 검토, 상업 이용 가능 여부 사용자 고지"],
            ["배경음악 저작권", "AI 생성 BGM(Suno) 사용으로 저작권 이슈 최소화"],
            ["사용자 업로드 영상 저작권", "이용약관에 사용자 책임 명시"],
        ],
        col_widths=[CONTENT_W * 0.3, CONTENT_W * 0.7]
    ))

    story.append(PageBreak())


def build_cost(story):
    """비용 추정 (p17)"""
    story.append(Paragraph("비용 추정", style_h1))
    story.append(section_divider())

    # AI API 비용
    story.append(Paragraph("AI API 비용 (월 예상, 내부 프로토타입 기준)", style_h2))
    story.append(make_table(
        ["서비스", "예상 사용량/월", "단가", "월 비용"],
        [
            ["Wan 2.1 (RunPod)", "영상 100개 × 5초", "~$0.04~0.07/영상", "~$4~7"],
            ["Kling AI (폴백)", "영상 50개 × 5초", "~$0.03/초", "~$7.5"],
            ["OpenAI Whisper", "영상 30개 × 3분", "$0.006/분", "$0.54"],
            ["OpenAI GPT-4o", "프롬프트 100회", "$2.50/1M tokens", "~$1.00"],
            ["Suno API", "음악 20곡", "TBD", "TBD"],
            ["rembg (로컬)", "이미지 50장", "$0 (로컬)", "$0"],
        ],
        col_widths=[CONTENT_W * 0.25, CONTENT_W * 0.25, CONTENT_W * 0.25, CONTENT_W * 0.25]
    ))
    story.append(Spacer(1, 12))

    # 인프라 비용
    story.append(Paragraph("인프라 비용 (월 예상)", style_h2))
    story.append(make_table(
        ["항목", "구성", "월 비용"],
        [
            ["Cloud Run (백엔드)", "최소 인스턴스 0, 요청 기반", "$5~15"],
            ["Firebase Storage", "영상 20GB 저장 + 전송", "$5~10"],
            ["Upstash Redis", "서버리스, 무료 티어", "$0"],
            ["Firebase (Auth/Firestore)", "내부 소규모, 무료 티어", "$0"],
        ],
        col_widths=[CONTENT_W * 0.3, CONTENT_W * 0.45, CONTENT_W * 0.25]
    ))
    story.append(Spacer(1, 16))

    # 총 비용 요약
    story.append(Paragraph("총 월 운영 비용 (Phase 1 프로토타입)", style_h2))
    story.append(kpi_row([
        ("최소", "~$35/월\n(약 5만원)"),
        ("일반적 사용", "~$38~53/월\n(약 5~7만원)"),
        ("집중 사용", "~$85/월\n(약 12만원)"),
    ]))

    story.append(PageBreak())


def build_action_items(story):
    """즉시 실행 액션 아이템 (p18)"""
    story.append(Paragraph("즉시 실행 액션 아이템", style_h1))
    story.append(section_divider())

    story.append(make_table(
        ["우선순위", "액션", "기한", "담당"],
        [
            ["1", "팀 내 영상 제작 소요 시간 실측 (ROI 계산 기준)", "즉시", "팀장"],
            ["2", "현재 사용 중인 영상 툴 목록 + 월 구독료 합산", "즉시", "팀장"],
            ["3", "AI API 키 발급 (RunPod, OpenAI)", "1주 내", "개발"],
            ["4", "Wan 2.1 / Kling AI 최신 가격표 확인", "1주 내", "개발"],
            ["5", "개발 환경 셋업 (Vite + React + TS + Firebase)", "1주 내", "개발"],
            ["6", "텍스트→영상 API 프로토타입 (UI 없이 E2E)", "2주 내", "개발"],
        ],
        col_widths=[CONTENT_W * 0.12, CONTENT_W * 0.53, CONTENT_W * 0.15, CONTENT_W * 0.2]
    ))
    story.append(Spacer(1, 20))

    # 확인 필요 항목
    story.append(Paragraph("부록: 확인 필요 항목", style_h2))
    story.append(make_table(
        ["ID", "항목", "확인 방법"],
        [
            ["D-01", "팀 내 영상 1편 제작 평균 시간", "실측 또는 인터뷰"],
            ["D-02", "현재 사용 중인 영상 툴 + 월 구독료", "팀 내 확인"],
            ["D-03", "Kling AI 2.0 최신 가격", "klingai.com"],
            ["D-04", "Suno API 최신 가격", "suno.com"],
            ["D-05", "AI 영상 시장 규모 최신 보고서", "Grand View Research"],
            ["D-06", "Phase 전환 기준 (활성 사용자 수)", "내부 논의"],
        ],
        col_widths=[CONTENT_W * 0.1, CONTENT_W * 0.5, CONTENT_W * 0.4]
    ))

    story.append(Spacer(1, 30))

    # 마지막 서명
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceAfter=12))
    story.append(Paragraph(
        "VELA 기획서 v1.0 — 2026-03-05",
        ParagraphStyle("Footer", fontName="NotoSansKR", fontSize=9, textColor=TEXT_GRAY, alignment=TA_CENTER)
    ))
    story.append(Paragraph(
        "Strategy Planning Agent — 3종 첨삭 전체 반영 완성본",
        ParagraphStyle("Footer2", fontName="NotoSansKR", fontSize=9, textColor=TEXT_GRAY, alignment=TA_CENTER)
    ))


# ═══════════════════════════════════════════════════
# 메인 빌드
# ═══════════════════════════════════════════════════

def build_pdf():
    """PDF 전체 생성"""
    doc = VelaDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=MARGIN_LEFT,
        rightMargin=MARGIN_RIGHT,
        topMargin=MARGIN_TOP,
        bottomMargin=MARGIN_BOTTOM,
        title="VELA — AI 영상 제작·편집 플랫폼 기획서",
        author="Strategy Planning Agent",
        subject="내부 기획 문서 (프로토타입)",
    )

    story = []

    # 1. 표지
    build_cover(story)

    # 2. 목차
    build_toc(story)

    # 3~18. 본문 섹션
    build_executive_summary(story)
    build_why_now(story)
    build_what_is_vela(story)
    build_feature_spec(story)
    build_tech_architecture(story)
    build_ui_ux(story)
    build_tech_stack(story)
    build_roadmap(story)
    build_risks(story)
    build_cost(story)
    build_action_items(story)

    # 빌드 — 표지 그리기 + 헤더/푸터
    def on_page(canvas_obj, doc):
        draw_cover(canvas_obj, doc)
        header_footer(canvas_obj, doc)

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"PDF 생성 완료: {OUTPUT_PATH}")
    print(f"총 페이지: {doc.page_count}페이지")


if __name__ == "__main__":
    build_pdf()
