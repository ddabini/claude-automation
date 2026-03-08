#!/usr/bin/env node
// =========================================================
// DeepDig 보고서 자동 생성 스크립트
// Anthropic API를 직접 호출하여 조사 → HTML 보고서 → registry.js 업데이트
//
// 사용법:
//   node generate-report.mjs --type <보고서유형> --date <YYYY-MM-DD>
//
// 보고서 유형:
//   daily-investment   — 투자 데일리 브리핑
//   weekly-realestate  — 부동산 앱서비스 분석 위클리
//   weekly-digital-ad  — 디지털 광고·마케팅 위클리
//   weekly-ai-update   — AI 최신 현황 위클리
//
// 환경변수:
//   ANTHROPIC_API_KEY  — Anthropic API 인증 키
// =========================================================

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// ── Anthropic API 클라이언트 (환경변수에서 키를 자동으로 읽음) ──
const client = new Anthropic();

// 사용할 AI 모델 (Sonnet = 빠르고 품질 좋음, 비용 효율적)
const MODEL = 'claude-sonnet-4-6';

// 프로젝트 루트 (GitHub Actions에서는 체크아웃된 저장소 위치)
const ROOT = process.cwd();

// =========================================================
// 보고서 유형별 설정
// 새로운 보고서 유형을 추가하려면 여기에 항목을 추가하면 됨
// =========================================================
const CONFIGS = {
  'daily-investment': {
    name: '투자 데일리 브리핑',
    categoryId: 'cat_003',
    folderPath: '03_투자데일리브리핑/report/',
    // 파일명 생성 함수 (날짜 → 파일명)
    fileNameFn: (date) => `investment-daily-${date.replace(/-/g, '')}.html`,
    // 제목 생성 함수
    titleFn: (info) => `[${info.month}월${info.day}일]투자 데일리 브리핑`,
    // 웹 검색할 주제 목록
    researchTopics: [
      '한국 주식시장: 코스피/코스닥 종가, 등락률, 외국인·기관·개인 순매수/순매도 금액, 거래대금, 주요 종목 이슈',
      '미국 주식시장: S&P500/나스닥/다우존스 종가와 등락률, 빅테크·AI 관련주 동향, 연준(Fed) 정책·금리',
      '부동산: 서울 아파트 매매/전세 가격 동향, 매물 증감, 정책 변화, DSR·금리 이슈',
      '종합: 원/달러 환율, WTI 유가, 금 시세, 글로벌 리스크 요인',
    ],
    // 주요지표 라벨 (보고서와 registry에 사용)
    keyMetrics: ['코스피', '코스닥', '나스닥', '달러', '금'],
    // 보고서 본문 구성 지시
    reportSections: '요약 박스 → 한국증시 → 미국증시 → 부동산 → 종합 전망 순서',
  },
  'weekly-realestate': {
    name: '부동산 앱서비스 분석 위클리',
    categoryId: 'cat_004',
    folderPath: '05_부동산앱서비스분석/report/',
    fileNameFn: (date) => `realestate-app-weekly-${yearWeek(date)}.html`,
    titleFn: (info) => `[${info.month}월${info.weekNum}주차]부동산 앱서비스 위클리`,
    researchTopics: [
      '직방·다방·네이버부동산·호갱노노·아실 등 부동산 앱 주간 동향, 신규 기능, 업데이트',
      '부동산 앱 사용자 리뷰 분석, MAU/DAU 변화, 앱스토어 순위',
      '프롭테크 스타트업 투자·인수 소식, 새로운 부동산 서비스 출시',
      '부동산 시장 전반 동향 (매매/전세 가격, 정책 변화) — 앱 서비스에 미치는 영향',
    ],
    keyMetrics: ['직방', '호갱노노', '네이버부동산', '아실', '리치고'],
    reportSections: '요약 박스 → 앱별 주간 동향 → 시장 변화 → 전망 순서',
  },
  'weekly-digital-ad': {
    name: '디지털 광고·마케팅 위클리',
    categoryId: 'cat_005',
    folderPath: '06_디지털광고마케팅위클리/report/',
    fileNameFn: (date) => `digital-ad-weekly-${yearWeek(date)}.html`,
    titleFn: (info) => `[${info.month}월${info.weekNum}주차]디지털 광고·마케팅 위클리`,
    researchTopics: [
      'Google·Meta·TikTok 광고 플랫폼 업데이트, 신규 광고 상품, 정책 변경',
      '네이버·카카오 광고 상품 변화, 커머스 연동, AI 광고 도구',
      '디지털 마케팅 트렌드, CPM/CPC 변화, 주요 캠페인 사례',
      '커뮤니티(당근·에브리타임·블라인드) 광고 동향, 인플루언서 마케팅',
    ],
    keyMetrics: ['메타', '구글', '틱톡', '네이버', '카카오'],
    reportSections: '요약 박스 → 플랫폼별 업데이트 → 트렌드 분석 → 전망 순서',
  },
  'weekly-ai-update': {
    name: 'AI 최신 현황 위클리',
    categoryId: 'cat_006',
    folderPath: '07_AI최신현황위클리/report/',
    fileNameFn: (date) => `ai-update-weekly-${yearWeek(date)}.html`,
    titleFn: (info) => `[${info.month}월${info.weekNum}주차]AI 최신 현황 위클리`,
    researchTopics: [
      'AI 모델 출시/업데이트: OpenAI·Anthropic·Google·Meta·오픈소스 모델 새 버전, 성능 벤치마크',
      'AI 기업 동향: 투자 유치, 인수합병, 기업가치 변동, 주요 발표',
      'AI 규제·정책: 각국 AI 규제 동향, EU AI Act, 미국 행정명령, 한국 AI 법안',
      'AI 도구·서비스: 코딩 에이전트(Cursor·Devin·Replit), 이미지·영상 생성, 챗봇 서비스 업데이트',
    ],
    keyMetrics: ['OpenAI', 'Anthropic', 'Google', 'Meta', 'Startup'],
    reportSections: '요약 박스 → 모델 업데이트 → 기업 동향 → 규제·정책 → 도구·서비스 순서',
  },
};

