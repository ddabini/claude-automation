#!/usr/bin/env node
/**
 * add-brand-links.js
 *
 * DeepDig 리포트에서 타 브랜드/웹사이트 언급 시
 * 해당 브랜드의 공식 홈페이지 링크를 자동으로 추가하는 스크립트
 *
 * 사용법: node add-brand-links.js
 *
 * 동작 방식:
 * 1. 모든 리포트 HTML 파일을 찾음
 * 2. 본문의 텍스트 노드에서 브랜드명을 찾아 <a> 태그로 감쌈
 * 3. <style>, <script>, <a>, <head> 내부는 건너뜀
 * 4. 브랜드 링크용 CSS를 각 파일에 주입
 */

const fs = require('fs');
const path = require('path');

// ===== 브랜드 → 공식 홈페이지 URL 매핑 =====
// 배열 형태: [브랜드명(정규식 패턴), 공식 URL]
// ※ 긴 이름이 먼저 매칭되도록 길이순 정렬 처리함
const RAW_BRANDS = [
  // --- 복합 이름 (긴 것 먼저) ---
  ['한화에어로스페이스', 'https://www.hanwhaaerospace.com'],
  ['네이버페이 부동산', 'https://land.naver.com'],
  ['Samsung Health', 'https://health.samsung.com'],
  ['Google DeepMind', 'https://deepmind.google'],
  ['MyFitnessPal', 'https://www.myfitnesspal.com'],
  ['TikTok Shop', 'https://shop.tiktok.com'],
  ['TikTok Lite', 'https://www.tiktok.com'],
  ['YouTube Shorts', 'https://www.youtube.com/shorts'],
  ['Claude Code', 'https://docs.anthropic.com/en/docs/claude-code'],
  ['네이버부동산', 'https://land.naver.com'],
  ['모바일인덱스', 'https://www.mobileindex.com'],
  ['부동산플래닛', 'https://www.bdsplanet.com'],
  ['배달의민족', 'https://www.baemin.com'],
  ['한미반도체', 'https://www.hanmisemi.com'],
  ['한화에어로', 'https://www.hanwhaaerospace.com'],
  ['에브리타임', 'https://everytime.kr'],
  ['Nano Banana', 'https://nanobanana.com'],
  ['Sensor Tower', 'https://sensortower.com'],
  ['DataReportal', 'https://datareportal.com'],
  ['SK하이닉스', 'https://www.skhynix.com'],
  ['LIG넥스원', 'https://www.lignex1.com'],
  ['부동산114', 'https://www.r114.com'],
  ['Advantage\\+', 'https://www.facebook.com/business/ads/meta-advantage'],
  ['카카오모먼트', 'https://moment.kakao.com'],
  ['네이버 웹툰', 'https://comic.naver.com'],
  ['네이버 블로그', 'https://blog.naver.com'],
  ['네이버 지도', 'https://map.naver.com'],
  ['Google One', 'https://one.google.com'],
  ['Google Play', 'https://play.google.com'],
  ['Google Ads', 'https://ads.google.com'],
  ['RevenueCat', 'https://www.revenuecat.com'],
  ['VentureBeat', 'https://venturebeat.com'],
  ['TechCrunch', 'https://techcrunch.com'],
  ['Perplexity', 'https://www.perplexity.ai'],
  ['KB부동산', 'https://kbland.kr'],
  ['호갱노노', 'https://hogangnono.com'],
  ['에쓰오일', 'https://www.s-oil.com'],
  ['삼성전자', 'https://www.samsung.com'],
  ['카카오페이', 'https://www.kakaopay.com'],
  ['와이즈앱', 'https://www.wiseapp.co.kr'],
  ['블라인드', 'https://www.teamblind.com'],
  ['카카오톡', 'https://www.kakaocorp.com/page/service/service/KakaoTalk'],
  ['디스코드', 'https://discord.com'],
  ['인스타그램', 'https://www.instagram.com'],
  ['핀터레스트', 'https://www.pinterest.com'],
  ['지그재그', 'https://zigzag.kr'],
  ['엔비디아', 'https://www.nvidia.com'],
  ['카카오T', 'https://t.kakao.com'],
  ['Instagram', 'https://www.instagram.com'],
  ['Anthropic', 'https://www.anthropic.com'],
  ['Bloomberg', 'https://www.bloomberg.com'],
  ['Facebook', 'https://www.facebook.com'],
  ['Pinterest', 'https://www.pinterest.com'],
  ['Snapchat', 'https://www.snapchat.com'],
  ['Midjourney', 'https://www.midjourney.com'],
  ['DeepSeek', 'https://www.deepseek.com'],
  ['GenSpark', 'https://www.genspark.ai'],
  ['Cognition', 'https://www.cognition.ai'],
  ['Kling AI', 'https://klingai.com'],
  ['Windsurf', 'https://codeium.com/windsurf'],
  ['Descript', 'https://www.descript.com'],
  ['InVideo', 'https://invideo.io'],
  ['MiniMax', 'https://www.minimax.chat'],
  ['YouTube', 'https://www.youtube.com'],
  ['Netflix', 'https://www.netflix.com'],
  ['Discord', 'https://discord.com'],
  ['Revolut', 'https://www.revolut.com'],
  ['ChatGPT', 'https://chatgpt.com'],
  ['Tinder', 'https://tinder.com'],
  ['OpenAI', 'https://openai.com'],
  ['Gemini', 'https://gemini.google.com'],
  ['Cursor', 'https://www.cursor.com'],
  ['Runway', 'https://runwayml.com'],
  ['CapCut', 'https://www.capcut.com'],
  ['Replit', 'https://replit.com'],
  ['Amazon', 'https://www.amazon.com'],
  ['NVIDIA', 'https://www.nvidia.com'],
  ['fal\\.ai', 'https://fal.ai'],
  ['리치고', 'https://www.richgo.ai'],
  ['TikTok', 'https://www.tiktok.com'],
  ['Devin', 'https://www.cognition.ai'],
  ['Shein', 'https://www.shein.com'],
  ['Claude', 'https://claude.ai'],
  ['유튜브', 'https://www.youtube.com'],
  ['카카오', 'https://www.kakaocorp.com'],
  ['네이버', 'https://www.naver.com'],
  ['Google', 'https://www.google.com'],
  ['Temu', 'https://www.temu.com'],
  ['Vrew', 'https://vrew.voyagerx.com'],
  ['Pika', 'https://pika.art'],
  ['Sora', 'https://openai.com/sora'],
  ['Meta', 'https://about.meta.com'],
  ['Grok', 'https://grok.x.ai'],
  ['CNBC', 'https://www.cnbc.com'],
  ['Veo', 'https://deepmind.google/technologies/veo'],
  ['HDC', 'https://www.hdcgroup.kr'],
  ['쿠팡', 'https://www.coupang.com'],
  ['직방', 'https://www.zigbang.com'],
  ['다방', 'https://www.dabangapp.com'],
  ['토스', 'https://toss.im'],
  ['당근', 'https://www.daangn.com'],
  ['아실', 'https://asil.kr'],
  ['메타', 'https://about.meta.com'],
  ['틱톡', 'https://www.tiktok.com'],
];

