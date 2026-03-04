// PADO 카드뉴스 HTML → Pikbox 디자인 리뷰 업로드 스크립트
// Firebase Storage + Realtime DB에 직접 등록
// 실행: node upload-pikbox.js

const fs = require('fs');
const path = require('path');
const https = require('https');

// ===== Firebase 설정 =====
const FIREBASE_PROJECT = 'did-ads';
const STORAGE_BUCKET = 'did-ads.firebasestorage.app';
const DATABASE_URL = 'https://did-ads-default-rtdb.asia-southeast1.firebasedatabase.app';

// ===== 업로드할 파일 정보 =====
const HTML_FILE_PATH = path.join(__dirname, '디자인', 'pado-cardnews.html');
const TIMESTAMP = Date.now();
const FILE_NAME = 'pado-cardnews.html';
const STORAGE_PATH = `design-review/${TIMESTAMP}_${FILE_NAME}`;

// ===== 디자인 메타데이터 =====
const DESIGN_METADATA = {
  name: 'PADO_퍼퓸_카드뉴스 제주 니치 퍼퓸 카드뉴스 3장',
  status: 'review',
  fileName: FILE_NAME,
  type: 'file',
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  width: 1080,
  height: 1350,
  pages: 3
};

// ===== Firebase Storage 업로드 (REST API) =====
// Firebase Storage는 인증 없이 퍼블릭 규칙이면 바로 업로드 가능
async function uploadToStorage(htmlContent) {
  return new Promise((resolve, reject) => {
    const encodedPath = encodeURIComponent(STORAGE_PATH);
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o?name=${encodedPath}&uploadType=media`;

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': Buffer.byteLength(htmlContent, 'utf8')
      }
    };

    // URL을 hostname과 path로 분리
    const url = new URL(uploadUrl);

    const reqOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: options.headers
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(data);
          // 다운로드 URL 생성
          const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media`;
          console.log('✅ Storage 업로드 성공:', downloadUrl);
          resolve(downloadUrl);
        } else {
          console.error('❌ Storage 업로드 실패:', res.statusCode, data);
          reject(new Error(`Storage 업로드 실패: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(htmlContent);
    req.end();
  });
}

// ===== Firebase Realtime DB에 메타데이터 등록 =====
async function pushToDatabase(downloadUrl) {
  return new Promise((resolve, reject) => {
    const metadata = { ...DESIGN_METADATA, url: downloadUrl };
    const body = JSON.stringify(metadata);

    const dbPath = '/design-review/designs.json';
    const url = new URL(DATABASE_URL + dbPath);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body, 'utf8')
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(data);
          console.log('✅ DB 등록 성공. Key:', result.name);
          resolve(result.name);
        } else {
          console.error('❌ DB 등록 실패:', res.statusCode, data);
          reject(new Error(`DB 등록 실패: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ===== 메인 실행 =====
async function main() {
  console.log('📤 PADO 카드뉴스 Pikbox 업로드 시작...');
  console.log('파일:', HTML_FILE_PATH);

  // HTML 파일 읽기
  if (!fs.existsSync(HTML_FILE_PATH)) {
    console.error('❌ HTML 파일을 찾을 수 없습니다:', HTML_FILE_PATH);
    process.exit(1);
  }

  const htmlContent = fs.readFileSync(HTML_FILE_PATH, 'utf8');
  console.log(`📄 HTML 파일 크기: ${(Buffer.byteLength(htmlContent, 'utf8') / 1024).toFixed(1)} KB`);

  try {
    // 1단계: Storage에 업로드
    console.log('\n[1/2] Firebase Storage에 업로드 중...');
    const downloadUrl = await uploadToStorage(htmlContent);

    // 2단계: DB에 메타데이터 등록
    console.log('\n[2/2] Firebase DB에 메타데이터 등록 중...');
    const designKey = await pushToDatabase(downloadUrl);

    console.log('\n🎉 Pikbox 업로드 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('이름:', DESIGN_METADATA.name);
    console.log('상태:', DESIGN_METADATA.status);
    console.log('사이즈:', `${DESIGN_METADATA.width}×${DESIGN_METADATA.height}px × ${DESIGN_METADATA.pages}장`);
    console.log('DB Key:', designKey);
    console.log('다운로드 URL:', downloadUrl);
    console.log('Pikbox 리뷰: https://pikbox-app.web.app');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('\n❌ 업로드 실패:', error.message);
    process.exit(1);
  }
}

main();
