/**
 * ============================================
 * 영상 편집 API 라우트
 * ============================================
 *
 * 영상 업로드, 메타데이터 조회, 트림(자르기), 내보내기 등
 * 영상 편집의 핵심 API를 처리합니다.
 *
 * 엔드포인트:
 * POST /api/video/upload   — 영상 업로드 + 메타데이터 분석
 * POST /api/video/trim     — 영상 구간 자르기
 * POST /api/video/export   — 영상 포맷/해상도 변환
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// 서비스 모듈
const ffmpegService = require('../services/ffmpeg');
const { uploadVideo } = require('../middleware/upload');

/**
 * POST /api/video/upload
 * 영상을 업로드하고 FFmpeg로 메타데이터를 분석합니다.
 *
 * 응답:
 * - video.fileName: 원본 파일 이름
 * - video.duration: 영상 길이 (초)
 * - video.width/height: 해상도
 * - video.uploadPath: 서버 저장 경로 (이후 API에서 참조)
 */
router.post('/upload', uploadVideo.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '영상 파일을 업로드해주세요.' });
    }

    console.log(`[Video] 영상 업로드: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(1)}MB)`);

    // FFmpeg로 영상 메타데이터 분석
    let videoInfo = {};
    try {
      videoInfo = await ffmpegService.getVideoInfo(req.file.path);
    } catch (err) {
      console.warn('[Video] 메타데이터 분석 실패 (FFmpeg 미설치?):', err.message);
    }

    // 서버 내 상대 경로 (이후 트림/내보내기에서 참조)
    const uploadPath = `/uploads/${req.file.filename}`;

    res.json({
      success: true,
      video: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        duration: videoInfo.duration || 0,
        width: videoInfo.width || 0,
        height: videoInfo.height || 0,
        fps: videoInfo.fps || 0,
        codec: videoInfo.videoCodec || 'unknown',
        uploadPath,
      },
    });
  } catch (err) {
    console.error('[Video] 업로드 오류:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/video/trim
 * 영상의 특정 구간만 잘라냅니다.
 *
 * 요청 본문:
 * - videoPath: 서버 영상 경로 (upload 응답의 uploadPath)
 * - startTime: 시작 시간 (초)
 * - endTime: 끝 시간 (초)
 */
router.post('/trim', async (req, res) => {
  try {
    const { videoPath, startTime, endTime } = req.body;

    if (!videoPath) {
      return res.status(400).json({ success: false, error: '영상 경로를 입력해주세요.' });
    }
    if (startTime === undefined || endTime === undefined) {
      return res.status(400).json({ success: false, error: '시작/끝 시간을 입력해주세요.' });
    }

    // 서버 로컬 경로로 변환
    const fullPath = path.join(__dirname, '..', videoPath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: '영상 파일을 찾을 수 없습니다.' });
    }

    console.log(`[Video] 트림 요청: ${startTime}초 ~ ${endTime}초`);

    // FFmpeg로 트림 실행
    const outputPath = await ffmpegService.trimVideo(fullPath, startTime, endTime);
    const fileName = path.basename(outputPath);

    res.json({
      success: true,
      downloadUrl: `/outputs/${fileName}`,
      fileName,
    });
  } catch (err) {
    console.error('[Video] 트림 오류:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/video/export
 * 영상을 원하는 포맷/해상도/비율로 변환합니다.
 */
router.post('/export', async (req, res) => {
  try {
    const { videoPath, format, resolution, aspectRatio } = req.body;

    if (!videoPath) {
      return res.status(400).json({ success: false, error: '영상 경로를 입력해주세요.' });
    }

    const fullPath = path.join(__dirname, '..', videoPath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: '영상 파일을 찾을 수 없습니다.' });
    }

    console.log(`[Video] 내보내기: format=${format}, resolution=${resolution}, ratio=${aspectRatio}`);

    const outputPath = await ffmpegService.convertFormat(fullPath, {
      format: format || 'mp4',
      resolution: resolution || null,
      aspectRatio: aspectRatio || null,
    });

    const fileName = path.basename(outputPath);

    res.json({
      success: true,
      downloadUrl: `/outputs/${fileName}`,
      fileName,
    });
  } catch (err) {
    console.error('[Video] 내보내기 오류:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