// 브랜드명 길이순 내림차순 정렬 (긴 것 먼저 매칭)
const BRANDS = RAW_BRANDS.sort((a, b) => b[0].length - a[0].length);

// 브랜드명 → URL 빠른 조회용 맵 (정규식 이스케이프 제거한 원본 이름 기준)
const brandUrlMap = new Map();
for (const [pattern, url] of BRANDS) {
  // 정규식 이스케이프 문자를 원본으로 복원하여 맵 키로 사용
  const plainName = pattern.replace(/\\([+.*?^${}()|[\]\\])/g, '$1');
  brandUrlMap.set(plainName, url);
}

// 모든 브랜드를 하나의 정규식으로 결합 (긴 것이 먼저 시도됨)
const combinedPattern = BRANDS.map(([name]) => `(${name})`).join('|');
const brandRegex = new RegExp(combinedPattern, 'g');

// ===== 브랜드 링크 CSS 스타일 =====
const BRAND_LINK_CSS = `
  /* 브랜드 공식 홈페이지 바로가기 링크 스타일 */
  a.brand-link {
    color: inherit;
    text-decoration: underline;
    text-decoration-style: dotted;
    text-decoration-color: #4a6cf7;
    text-underline-offset: 3px;
    text-decoration-thickness: 1.5px;
    transition: all 0.15s ease;
    cursor: pointer;
  }
  a.brand-link:hover {
    color: #4a6cf7;
    text-decoration-style: solid;
    text-decoration-color: #4a6cf7;
  }
`;

/**
 * HTML 문자열에서 브랜드명을 찾아 링크로 감싸는 핵심 함수
 *
 * 동작: HTML을 태그/텍스트 토큰으로 분리한 뒤,
 *       <style>, <script>, <a>, <head>, <!-- --> 내부가 아닌
 *       텍스트 노드에서만 브랜드명을 <a> 태그로 감쌈
 */
