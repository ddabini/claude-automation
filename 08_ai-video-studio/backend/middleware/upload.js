/**
 * ============================================
 * 파일 업로드 미들웨어 (Multer 설정)
 * ============================================
 *
 * Multer는 파일 업로드를 처리하는 미들웨어입니다.
 * 비유: 우체국에서 소포를 받아 정리해주는 직원과 같습니다.
 *
 * 기능:
 * - 업로드된 파일을 uploads/ 폴더에 저장
 * - 파일 크기 제한 (500MB)
 * - 허용된 파일 형식만 통과
 */

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 업로드 파일 저장 경로
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// ── 파일 저장 설정 ──
// 파일을 디스크에 저장하고, 파일 이름이 겹치지 않도록 고유 이름 부여
const storage = multer.diskStorage({
  // 저장 위치 설정
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  // 파일 이름 설정 (원본 확장자 유지 + 고유 ID 추가)
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// ── 파일 형식 필터 ──
// 허용되는 파일 형식을 MIME 타입으로 확인
const fileFilter = (req, file, cb) => {
  // 영상 파일 허용 목록
  const allowedVideoTypes = [
    'video/mp4', 'video/webm', 'video/quicktime', // mp4, webm, mov
    'video/x-msvideo', 'video/x-matroska',         // avi, mkv
  ];

  // 이미지 파일 허용 목록
  const allowedImageTypes = [
    'image/jpeg', 'image/png', 'image/webp',
    'image/gif', 'image/bmp', 'image/tiff',
  ];

  // 오디오 파일 허용 목록
  const allowedAudioTypes = [
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'audio/flac', 'audio/aac', 'audio/mp4',
  ];

  // 자막 파일 허용 목록
  const allowedSubtitleTypes = [
    'application/x-subrip',    // .srt
    'text/plain',              // .txt, .srt (일부 브라우저)
    'text/vtt',                // .vtt
  ];

  const allAllowed = [
    ...allowedVideoTypes,
    ...allowedImageTypes,
    ...allowedAudioTypes,
    ...allowedSubtitleTypes,
  ];

  if (allAllowed.includes(file.mimetype)) {
    // 허용된 형식 → 통과
    cb(null, true);
  } else {
    // 허용되지 않은 형식 → 거부
    cb(new Error(`지원하지 않는 파일 형식입니다: ${file.mimetype}`), false);
  }
};

// ── Multer 인스턴스 생성 ──

// 영상 업로드용 (최대 500MB)
const uploadVideo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
});

// 이미지 업로드용 (최대 50MB)
const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

module.exports = {
  uploadVideo,
  uploadImage,
};
