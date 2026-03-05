/**
 * ============================================
 * 영상 생성 API 라우트
 * ============================================
 *
 * 영상 관련 모든 API 요청을 처리합니다.
 *
 * 엔드포인트:
 * POST /api/video/generate-text   — 텍스트로 영상 생성
 * POST /api/video/generate-image  — 이미지를 영상으로 변환
 * GET  /api/video/status/:jobId   — 작업 상태 조회
 * POST /api/video/export          — 영상 변환/내보내기
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// 서비스 모듈 불러오기
// Replicate API를 통해 Wan 2.1 모델로 영상을 생성합니다
const replicate = require('../services/replicate');
const ffmpegService = require('../services/ffmpeg');
const { uploadImage } = require('../middleware/upload');
const { emitProgress, emitComplete, emitError } = require('../socket');

// ── 활성 작업 목록 (폴링용 상태 저장) ──
const activeJobs = new Map();

/**
 * POST /api/video/generate-text
 * 텍스트 프롬프트로 AI 영상을 생성합니다.
 *
 * 비유: "바닷가에서 석양이 지는 장면"이라고 입력하면
 *       AI가 그에 맞는 영상을 만들어줍니다.
 *
 * 요청 본문:
 * - prompt: 영상 설명 텍스트 (필수)
 * - style: 영상 스타일 ('cinematic', 'anime', 'realistic' 등)
 * - duration: 영상 길이 초 (3~15)
 * - resolution: 해상도 ('720p', '1080p')
 */