// =========================================================
// 유틸리티 함수
// =========================================================

// 날짜 문자열(YYYY-MM-DD) → 연도+주차 문자열(YYYYWW)
function yearWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00+09:00'); // KST 기준
  const year = d.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${year}${String(week).padStart(2, '0')}`;
}

// 날짜 문자열 → 월/일/주차 정보 객체
function dateInfo(dateStr) {
  const d = new Date(dateStr + 'T00:00:00+09:00');
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    weekNum: Math.ceil(d.getDate() / 7),
  };
}

// 커맨드라인 인자 파싱 (--type, --date)
function parseArgs() {
  const args = process.argv.slice(2);
  let type = '', date = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type' && args[i + 1]) type = args[++i];
    if (args[i] === '--date' && args[i + 1]) date = args[++i];
  }
  if (!type || !date) {
    console.error('사용법: node generate-report.mjs --type <유형> --date <YYYY-MM-DD>');
    console.error('유형: daily-investment | weekly-realestate | weekly-digital-ad | weekly-ai-update');
    process.exit(1);
  }
  return { type, date };
}

// =========================================================
// Anthropic API 호출 함수
// =========================================================

// 웹 검색 도구를 사용하여 조사하는 함수
// Anthropic 서버가 자동으로 웹 검색을 실행하고 결과를 Claude에게 전달함
async function research(prompt) {
  console.log('   → API 호출 중 (web_search 포함)...');
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 10 }],
    messages: [{ role: 'user', content: prompt }],
  });

  // 응답에서 텍스트 블록만 추출 (검색 결과는 Claude가 이미 소화한 상태)
  const texts = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text);

  if (texts.length === 0) {
    throw new Error('API 응답에 텍스트가 없습니다. 응답: ' + JSON.stringify(response.content.map(b => b.type)));
  }

  console.log(`   → 완료 (토큰: 입력 ${response.usage.input_tokens} / 출력 ${response.usage.output_tokens})`);
  return texts.join('\n');
}

// 일반 텍스트 생성 함수 (웹 검색 없이)
async function generate(prompt) {
  console.log('   → API 호출 중...');
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');

  console.log(`   → 완료 (토큰: 입력 ${response.usage.input_tokens} / 출력 ${response.usage.output_tokens})`);
  return text;
}

// =========================================================
// DeepDig 표준 CSS (브런치 스타일, Noto Sans KR, 900px)
// =========================================================
const REPORT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Noto Sans KR', sans-serif;
    background: #ffffff;
    color: #333;
    line-height: 1.8;
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
  }
  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 60px 24px 80px;
  }
  h1 {
    font-size: 32px;
    font-weight: 900;
    color: #111;
    margin-bottom: 8px;
    line-height: 1.3;
  }
  .date {
    color: #888;
    font-size: 14px;
    margin-bottom: 40px;
  }
  .summary-box {
    background: #f8f9fa;
    border-left: 4px solid #333;
    padding: 24px 28px;
    margin-bottom: 48px;
    border-radius: 0 8px 8px 0;
  }
  .summary-box h2 {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 12px;
    color: #111;
  }
  .summary-box ul {
    list-style: none;
    padding: 0;
  }
  .summary-box li {
    position: relative;
    padding-left: 16px;
    margin-bottom: 8px;
    font-size: 15px;
    line-height: 1.6;
    color: #444;
  }
  .summary-box li::before {
    content: '·';
    position: absolute;
    left: 0;
    font-weight: 900;
    color: #333;
  }
  h2 {
    font-size: 22px;
    font-weight: 700;
    color: #111;
    margin: 48px 0 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eee;
  }
  h3 {
    font-size: 18px;
    font-weight: 700;
    color: #222;
    margin: 32px 0 12px;
  }
  p {
    margin-bottom: 16px;
    color: #444;
  }
  strong { color: #111; }
  .metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin: 24px 0;
  }
  .metric {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px 20px;
    flex: 1;
    min-width: 140px;
    text-align: center;
  }
  .metric .label {
    font-size: 13px;
    color: #888;
    margin-bottom: 4px;
  }
  .metric .value {
    font-size: 22px;
    font-weight: 700;
    color: #111;
  }
  .metric .change {
    font-size: 13px;
    margin-top: 2px;
  }
  .up { color: #e74c3c; }
  .down { color: #3498db; }
  .flat { color: #888; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 14px;
  }
  th, td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  th {
    font-weight: 700;
    color: #111;
    background: #f8f9fa;
  }
  .sources {
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid #eee;
    font-size: 13px;
    color: #888;
  }
  .sources h3 {
    font-size: 14px;
    color: #888;
    margin-bottom: 12px;
  }
  .sources li {
    margin-bottom: 4px;
  }
  .tag {
    display: inline-block;
    background: #f0f0f0;
    color: #666;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    margin: 2px;
  }
  @media (max-width: 640px) {
    .container { padding: 32px 16px 60px; }
    h1 { font-size: 24px; }
    .metric { min-width: 100px; }
  }
`;

