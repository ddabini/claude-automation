/**
 * ============================================
 * VELA 백엔드 서버 — 메인 진입점
 * ============================================
 *
 * 이 파일은 서버의 "정문" 역할을 합니다.
 * 모든 요청이 여기를 통해 들어오고, 적절한 담당자(라우트)에게 전달됩니다.
 *
 * 실행 방법: node server.js 또는 npm start
 */

// 환경변수 파일(.env)을 읽어서 process.env에 등록
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

// ── 라우트(API 경로) 불러오기 ──
const videoRoutes = require('./routes/video');
const audioRoutes = require('./routes/audio');
const subtitleRoutes = require('./routes/subtitle');

// ── 소켓 매니저 (실시간 통신 관리자) ──
const { initSocket } = require('./socket');

// ── 서버 기본 설정 ──
const PORT = process.env.PORT || 3001;
const app = express();

// Express 앱 위에 HTTP 서버를 올림 (Socket.io가 이 서버를 사용)
const server = http.createServer(app);

// Socket.io 서버 생성 — 프론트엔드(5173)에서의 접속을 허용
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      'http://localhost:5173',   // Vite 개발 서버
      'http://localhost:3000',   // 추가 개발 서버
      'http://127.0.0.1:5173',
    ],
    methods: ['GET', 'POST'],
  },
});

// ── 미들웨어 설정 (모든 요청에 적용되는 공통 처리) ──

// CORS: 다른 도메인(프론트엔드)에서 이 서버에 요청할 수 있게 허용
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ],
}));

// JSON 요청 본문을 파싱 (최대 50MB — 영상 관련 데이터가 클 수 있음)
app.use(express.json({ limit: '50mb' }));

// URL-encoded 요청 본문 파싱
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── 파일 저장 디렉토리 생성 ──
// 업로드 파일과 결과 파일을 저장할 폴더가 없으면 자동 생성
const uploadsDir = path.join(__dirname, 'uploads');
const outputsDir = path.join(__dirname, 'outputs');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
}

// 정적 파일 서빙 — outputs 폴더의 파일을 /outputs 경로로 접근 가능
// 예: http://localhost:3001/outputs/result.mp4
app.use('/outputs', express.static(outputsDir));

// 업로드된 파일도 서빙 (미리보기 등에 사용)
app.use('/uploads', express.static(uploadsDir));

// ── Socket.io 실시간 통신 초기화 ──
initSocket(io);

// io 인스턴스를 모든 라우트에서 사용할 수 있도록 주입
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ── API 라우트 등록 ──
// /api/video/... → 영상 업로드, 트림, 내보내기
app.use('/api/video', videoRoutes);

// /api/audio/... → 오디오 편집 (볼륨, BGM, 페이드)
app.use('/api/audio', audioRoutes);

// /api/subtitle/... → 자막 입히기
app.use('/api/subtitle', subtitleRoutes);

// ── 헬스체크 엔드포인트 (서버 상태 확인용) ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '0.2.0',
    uptime: Math.floor(process.uptime()),
  });
});

// ── 파일 자동 정리 스케줄러 ──
// 매시간 정각에 실행: 오래된 파일을 자동 삭제하여 디스크 공간 확보
const cleanupHours = parseInt(process.env.FILE_CLEANUP_HOURS) || 24;

cron.schedule('0 * * * *', () => {
  console.log('[CRON] 오래된 파일 정리 시작...');
  cleanOldFiles(uploadsDir, cleanupHours);
  cleanOldFiles(outputsDir, cleanupHours);
});

/**
 * 지정된 폴더에서 오래된 파일을 삭제하는 함수
 * @param {string} dir - 정리할 폴더 경로
 * @param {number} maxAgeHours - 이 시간보다 오래된 파일 삭제 (시간 단위)
 */
function cleanOldFiles(dir, maxAgeHours) {
  try {
    const files = fs.readdirSync(dir);
    const now = Date.now();
    // 밀리초로 변환 (1시간 = 3,600,000밀리초)
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    let deletedCount = 0;

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      // 파일이 오래되었으면 삭제
      if (now - stat.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      console.log(`[CRON] ${dir}에서 ${deletedCount}개 파일 삭제 완료`);
    }
  } catch (err) {
    console.error(`[CRON] 파일 정리 중 오류: ${err.message}`);
  }
}

// ── 전역 에러 핸들러 ──
// 라우트에서 처리하지 못한 에러를 여기서 잡아서 안전하게 응답
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  console.error(err.stack);

  // Multer 파일 크기 초과 에러 처리
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: '파일 크기가 너무 큽니다. 최대 500MB까지 업로드 가능합니다.',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || '서버 내부 오류가 발생했습니다.',
  });
});

// ── 서버 시작 ──
server.listen(PORT, () => {
  console.log('');
  console.log('============================================');
  console.log(`  VELA 영상 편집기 서버 실행 중`);
  console.log(`  포트: ${PORT}`);
  console.log(`  기능: 컷편집 / 오디오편집 / 자막 / 내보내기`);
  console.log(`  파일 자동 정리: ${cleanupHours}시간 이상 된 파일`);
  console.log('============================================');
  console.log('');
});

module.exports = { app, server, io };