router.post('/generate-text', async (req, res) => {
  try {
    const { prompt, style, duration, resolution } = req.body;

    // 필수 입력값 검증
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '영상 설명(prompt)을 입력해주세요.',
      });
    }

    console.log(`[Video] 텍스트→영상 생성 요청: "${prompt.substring(0, 50)}..."`);

    // Replicate에 작업 제출 (Wan 2.1 T2V 모델 사용)
    const { jobId } = await replicate.run({
      type: 'text-to-video',
      prompt: prompt.trim(),
      style: style || 'cinematic',
      duration: Math.min(Math.max(duration || 5, 3), 15), // 3~15초 범위
      resolution: resolution || '720p',
    });

    // 활성 작업 목록에 추가
    activeJobs.set(jobId, {
      type: 'text-to-video',
      prompt,
      status: 'IN_PROGRESS',
      createdAt: Date.now(),
    });

    // 백그라운드에서 상태를 주기적으로 확인하고 Socket.io로 진행률 전송
    pollJobStatus(req.io, jobId);

    // 클라이언트에게 jobId 즉시 반환 (영상 생성은 비동기로 진행)
    res.json({
      success: true,
      jobId,
      message: '영상 생성이 시작되었습니다. WebSocket으로 진행률을 받을 수 있습니다.',
    });
  } catch (err) {
    console.error('[Video] 텍스트→영상 생성 오류:', err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/video/generate-image
 * 이미지를 AI 영상으로 변환합니다.
 *
 * 비유: 정지된 사진에 "생명을 불어넣어" 움직이게 만드는 것
 *
 * 요청: multipart/form-data
 * - image: 이미지 파일 (필수)
 * - motionStyle: 움직임 스타일 ('zoom-in', 'pan', 'orbit' 등)
 * - duration: 영상 길이 초
 */
router.post('/generate-image', uploadImage.single('image'), async (req, res) => {
  try {
    // 업로드된 파일 확인
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '이미지 파일을 업로드해주세요.',
      });
    }

    const { motionStyle, duration } = req.body;

    console.log(`[Video] 이미지→영상 변환 요청: ${req.file.originalname}`);

    // 이미지를 Base64로 인코딩 (Replicate에 data URI로 전송)
    const imageBuffer = fs.readFileSync(req.file.path);
    const imageBase64 = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype;

    // Replicate에 작업 제출 (Wan 2.1 I2V 모델 사용)
    // motionStyle은 replicate.js에서 영어 프롬프트로 자동 변환됩니다
    const { jobId } = await replicate.run({
      type: 'image-to-video',
      image: `data:${mimeType};base64,${imageBase64}`,
      motionStyle: motionStyle || 'zoom-in',
      duration: Math.min(Math.max(duration || 5, 3), 15),
    });

    // 활성 작업 목록에 추가
    activeJobs.set(jobId, {
      type: 'image-to-video',
      originalImage: req.file.originalname,
      status: 'IN_PROGRESS',
      createdAt: Date.now(),
    });

    // 백그라운드 상태 폴링 시작
    pollJobStatus(req.io, jobId);

    res.json({
      success: true,
      jobId,
      message: '이미지→영상 변환이 시작되었습니다.',
    });
  } catch (err) {
    console.error('[Video] 이미지→영상 변환 오류:', err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/video/status/:jobId
 * 영상 생성 작업의 현재 상태를 조회합니다.
 *
 * 비유: "제가 주문한 영상, 지금 어디까지 됐나요?" 하고 확인하는 것
 *
 * 응답:
 * - status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
 * - progress: 0~100 (진행률)
 * - resultUrl: 완료 시 결과 영상 URL
 * - estimatedTime: 남은 예상 시간(초)
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: '작업 ID(jobId)를 입력해주세요.',
      });
    }

    // RunPod에 상태 조회
    const result = await runpod.status(jobId);

    // 완료된 경우 결과 URL 구성
    let resultUrl = null;
    if (result.status === 'COMPLETED' && result.output) {
      resultUrl = result.output.video_url || null;
    }

    res.json({
      success: true,
      jobId,
      status: result.status,
      progress: result.progress || 0,
      resultUrl,
      estimatedTime: result.estimatedTime || null,
      thumbnail: result.output?.thumbnail_url || null,
    });
  } catch (err) {
    console.error('[Video] 상태 조회 오류:', err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/video/export
 * 영상을 원하는 포맷/해상도/비율로 변환합니다.
 *
 * 비유: 영상을 다른 "틀"에 맞게 바꾸는 것
 *       (인스타그램 정사각형, 유튜브 와이드 등)
 *
 * 요청 본문:
 * - videoUrl: 원본 영상 URL 또는 로컬 경로 (필수)
 * - format: 출력 포맷 ('mp4', 'webm', 'mov', 'gif')
 * - resolution: 해상도 ('480p', '720p', '1080p', '4k')
 * - aspectRatio: 화면 비율 ('16:9', '9:16', '1:1', '4:5')
 * - subtitleFile: 자막 파일 경로 (선택)
 */
router.post('/export', async (req, res) => {
  try {
    const { videoUrl, format, resolution, aspectRatio, subtitleFile } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: '영상 URL 또는 경로를 입력해주세요.',
      });
    }

    console.log(`[Video] 영상 변환 요청: format=${format}, res=${resolution}, ratio=${aspectRatio}`);

    // 영상 경로 결정 (URL이면 다운로드, 로컬 경로면 그대로 사용)
    let videoPath = videoUrl;

    // URL인 경우 다운로드
    if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
      const axios = require('axios');
      const { v4: uuidv4 } = require('uuid');
      const downloadPath = path.join(__dirname, '..', 'uploads', `download-${uuidv4()}.mp4`);

      const response = await axios({
        method: 'GET',
        url: videoUrl,
        responseType: 'stream',
        timeout: 60000,
      });

      const writer = fs.createWriteStream(downloadPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      videoPath = downloadPath;
    }

    // /outputs/ 경로인 경우 서버 로컬 경로로 변환
    if (videoPath.startsWith('/outputs/')) {
      videoPath = path.join(__dirname, '..', videoPath);
    }

    // 파일 존재 확인
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        success: false,
        error: '영상 파일을 찾을 수 없습니다.',
      });
    }

    // 자막 파일이 있으면 먼저 자막 입히기
    if (subtitleFile && fs.existsSync(subtitleFile)) {
      console.log('[Video] 자막 입히기 진행 중...');
      videoPath = await ffmpegService.burnSubtitles(videoPath, subtitleFile);
    }

    // 영상 변환 실행
    const outputPath = await ffmpegService.convertFormat(videoPath, {
      format: format || 'mp4',
      resolution: resolution || null,
      aspectRatio: aspectRatio || null,
    });

    // 결과 파일의 URL 경로 생성
    const fileName = path.basename(outputPath);
    const downloadUrl = `/outputs/${fileName}`;

    // 영상 정보 조회
    let videoInfo = null;
    try {
      videoInfo = await ffmpegService.getVideoInfo(outputPath);
    } catch {
      // 정보 조회 실패해도 변환 결과는 반환
    }

    res.json({
      success: true,
      downloadUrl,
      fileName,
      format: format || 'mp4',
      resolution: resolution || 'original',
      aspectRatio: aspectRatio || 'original',
      videoInfo,
    });
  } catch (err) {
    console.error('[Video] 영상 변환 오류:', err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * 백그라운드에서 RunPod 작업 상태를 주기적으로 확인하는 함수
 *
 * 비유: 음식 배달 앱에서 "배달 중..." 상태를 주기적으로 업데이트하는 것처럼,
 *       RunPod의 작업 진행 상황을 확인해서 클라이언트에게 실시간으로 알려줍니다.
 *
 * @param {import('socket.io').Server} io - Socket.io 서버
 * @param {string} jobId - 폴링할 작업 ID
 */
function pollJobStatus(io, jobId) {
  // 1초마다 상태 확인 (Mock 모드에서는 빠른 업데이트)
  const pollInterval = runpod.MOCK_MODE ? 500 : 2000;
  let pollCount = 0;
  const maxPolls = 600; // 최대 폴링 횟수 (약 10~20분)

  const timer = setInterval(async () => {
    try {
      pollCount++;

      // 최대 폴링 횟수 초과 시 타임아웃 처리
      if (pollCount > maxPolls) {
        clearInterval(timer);
        emitError(io, jobId, '작업 시간이 초과되었습니다.');
        activeJobs.delete(jobId);
        return;
      }

      // RunPod에 상태 조회
      const result = await runpod.status(jobId);

      // 진행률 전송
      if (result.status === 'IN_PROGRESS') {
        emitProgress(io, jobId, result.progress || 0, '영상 생성 중...');
      }

      // 완료 시
      if (result.status === 'COMPLETED') {
        clearInterval(timer);
        const resultUrl = result.output?.video_url || null;
        emitComplete(io, jobId, resultUrl);

        // 활성 작업 업데이트
        const job = activeJobs.get(jobId);
        if (job) {
          job.status = 'COMPLETED';
          job.resultUrl = resultUrl;
        }

        console.log(`[Video] 작업 완료: ${jobId}`);
      }

      // 실패 시
      if (result.status === 'FAILED') {
        clearInterval(timer);
        emitError(io, jobId, result.error || '영상 생성에 실패했습니다.');
        activeJobs.delete(jobId);

        console.error(`[Video] 작업 실패: ${jobId}`);
      }
    } catch (err) {
      console.error(`[Video] 폴링 오류 (${jobId}):`, err.message);
      // 일시적 오류는 무시하고 계속 폴링
    }
  }, pollInterval);
}

module.exports = router;