// =========================================================
// 메인 실행
// =========================================================
async function main() {
  const { type, date } = parseArgs();
  const config = CONFIGS[type];

  if (!config) {
    console.error(`알 수 없는 보고서 유형: ${type}`);
    console.error('사용 가능: ' + Object.keys(CONFIGS).join(', '));
    process.exit(1);
  }

  const info = dateInfo(date);
  const title = config.titleFn(info);
  const fileName = config.fileNameFn(date);
  const reportDir = join(ROOT, '04_deepdig', config.folderPath);
  const filePath = join(reportDir, fileName);

  console.log('═══════════════════════════════════════');
  console.log(`📋 ${config.name} 자동 생성`);
  console.log(`   날짜: ${date}`);
  console.log(`   제목: ${title}`);
  console.log(`   파일: 04_deepdig/${config.folderPath}${fileName}`);
  console.log('═══════════════════════════════════════');

  // ── Step 1: 웹 검색으로 최신 뉴스/데이터 조사 ──
  console.log('\n🔍 Step 1/3: 웹 검색 조사');
  const researchResult = await research(`
오늘은 ${date}입니다. 아래 주제들에 대해 최신 뉴스와 데이터를 검색하여 조사해주세요.

## 조사 주제
${config.researchTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

## 출력 형식
각 주제별로:
- 핵심 팩트와 정확한 수치 (변동률, 금액, 지수 등)
- 출처 매체명
- 주요 원인과 영향 분석

수치는 반드시 정확하게 기재하고, 불확실한 것은 불확실하다고 표시해주세요.
검색 결과가 없는 주제는 "최신 데이터 없음"으로 표시하세요.
  `.trim());

  // ── Step 2: HTML 보고서 생성 ──
  console.log('\n📝 Step 2/3: HTML 보고서 생성');
  const htmlContent = await generate(`
아래 조사 결과를 바탕으로 HTML 보고서를 생성해주세요.

## 조사 결과
${researchResult}

## 보고서 요구사항
- 제목: ${title}
- 날짜: ${date}
- 본문 구성: ${config.reportSections}
- 요약 박스에 핵심 포인트 5개를 bullet로 정리
- 각 섹션에 수치와 분석을 풍부하게 포함
- 출처 섹션에 참고한 매체와 URL 나열
- 한국어로 작성

## HTML 형식
아래 구조를 정확히 따라주세요. HTML 코드만 출력하세요 (설명 없이):

<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${REPORT_CSS}</style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <div class="date">${date} 기준</div>
    <div class="summary-box">
      <h2>핵심 요약</h2>
      <ul>
        <li>요약 포인트 1</li>
        ...5개
      </ul>
    </div>
    <!-- 본문 섹션들 -->
    <div class="sources">
      <h3>출처</h3>
      <ul>...</ul>
    </div>
  </div>
</body>
</html>

**반드시 <!DOCTYPE html>로 시작하고 </html>로 끝나야 합니다.**
**마크다운 코드블록(\`\`\`)으로 감싸지 마세요.**
  `.trim());

  // HTML 코드 정리 (마크다운 코드블록 제거)
  let html = htmlContent.trim();
  if (html.startsWith('```')) {
    html = html.replace(/^```(?:html)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  // <!DOCTYPE html>이 없으면 문제 — 에러 로그
  if (!html.includes('<!DOCTYPE html>') && !html.includes('<!doctype html>')) {
    console.warn('⚠️ HTML에 DOCTYPE이 없습니다. 그대로 저장합니다.');
  }

  // 폴더가 없으면 생성
  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true });
    console.log(`   폴더 생성: ${reportDir}`);
  }

  // HTML 파일 저장
  writeFileSync(filePath, html, 'utf-8');
  console.log(`   ✅ 저장 완료: ${filePath}`);

  // ── Step 3: registry.js 업데이트 ──
  console.log('\n📋 Step 3/3: registry.js 업데이트');
  const registryPath = join(ROOT, '04_deepdig/registry.js');

  if (!existsSync(registryPath)) {
    console.error('❌ registry.js를 찾을 수 없습니다:', registryPath);
    process.exit(1);
  }

  const registry = readFileSync(registryPath, 'utf-8');

  // 현재 가장 큰 rpt_XXX 번호 찾기
  const rptNumbers = [...registry.matchAll(/rpt_(\d+)/g)].map(m => parseInt(m[1]));
  const maxNum = rptNumbers.length > 0 ? Math.max(...rptNumbers) : 0;
  const newId = `rpt_${String(maxNum + 1).padStart(3, '0')}`;

  // API에게 registry 항목 생성 요청
  const entryText = await generate(`
아래 조사 요약을 바탕으로 registry.js에 추가할 보고서 항목을 생성해주세요.

## 조사 요약 (처음 2000자)
${researchResult.substring(0, 2000)}

## 생성할 항목 (JavaScript 객체 형식)
반드시 아래 형식의 JavaScript 객체만 출력하세요. 다른 텍스트는 절대 포함하지 마세요.
중괄호 { 로 시작하고 } 로 끝나야 합니다.

{
  id: "${newId}",
  categoryId: "${config.categoryId}",
  title: "${title}",
  date: "${date}",
  period: "${info.year}년 ${info.month}월${type.startsWith('weekly') ? ' ' + info.weekNum + '주차' : ' ' + info.day + '일'}",
  folderPath: "${config.folderPath}",
  fileName: "${fileName}",
  summary: "조사 내용을 2-3문장으로 요약",
  summaryPoints: [
    "핵심 포인트 1",
    "핵심 포인트 2",
    "핵심 포인트 3",
    "핵심 포인트 4",
    "핵심 포인트 5"
  ],
  sources: { total: 실제숫자, gradeA: 숫자, gradeB: 숫자, gradeC: 숫자 },
  tags: ["태그1", "태그2", "태그3", "태그4", "태그5", "태그6", "태그7", "태그8", "태그9", "태그10"],
  keyMetrics: [
    ${config.keyMetrics.map(label => `{ label: "${label}", value: "수치", change: "변동률", dir: "up 또는 down 또는 flat" }`).join(',\n    ')}
  ]
}
  `.trim());

  // JavaScript 객체 코드 정리
  let entry = entryText.trim();
  if (entry.startsWith('```')) {
    entry = entry.replace(/^```(?:javascript|js)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  // { 로 시작하는지 확인
  if (!entry.startsWith('{')) {
    // { 부터 추출 시도
    const braceIdx = entry.indexOf('{');
    if (braceIdx >= 0) {
      entry = entry.substring(braceIdx);
    } else {
      console.error('❌ registry 항목 생성 실패 — { 를 찾을 수 없습니다');
      console.error('응답:', entry.substring(0, 200));
      process.exit(1);
    }
  }

  // reports: [ 뒤에 새 항목 삽입 (배열 맨 앞 = 최신순)
  const insertMarker = 'reports: [';
  const insertIdx = registry.indexOf(insertMarker);
  if (insertIdx < 0) {
    console.error('❌ registry.js에서 "reports: [" 를 찾을 수 없습니다');
    process.exit(1);
  }

  // 삽입 위치: "reports: [" 바로 다음 줄
  const afterMarker = insertIdx + insertMarker.length;
  const indent = '    '; // 4칸 들여쓰기
  const updatedRegistry =
    registry.slice(0, afterMarker) + '\n' +
    indent + entry + ',' +
    registry.slice(afterMarker);

  writeFileSync(registryPath, updatedRegistry, 'utf-8');
  console.log(`   ✅ ${newId} 추가 완료`);

  // ── 완료 보고 ──
  console.log('\n═══════════════════════════════════════');
  console.log(`✅ ${config.name} 생성 완료!`);
  console.log(`   HTML: 04_deepdig/${config.folderPath}${fileName}`);
  console.log(`   Registry: ${newId} 추가됨`);
  console.log('═══════════════════════════════════════');

  // GitHub Actions 출력 변수 설정 (워크플로우에서 사용)
  if (process.env.GITHUB_OUTPUT) {
    const outputLines = [
      `report_id=${newId}`,
      `file_name=${fileName}`,
      `title=${title}`,
    ];
    const fs = await import('fs');
    fs.appendFileSync(process.env.GITHUB_OUTPUT, outputLines.join('\n') + '\n');
  }
}

// 실행
main().catch(err => {
  console.error('\n❌ 보고서 생성 실패:', err.message);
  if (err.status) console.error('   HTTP 상태:', err.status);
  if (err.error) console.error('   에러 상세:', JSON.stringify(err.error));
  process.exit(1);
});
