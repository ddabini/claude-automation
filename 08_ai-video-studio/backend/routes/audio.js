/**
 * ============================================
 * 오디오 편집 API 라우트
 * ============================================
 *
 * 영상의 오디오를 편집합니다.
 *
 * 엔드포인트:
 * POST /api/audio/edit — 볼륨 조절, BGM 추가, 페이드 인/아웃
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const ffmpegService = require('../services/ffmpeg');
const { uploadVideo } = require('../middleware/upload');

/**
 * POST /api/audio/edit
 * 영상의 오디오를 편집합니다.
 *
 * multipart/form-data:
 * - videoPath: 서버 영상 경로
 * - volume: 원본 볼륨 (0~200, 100이 기본)
 * - bgm: BGM 오디오 파일 (선택)
 * - bgmVolume: BGM 볼륨 (0~100, 50이 기본)
 * - fadeIn: 페이드 인 시간 (초, 0이면 없음)
 * - fadeOut: 페이드 아웃 시간 (초, 0이면 없음)
 */
router.post('/edit', uploadVideo.single('bgm'), async (req, res) => {
  try {
    const { videoPath, volume, bgmVolume, fadeIn, fadeOut } = req.body;

    if (!videoPath) {
      return res.status(400).json({ success: false, error: '영상 경로를 입력해주세요.' });
    }

    // 서버 로컬 경로로 변환
    const fullVideoPath = path.join(__dirname, '..', videoPath);
    if (!fs.existsSync(fullVideoPath)) {
      return res.status(404).json({ success: false, error: '영상 파일을 찾을 수 없습니다.' });
    }

    // BGM 파일 경로 (업로드된 경우)
    const bgmPath = req.file ? req.file.path : null;

    console.log(`[Audio] 편집 요청: volume=${volume}%, bgm=${bgmPath ? 'Y' : 'N'}, fade=${fadeIn}/${fadeOut}`);

    const outputPath = await ffmpegService.editAudio(fullVideoPath, {
      volume: parseFloat(volume) || 100,
      bgmPath,
      bgmVolume: parseFloat(bgmVolume) || 50,
      fadeIn: parseFloat(fadeIn) || 0,
      fadeOut: parseFloat(fadeOut) || 0,
    });

    const fileName = path.basename(outputPath);

    res.json({
      success: true,
      downloadUrl: `/outputs/${fileName}`,
      fileName,
    });
  } catch (err) {
    console.error('[Audio] 편집 오류:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
