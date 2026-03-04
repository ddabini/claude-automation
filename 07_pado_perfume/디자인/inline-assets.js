// SVG 에셋을 HTML에 base64 data URI로 인라인 삽입하는 스크립트
const fs = require('fs');
const path = require('path');

let html = fs.readFileSync(path.join(__dirname, 'pado-cardnews.html'), 'utf8');

const svgPaths = [
  './assets/backgrounds/bg-card1-ocean.svg',
  './assets/backgrounds/bg-card2-white.svg',
  './assets/backgrounds/bg-card3-beige.svg',
  './assets/backgrounds/texture-wave-overlay.svg',
  './assets/icons/logo-pado.svg',
  './assets/icons/deco-wave-divider.svg',
  './assets/images/bottle-dawn-tide.svg',
  './assets/images/bottle-salt-wind.svg',
  './assets/images/bottle-white-sand.svg',
];

for (const svgPath of svgPaths) {
  const fullPath = path.resolve(__dirname, svgPath);
  if (!fs.existsSync(fullPath)) {
    console.error('NOT FOUND:', svgPath);
    continue;
  }
  const svgContent = fs.readFileSync(fullPath, 'utf8');
  const b64 = Buffer.from(svgContent).toString('base64');
  const dataUri = 'data:image/svg+xml;base64,' + b64;

  // 모든 참조를 data URI로 교체
  const count = (html.match(new RegExp(svgPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  html = html.split(svgPath).join(dataUri);
  console.log('OK:', svgPath, '→', Math.round(b64.length/1024) + 'KB base64,', count, '곳 교체');
}

fs.writeFileSync(path.join(__dirname, 'pado-cardnews.html'), html, 'utf8');
const finalSize = fs.statSync(path.join(__dirname, 'pado-cardnews.html')).size;
console.log('\nHTML 최종 크기:', Math.round(finalSize/1024) + 'KB');
