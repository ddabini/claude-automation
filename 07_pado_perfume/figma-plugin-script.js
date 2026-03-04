/*
  PADO 카드뉴스 — Figma Plugin API 콘솔 스크립트
  ================================================
  Figma에서 ⌥⌘I (Dev Console) → 이 스크립트 전체 붙여넣기 → Enter

  3장의 카드뉴스를 편집 가능한 레이어 구조로 생성합니다.
  - 텍스트: 더블클릭으로 직접 수정 가능
  - 도형/데코: 드래그로 위치/사이즈 조정 가능
  - 배경: 별도 레이어로 분리 (잠금 가능)

  카드 크기: 1080×1350px (세로형 인스타그램 표준)
*/

(async () => {
  // ===== 컬러 팔레트 (PADO 브랜드 토큰) =====
  // RGB 값은 0~1 범위 (Figma API 기준)
  const C = {
    ocean900: { r: 13/255, g: 33/255, b: 55/255 },    // #0D2137 미드나이트 네이비
    ocean800: { r: 20/255, g: 47/255, b: 74/255 },    // #142F4A 딥 블루 진한
    ocean700: { r: 27/255, g: 73/255, b: 101/255 },   // #1B4965 딥 오션 블루
    ocean400: { r: 95/255, g: 168/255, b: 211/255 },  // #5FA8D3 터쿼이즈
    sand100:  { r: 247/255, g: 245/255, b: 242/255 }, // #F7F5F2 크리스탈 화이트
    sand500:  { r: 201/255, g: 185/255, b: 154/255 }, // #C9B99A 세이지 베이지
    sand600:  { r: 184/255, g: 160/255, b: 128/255 }, // #B8A080 중간 베이지
    basalt600:{ r: 68/255, g: 68/255, b: 68/255 },    // #444444 중간 진한
    basalt700:{ r: 45/255, g: 45/255, b: 45/255 },    // #2D2D2D 현무암 블랙
    white:    { r: 1, g: 1, b: 1 },
  };

  // ===== 폰트 로드 =====
  // Figma에서 사용할 폰트를 미리 불러옴 (로드 실패 시 에러 발생)
  console.log('🔤 폰트 로드 중...');

  const fontsToLoad = [
    { family: "Noto Sans KR", style: "ExtraBold" },   // 한글 헤드라인 (Paperlogy 대체)
    { family: "Noto Sans KR", style: "Light" },        // 한글 본문 (Pretendard 대체)
    { family: "Noto Sans KR", style: "Regular" },      // 한글 기본
    { family: "Raleway", style: "ExtraLight" },         // 영문 CTA (weight 200)
    { family: "Josefin Sans", style: "Thin" },          // 영문 제품명 (weight 100)
    { family: "Josefin Sans", style: "Light" },         // 영문 서브
  ];

  // 폰트 로드 시도 — 실패한 폰트는 건너뛰고 경고 출력
  const loadedFonts = [];
  const failedFonts = [];

  for (const font of fontsToLoad) {
    try {
      await figma.loadFontAsync(font);
      loadedFonts.push(`${font.family} ${font.style}`);
    } catch (e) {
      failedFonts.push(`${font.family} ${font.style}`);
    }
  }

  console.log('✅ 로드 성공:', loadedFonts.join(', '));
  if (failedFonts.length > 0) {
    console.warn('⚠️ 로드 실패 (Inter로 대체됨):', failedFonts.join(', '));
    // 실패한 폰트가 있으면 Inter 폰트를 폴백으로 로드
    try { await figma.loadFontAsync({ family: "Inter", style: "Regular" }); } catch(e) {}
    try { await figma.loadFontAsync({ family: "Inter", style: "Bold" }); } catch(e) {}
    try { await figma.loadFontAsync({ family: "Inter", style: "Light" }); } catch(e) {}
  }

  // ===== 유틸리티 함수 =====

  // solid 색상 페인트 배열 생성
  function solid(color, opacity) {
    const paint = { type: 'SOLID', color: color };
    if (opacity !== undefined) paint.opacity = opacity;
    return [paint];
  }

  // 텍스트 노드를 생성하는 헬퍼
  function createText(opts) {
    const t = figma.createText();
    t.name = opts.name || '텍스트';

    // 폰트 설정 (로드 실패 시 Inter 폴백)
    const fontName = opts.fontName || { family: "Inter", style: "Regular" };
    try {
      t.fontName = fontName;
    } catch (e) {
      console.warn(`폰트 설정 실패 (${fontName.family} ${fontName.style}), Inter 사용`);
      t.fontName = { family: "Inter", style: "Regular" };
    }

    t.characters = opts.text || '';
    t.fontSize = opts.fontSize || 24;
    t.fills = opts.fills || solid(C.white);

    if (opts.letterSpacing !== undefined) {
      t.letterSpacing = { value: opts.letterSpacing, unit: 'PERCENT' };
    }
    if (opts.lineHeight !== undefined) {
      t.lineHeight = { value: opts.lineHeight, unit: 'PIXELS' };
    }
    if (opts.textAlignHorizontal) {
      t.textAlignHorizontal = opts.textAlignHorizontal;
    }
    if (opts.textCase) {
      t.textCase = opts.textCase;
    }

    // 위치 설정
    t.x = opts.x || 0;
    t.y = opts.y || 0;

    // 너비 고정 (텍스트가 자동 줄바꿈되도록)
    if (opts.width) {
      t.resize(opts.width, t.height);
      t.textAutoResize = 'HEIGHT';
    }

    return t;
  }

  // 사각형 노드를 생성하는 헬퍼
  function createRect(opts) {
    const r = figma.createRectangle();
    r.name = opts.name || '사각형';
    r.resize(opts.width || 100, opts.height || 100);
    r.x = opts.x || 0;
    r.y = opts.y || 0;
    r.fills = opts.fills || [];
    if (opts.opacity !== undefined) r.opacity = opts.opacity;
    if (opts.cornerRadius) r.cornerRadius = opts.cornerRadius;
    return r;
  }

  // 수평선(데코 라인) 생성
  function createLine(opts) {
    const l = figma.createLine();
    l.name = opts.name || '라인';
    l.resize(opts.width || 100, 0);
    l.x = opts.x || 0;
    l.y = opts.y || 0;
    l.strokes = opts.strokes || solid(C.sand500);
    l.strokeWeight = opts.strokeWeight || 1;
    if (opts.opacity !== undefined) l.opacity = opts.opacity;
    return l;
  }

  // 원형 도트 생성
  function createDot(opts) {
    const e = figma.createEllipse();
    e.name = opts.name || '도트';
    e.resize(opts.size || 5, opts.size || 5);
    e.x = opts.x || 0;
    e.y = opts.y || 0;
    e.fills = opts.fills || solid(C.sand500);
    return e;
  }

  // ===== 프레임 간 간격 =====
  const CARD_W = 1080;
  const CARD_H = 1350;
  const GAP = 80; // 카드 간 간격

  // ===== 현재 뷰포트 기준 시작 위치 =====
  const startX = Math.round(figma.viewport.center.x - (CARD_W * 1.5 + GAP));
  const startY = Math.round(figma.viewport.center.y - CARD_H / 2);


  // ============================================================
  //   1장 — 브랜드 임팩트 (딥 오션 블루 배경)
  // ============================================================
  console.log('🎨 1장 생성 중...');

  const frame1 = figma.createFrame();
  frame1.name = '🌊 PADO Card 1 — 브랜드 임팩트';
  frame1.resize(CARD_W, CARD_H);
  frame1.x = startX;
  frame1.y = startY;
  frame1.fills = solid(C.ocean900); // 미드나이트 네이비 배경

  // 1장: 텍스처 오버레이 (반투명 사각형으로 질감 표현)
  const c1Texture = createRect({
    name: '텍스처 오버레이',
    width: CARD_W, height: CARD_H,
    fills: solid(C.sand500, 0.06),
    opacity: 0.12,
  });
  frame1.appendChild(c1Texture);

  // 1장: 상단 장식 — 가느다란 수평선 2개 (로고 위치 암시)
  const c1DecoLine1 = createLine({
    name: '상단 데코 라인 (긴)',
    width: 240,
    x: (CARD_W - 240) / 2, y: 260,
    strokes: solid(C.sand500),
    opacity: 0.3,
  });
  frame1.appendChild(c1DecoLine1);

  const c1DecoLine2 = createLine({
    name: '상단 데코 라인 (짧은)',
    width: 120,
    x: (CARD_W - 120) / 2, y: 272,
    strokes: solid(C.sand500),
    opacity: 0.2,
  });
  frame1.appendChild(c1DecoLine2);

  // 1장: PADO 로고 텍스트 (SVG 로고 대신 텍스트로 — 편집 가능)
  const c1Logo = createText({
    name: '📝 PADO 로고 (편집 가능)',
    text: 'PADO',
    fontName: { family: "Raleway", style: "ExtraLight" },
    fontSize: 120,
    fills: solid(C.sand100),
    letterSpacing: 50, // 자간 50%
    textAlignHorizontal: 'CENTER',
    textCase: 'UPPER',
    x: 0, y: 310,
    width: CARD_W,
  });
  frame1.appendChild(c1Logo);

  // 1장: 로고 하단 데코 라인
  const c1MidLine = createLine({
    name: '데코 라인 (로고 하단)',
    width: 120,
    x: (CARD_W - 120) / 2, y: 480,
    strokes: solid(C.sand500),
    opacity: 0.5,
  });
  frame1.appendChild(c1MidLine);

  // 1장: 파도 구분선 (물결 모양 대신 3선 데코로 표현)
  const c1Wave1 = createLine({
    name: '파도 구분선 ①',
    width: 280,
    x: (CARD_W - 280) / 2, y: 498,
    strokes: solid(C.sand500),
    opacity: 0.3,
    strokeWeight: 0.5,
  });
  frame1.appendChild(c1Wave1);

  const c1Wave2 = createLine({
    name: '파도 구분선 ②',
    width: 200,
    x: (CARD_W - 200) / 2, y: 506,
    strokes: solid(C.sand500),
    opacity: 0.2,
    strokeWeight: 0.5,
  });
  frame1.appendChild(c1Wave2);

  // 1장: 메인 한글 카피 "바다가 남긴 향기"
  const c1Headline = createText({
    name: '📝 메인 카피 — 바다가 남긴 향기',
    text: '바다가 남긴 향기',
    fontName: { family: "Noto Sans KR", style: "ExtraBold" },
    fontSize: 88,
    fills: solid(C.sand100),
    letterSpacing: -1, // 한글 자간 살짝 좁게
    lineHeight: 114, // 88px × 1.3
    textAlignHorizontal: 'CENTER',
    x: 0, y: 550,
    width: CARD_W,
  });
  frame1.appendChild(c1Headline);

  // 1장: 서브 영문 카피 "PADO — Jeju Niche Perfume"
  const c1Sub = createText({
    name: '📝 서브 카피 — PADO Jeju Niche Perfume',
    text: 'PADO — Jeju Niche Perfume',
    fontName: { family: "Josefin Sans", style: "Thin" },
    fontSize: 26,
    fills: solid(C.sand500),
    letterSpacing: 45, // 자간 45%
    textAlignHorizontal: 'CENTER',
    textCase: 'UPPER',
    x: 0, y: 680,
    width: CARD_W,
  });
  frame1.appendChild(c1Sub);

  // 1장: 하단 장식선 (카드 하단부 시각적 앵커)
  const c1BottomDeco = createLine({
    name: '하단 데코 라인',
    width: 160,
    x: (CARD_W - 160) / 2, y: 1200,
    strokes: solid(C.sand500),
    opacity: 0.2,
  });
  frame1.appendChild(c1BottomDeco);


  // ============================================================
  //   2장 — 제품 스토리 (크리스탈 화이트 배경)
  // ============================================================
  console.log('🎨 2장 생성 중...');

  const frame2 = figma.createFrame();
  frame2.name = '🧴 PADO Card 2 — 제품 스토리';
  frame2.resize(CARD_W, CARD_H);
  frame2.x = startX + CARD_W + GAP;
  frame2.y = startY;
  frame2.fills = solid(C.sand100); // 크리스탈 화이트 배경

  // 2장: 텍스처 오버레이
  const c2Texture = createRect({
    name: '텍스처 오버레이',
    width: CARD_W, height: CARD_H,
    fills: solid(C.sand500, 0.04),
    opacity: 0.08,
  });
  frame2.appendChild(c2Texture);

  // 2장: 상단 PADO 소형 로고 텍스트
  const c2Logo = createText({
    name: '📝 PADO 로고 (소형)',
    text: 'PADO',
    fontName: { family: "Raleway", style: "ExtraLight" },
    fontSize: 48,
    fills: solid(C.ocean700),
    letterSpacing: 50,
    textAlignHorizontal: 'CENTER',
    textCase: 'UPPER',
    x: 0, y: 80,
    width: CARD_W,
  });
  frame2.appendChild(c2Logo);

  // 2장: 보틀 영역 안내 사각형 (보틀 이미지 배치 가이드)
  const c2BottlePlaceholder = createRect({
    name: '🖼️ 보틀 이미지 영역 (여기에 보틀 SVG/PNG 배치)',
    width: 240, height: 480,
    x: (CARD_W - 240) / 2 + 16, y: 200,
    fills: solid(C.ocean700, 0.06),
    cornerRadius: 8,
  });
  frame2.appendChild(c2BottlePlaceholder);

  // 2장: 보틀 라벨 텍스트
  const c2BottleLabel = createText({
    name: '📝 보틀 라벨 (DAWN TIDE)',
    text: 'DAWN\nTIDE',
    fontName: { family: "Josefin Sans", style: "Thin" },
    fontSize: 28,
    fills: solid(C.ocean700, 0.15),
    letterSpacing: 30,
    textAlignHorizontal: 'CENTER',
    textCase: 'UPPER',
    x: (CARD_W - 240) / 2 + 16, y: 380,
    width: 240,
  });
  frame2.appendChild(c2BottleLabel);

  // 2장: 파도 구분선 (3선 데코)
  const c2Div1 = createLine({
    name: '파도 구분선 ①',
    width: 360,
    x: (CARD_W - 360) / 2, y: 892,
    strokes: solid(C.ocean700),
    opacity: 0.25,
    strokeWeight: 0.5,
  });
  frame2.appendChild(c2Div1);

  const c2Div2 = createLine({
    name: '파도 구분선 ②',
    width: 260,
    x: (CARD_W - 260) / 2, y: 900,
    strokes: solid(C.ocean700),
    opacity: 0.15,
    strokeWeight: 0.5,
  });
  frame2.appendChild(c2Div2);

  // 2장: 메인 스토리 카피 1줄 "새벽 파도가 머문 자리,"
  const c2Story1 = createText({
    name: '📝 스토리 카피 — 새벽 파도가 머문 자리,',
    text: '새벽 파도가 머문 자리,',
    fontName: { family: "Noto Sans KR", style: "ExtraBold" },
    fontSize: 52,
    fills: solid(C.basalt700),
    letterSpacing: -1,
    lineHeight: 81, // 52px × 1.55
    textAlignHorizontal: 'CENTER',
    x: 80, y: 940,
    width: CARD_W - 160,
  });
  frame2.appendChild(c2Story1);

  // 2장: 메인 스토리 카피 2줄 "소금기 머금은 바람의 기억"
  const c2Story2 = createText({
    name: '📝 스토리 카피 — 소금기 머금은 바람의 기억',
    text: '소금기 머금은 바람의 기억',
    fontName: { family: "Noto Sans KR", style: "ExtraBold" },
    fontSize: 52,
    fills: solid(C.basalt700),
    letterSpacing: -1,
    lineHeight: 81,
    textAlignHorizontal: 'CENTER',
    x: 80, y: 1024,
    width: CARD_W - 160,
  });
  frame2.appendChild(c2Story2);

  // 2장: 노트 설명 1줄
  const c2Note1 = createText({
    name: '📝 노트 설명 — 제주 동쪽 해안의 해조, 시트러스, 흰 모래',
    text: '제주 동쪽 해안의 해조, 시트러스, 흰 모래',
    fontName: { family: "Noto Sans KR", style: "Light" },
    fontSize: 26,
    fills: solid(C.basalt600),
    letterSpacing: 5,
    lineHeight: 52, // 26px × 2.0
    textAlignHorizontal: 'CENTER',
    x: 96, y: 1130,
    width: CARD_W - 192,
  });
  frame2.appendChild(c2Note1);

  // 2장: 노트 설명 2줄
  const c2Note2 = createText({
    name: '📝 노트 설명 — 세 가지 노트로 완성한 향',
    text: '세 가지 노트로 완성한 향',
    fontName: { family: "Noto Sans KR", style: "Light" },
    fontSize: 26,
    fills: solid(C.basalt600),
    letterSpacing: 5,
    lineHeight: 52,
    textAlignHorizontal: 'CENTER',
    x: 96, y: 1176,
    width: CARD_W - 192,
  });
  frame2.appendChild(c2Note2);

  // 2장: 노트 키워드 "해조 · 시트러스 · 흰 모래"
  const c2Keywords = createText({
    name: '📝 노트 키워드 — 해조 · 시트러스 · 흰 모래',
    text: '해조  ·  시트러스  ·  흰 모래',
    fontName: { family: "Noto Sans KR", style: "Regular" },
    fontSize: 22,
    fills: solid(C.ocean700),
    letterSpacing: 15,
    textAlignHorizontal: 'CENTER',
    x: 0, y: 1250,
    width: CARD_W,
  });
  frame2.appendChild(c2Keywords);


  // ============================================================
  //   3장 — 라인업 + CTA (세이지 베이지 배경)
  // ============================================================
  console.log('🎨 3장 생성 중...');

  const frame3 = figma.createFrame();
  frame3.name = '✨ PADO Card 3 — 라인업 + CTA';
  frame3.resize(CARD_W, CARD_H);
  frame3.x = startX + (CARD_W + GAP) * 2;
  frame3.y = startY;
  // 세이지 베이지 그라디언트 배경 (상단 화이트 → 하단 베이지)
  frame3.fills = [{
    type: 'GRADIENT_LINEAR',
    gradientTransform: [[0, 1, 0], [-1, 0, 1]], // 위→아래
    gradientStops: [
      { position: 0, color: { ...C.sand100, a: 1 } },
      { position: 1, color: { ...C.sand500, a: 1 } },
    ],
  }];

  // 3장: 텍스처 오버레이
  const c3Texture = createRect({
    name: '텍스처 오버레이',
    width: CARD_W, height: CARD_H,
    fills: solid(C.sand600, 0.04),
    opacity: 0.10,
  });
  frame3.appendChild(c3Texture);

  // 3장: 상단 PADO 소형 로고
  const c3Logo = createText({
    name: '📝 PADO 로고 (소형)',
    text: 'PADO',
    fontName: { family: "Raleway", style: "ExtraLight" },
    fontSize: 52,
    fills: solid(C.ocean700),
    letterSpacing: 50,
    textAlignHorizontal: 'CENTER',
    textCase: 'UPPER',
    x: 0, y: 72,
    width: CARD_W,
  });
  frame3.appendChild(c3Logo);

  // 3장: 로고 하단 데코 라인
  const c3DecoLine1 = createLine({
    name: '데코 라인 ① (긴)',
    width: 80,
    x: (CARD_W - 80) / 2, y: 160,
    strokes: solid(C.sand600),
    opacity: 0.5,
  });
  frame3.appendChild(c3DecoLine1);

  const c3DecoLine2 = createLine({
    name: '데코 라인 ② (짧은)',
    width: 48,
    x: (CARD_W - 48) / 2, y: 172,
    strokes: solid(C.sand600),
    opacity: 0.3,
  });
  frame3.appendChild(c3DecoLine2);

  // ===== 3장 제품 라인업 — DAWN TIDE =====
  const prodStartY = 220;
  const prodHeight = 220; // 제품 항목 높이
  const prodGap = 16;     // 구분선 영역 높이

  // DAWN TIDE 보틀 자리
  const c3Bottle1 = createRect({
    name: '🖼️ DAWN TIDE 보틀 (여기에 이미지 배치)',
    width: 80, height: 180,
    x: 100, y: prodStartY + 20,
    fills: solid(C.ocean700, 0.08),
    cornerRadius: 4,
  });
  frame3.appendChild(c3Bottle1);

  // DAWN TIDE 제품명
  const c3Name1 = createText({
    name: '📝 제품명 — Dawn Tide',
    text: 'DAWN TIDE',
    fontName: { family: "Josefin Sans", style: "Thin" },
    fontSize: 38,
    fills: solid(C.ocean800),
    letterSpacing: 50,
    textCase: 'UPPER',
    x: 240, y: prodStartY + 50,
  });
  frame3.appendChild(c3Name1);

  // DAWN TIDE 서브 설명
  const c3Sub1 = createText({
    name: '📝 설명 — 새벽 파도의 향',
    text: '새벽 파도의 향',
    fontName: { family: "Noto Sans KR", style: "Light" },
    fontSize: 21,
    fills: solid(C.basalt600),
    letterSpacing: 2,
    x: 240, y: prodStartY + 100,
  });
  frame3.appendChild(c3Sub1);

  // 구분선 1
  const c3Divider1 = createLine({
    name: '제품 구분선 ①',
    width: 280,
    x: 240, y: prodStartY + prodHeight,
    strokes: solid(C.ocean700),
    opacity: 0.15,
    strokeWeight: 0.5,
  });
  frame3.appendChild(c3Divider1);

  // ===== 3장 제품 라인업 — SALT WIND =====
  const prod2Y = prodStartY + prodHeight + prodGap;

  const c3Bottle2 = createRect({
    name: '🖼️ SALT WIND 보틀 (여기에 이미지 배치)',
    width: 80, height: 180,
    x: 100, y: prod2Y + 20,
    fills: solid(C.ocean700, 0.08),
    cornerRadius: 4,
  });
  frame3.appendChild(c3Bottle2);

  const c3Name2 = createText({
    name: '📝 제품명 — Salt Wind',
    text: 'SALT WIND',
    fontName: { family: "Josefin Sans", style: "Thin" },
    fontSize: 38,
    fills: solid(C.ocean800),
    letterSpacing: 50,
    textCase: 'UPPER',
    x: 240, y: prod2Y + 50,
  });
  frame3.appendChild(c3Name2);

  const c3Sub2 = createText({
    name: '📝 설명 — 소금기 머금은 바람',
    text: '소금기 머금은 바람',
    fontName: { family: "Noto Sans KR", style: "Light" },
    fontSize: 21,
    fills: solid(C.basalt600),
    letterSpacing: 2,
    x: 240, y: prod2Y + 100,
  });
  frame3.appendChild(c3Sub2);

  // 구분선 2
  const c3Divider2 = createLine({
    name: '제품 구분선 ②',
    width: 280,
    x: 240, y: prod2Y + prodHeight,
    strokes: solid(C.ocean700),
    opacity: 0.15,
    strokeWeight: 0.5,
  });
  frame3.appendChild(c3Divider2);

  // ===== 3장 제품 라인업 — WHITE SAND =====
  const prod3Y = prod2Y + prodHeight + prodGap;

  const c3Bottle3 = createRect({
    name: '🖼️ WHITE SAND 보틀 (여기에 이미지 배치)',
    width: 100, height: 160,
    x: 90, y: prod3Y + 30,
    fills: solid(C.ocean700, 0.08),
    cornerRadius: 4,
  });
  frame3.appendChild(c3Bottle3);

  const c3Name3 = createText({
    name: '📝 제품명 — White Sand',
    text: 'WHITE SAND',
    fontName: { family: "Josefin Sans", style: "Thin" },
    fontSize: 38,
    fills: solid(C.ocean800),
    letterSpacing: 50,
    textCase: 'UPPER',
    x: 240, y: prod3Y + 50,
  });
  frame3.appendChild(c3Name3);

  const c3Sub3 = createText({
    name: '📝 설명 — 흰 모래의 온기',
    text: '흰 모래의 온기',
    fontName: { family: "Noto Sans KR", style: "Light" },
    fontSize: 21,
    fills: solid(C.basalt600),
    letterSpacing: 2,
    x: 240, y: prod3Y + 100,
  });
  frame3.appendChild(c3Sub3);

  // ===== 3장 CTA 영역 =====
  const ctaY = prod3Y + prodHeight + 60;

  const c3CTA = createText({
    name: '📝 CTA — 2026 S/S First Collection',
    text: '2026 S/S First Collection',
    fontName: { family: "Raleway", style: "ExtraLight" },
    fontSize: 28,
    fills: solid(C.ocean700),
    letterSpacing: 35,
    textAlignHorizontal: 'CENTER',
    textCase: 'UPPER',
    x: 0, y: ctaY,
    width: CARD_W,
  });
  frame3.appendChild(c3CTA);

  // CTA 데코: 라인 + 도트 + 라인
  const ctaDecoY = ctaY + 56;
  const c3CtaLine1 = createLine({
    name: 'CTA 데코 라인 (좌)',
    width: 48,
    x: CARD_W / 2 - 60, y: ctaDecoY,
    strokes: solid(C.sand500),
    opacity: 0.6,
  });
  frame3.appendChild(c3CtaLine1);

  const c3CtaDot = createDot({
    name: 'CTA 도트',
    size: 5,
    x: CARD_W / 2 - 2.5, y: ctaDecoY - 2,
    fills: solid(C.sand500),
  });
  frame3.appendChild(c3CtaDot);

  const c3CtaLine2 = createLine({
    name: 'CTA 데코 라인 (우)',
    width: 48,
    x: CARD_W / 2 + 12, y: ctaDecoY,
    strokes: solid(C.sand500),
    opacity: 0.6,
  });
  frame3.appendChild(c3CtaLine2);

  // URL
  const c3URL = createText({
    name: '📝 URL — pado-perfume.kr',
    text: 'pado-perfume.kr',
    fontName: { family: "Josefin Sans", style: "Thin" },
    fontSize: 22,
    fills: solid(C.basalt600),
    letterSpacing: 25,
    textAlignHorizontal: 'CENTER',
    x: 0, y: ctaDecoY + 60,
    width: CARD_W,
  });
  frame3.appendChild(c3URL);


  // ============================================================
  //   완료 — 뷰포트를 생성된 카드로 이동
  // ============================================================

  // 모든 프레임을 현재 페이지에 추가 (이미 appendChild로 추가됨)
  figma.currentPage.appendChild(frame1);
  figma.currentPage.appendChild(frame2);
  figma.currentPage.appendChild(frame3);

  // 3장 모두 선택
  figma.currentPage.selection = [frame1, frame2, frame3];

  // 뷰포트를 선택한 노드에 맞춰 이동
  figma.viewport.scrollAndZoomIntoView([frame1, frame2, frame3]);

  console.log('');
  console.log('✅ PADO 카드뉴스 3장 생성 완료!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📐 크기: 1080×1350px × 3장');
  console.log('');
  console.log('📝 편집 방법:');
  console.log('  · 텍스트 더블클릭 → 내용 수정');
  console.log('  · 요소 드래그 → 위치/사이즈 조정');
  console.log('  · 🖼️ 표시 영역 → 보틀 SVG/PNG 이미지로 교체');
  console.log('');
  console.log('🔤 폰트 대체 안내:');
  console.log('  · Paperlogy → Noto Sans KR ExtraBold');
  console.log('  · Pretendard → Noto Sans KR Light');
  console.log('  · Raleway, Josefin Sans → 원본 그대로');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

})();