function addBrandLinksToHTML(html) {
  // 0단계: 기존 brand-link 제거 (재실행 시 중복 방지)
  html = html.replace(/<a\s+href="[^"]*"\s+target="_blank"\s+rel="noopener noreferrer"\s+class="brand-link">([^<]*)<\/a>/g, '$1');
  // 기존 CSS도 제거
  html = html.replace(/\s*<style>\s*\/\* 브랜드 공식 홈페이지 바로가기 링크 스타일 \*\/[\s\S]*?<\/style>\s*(?=<\/head>)/g, '');

  // 1단계: CSS 주입 (</head> 바로 앞에 브랜드 링크 스타일 추가)
  if (!html.includes('a.brand-link')) {
    html = html.replace('</head>', `  <style>${BRAND_LINK_CSS}  </style>\n</head>`);
  }

  // 2단계: HTML을 태그와 텍스트 노드로 토큰화
  const tokens = [];
  let lastIndex = 0;
  // HTML 태그 매칭 정규식 (주석 포함)
  const tagRegex = /<!--[\s\S]*?-->|<[^>]+>/g;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    // 태그 앞의 텍스트 노드 추가
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: html.slice(lastIndex, match.index) });
    }
    // 태그 자체 추가
    tokens.push({ type: 'tag', content: match[0] });
    lastIndex = match.index + match[0].length;
  }
  // 마지막 텍스트 노드
  if (lastIndex < html.length) {
    tokens.push({ type: 'text', content: html.slice(lastIndex) });
  }

  // 3단계: 상태 추적하며 텍스트 노드에서만 브랜드 치환
  let inStyle = false;    // <style> 내부인지
  let inScript = false;   // <script> 내부인지
  let inAnchor = 0;       // <a> 중첩 깊이 (0이면 밖)
  let inHead = false;     // <head> 내부인지
  let inComment = false;  // <!-- --> 내부인지

  let totalReplacements = 0;

  for (const token of tokens) {
    if (token.type === 'tag') {
      const lower = token.content.toLowerCase().trim();

      // 주석 처리
      if (lower.startsWith('<!--')) {
        inComment = true;
        if (lower.endsWith('-->')) inComment = false;
        continue;
      }
      if (lower.endsWith('-->')) {
        inComment = false;
        continue;
      }

      // 태그 열기/닫기 상태 추적
      if (lower.startsWith('<style')) inStyle = true;
      else if (lower === '</style>') inStyle = false;
      else if (lower.startsWith('<script')) inScript = true;
      else if (lower === '</script>') inScript = false;
      else if (lower.startsWith('<a ') || lower === '<a>') inAnchor++;
      else if (lower === '</a>') inAnchor = Math.max(0, inAnchor - 1);
      // <head>만 매칭 (<header> 혼동 방지)
      else if (lower === '<head>' || lower.startsWith('<head ') || lower.startsWith('<head>')) inHead = true;
      else if (lower === '</head>') inHead = false;
    } else if (token.type === 'text') {
      // 안전한 위치의 텍스트 노드에서만 브랜드 치환 수행
      if (!inStyle && !inScript && inAnchor === 0 && !inHead && !inComment) {
        // 브랜드 정규식으로 한 번에 치환 (긴 이름 우선)
        const before = token.content;
        token.content = token.content.replace(brandRegex, (matched) => {
          // 정규식 이스케이프된 패턴의 원본 이름으로 URL 조회
          const url = brandUrlMap.get(matched);
          if (url) {
            totalReplacements++;
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="brand-link">${matched}</a>`;
          }
          return matched;
        });
      }
    }
  }

  // 4단계: 토큰들을 다시 결합하여 최종 HTML 생성
  const result = tokens.map(t => t.content).join('');
  return { html: result, count: totalReplacements };
}

// ===== 메인 실행 =====
function main() {
  const baseDir = path.join(__dirname, '..');

  // 모든 리포트 HTML 파일 찾기 (index.html 제외)
  const reportFiles = [];

  function findReports(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        findReports(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.html') && entry.name !== 'index.html') {
        reportFiles.push(fullPath);
      }
    }
  }

  findReports(baseDir);

  console.log(`\n[브랜드 링크 추가 스크립트]`);
  console.log(`발견된 리포트 파일: ${reportFiles.length}개\n`);

  let totalLinks = 0;

  for (const filePath of reportFiles) {
    const relativePath = path.relative(baseDir, filePath);
    const originalHtml = fs.readFileSync(filePath, 'utf-8');

    const { html: modifiedHtml, count } = addBrandLinksToHTML(originalHtml);

    if (count > 0) {
      fs.writeFileSync(filePath, modifiedHtml, 'utf-8');
      console.log(`  [완료] ${relativePath} — ${count}개 브랜드 링크 추가`);
      totalLinks += count;
    } else {
      console.log(`  [스킵] ${relativePath} — 브랜드 매칭 없음`);
    }
  }

  console.log(`\n총 ${totalLinks}개 브랜드 링크가 ${reportFiles.length}개 파일에 추가되었습니다.`);
}

main();
