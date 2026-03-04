/**
 * ============================================
 * 자막 API 라우트
 * ============================================
 *
 * 자막 관련 모든 API 요청을 처리합니다.
 *
 * 엔드포인트:
 * POST /api/subtitle/generate — 영상에서 자막 자동 생성 (음성 인식)
 * POST /api/subtitle/burn     — 자막을 영상에 하드코딩
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// 서비스 모듈 불러오기
const whisperService = require('../services/whisper');
const ffmpegService = require('../services/ffmpeg');
const { uploadVideo } = require('../middleware/upload');

/**
 * POST /api/subtitle/generate
 * 영상 파일에서 음성을 인식하여 자막을 자동 생성합니다.
 *
 * 비유: AI가 영상을 "듣고" 받아쓰기를 해주는 것
 *
 * 요청: multipart/form-data
 * - video: 영상 파일 (필수)
 * - language: 언어 코드 (선택, 기본: 'ko')
 * - model: Whisper 모델 크기 (선택, 기본: 'base')
 *
 * 응답:
 * - subtitles: [{ start, end, text }] — 자막 데이터 배열
 * - srtUrl: SRT 파일 다운로드 URL
 */
router.post('/generate', uploadVideo.single('video'), async (req, res) => {
  let audioPath = null;

  try {
    // 업로드된 파일 확인
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '영상 파일을 업로드해주세요.',
      });
    }

    const { language, model } = req.body;
    const videoPath = req.file.path;

    console.log(`[Subtitle] 자막 생성 요청: ${req.file.originalname} (언어: ${language || 'ko'})`);

    // 1단계: 영상에서 오디오 추출
    //   영상 파일에서 소리 부분만 따로 떼어냅니다.
    //   Whisper는 오디오 파일만 처리할 수 있기 때문입니다.
    console.log('[Subtitle] 1단계: 오디오 추출 중...');
    audioPath = await ffmpegService.extractAudio(videoPath);

    // 2단계: Whisper로 음성 인식
    //   추출된 오디오를 AI가 듣고 텍스트로 변환합니다.
    console.log('[Subtitle] 2단계: 음성 인식 중...');
    const subtitles = await whisperService.transcribe(audioPath, {
      language: language || undefined,
      model: model || undefined,
    });

    // 빈 결과 확인
    if (!subtitles || subtitles.length === 0) {
      return res.json({
        success: true,
        subtitles: [],
        srtUrl: null,
        message: '인식된 음성이 없습니다. 영상에 음성이 포함되어 있는지 확인해주세요.',
      });
    }

    // 3단계: SRT 파일 저장
    //   인식된 자막을 표준 SRT 형식의 파일로 저장합니다.
    console.log('[Subtitle] 3단계: SRT 파일 생성 중...');
    const srtPath = whisperService.saveSRT(subtitles);
    const srtFileName = path.basename(srtPath);

    console.log(`[Subtitle] 자막 생성 완료: ${subtitles.length}개 구간`);

    res.json({
      success: true,
      subtitles,
      srtUrl: `/outputs/${srtFileName}`,
      srtPath,  // 서버 내부 경로 (자막 입히기에 사용)
      totalSegments: subtitles.length,
    });
  } catch (err) {
    console.error('[Subtitle] 자막 생성 오류:', err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    // 임시 오디오 파일 정리
    if (audioPath && fs.existsSync(audioPath)) {
      try {
        fs.unlinkSync(audioPath);
      } catch {}
    }
  }
});

/**
 * POST /api/subtitle/burn
 * 자막을 영상에 직접 입히기 (하드코딩)
 *
 * 비유: 영상 위에 자막을 "인쇄"해서 항상 보이게 만드는 것
 *       (유튜브 CC 자막과 달리, 켜고 끌 수 없음)
 *
 * 요청 본문:
 * - videoPath: 영상 파일 경로 (필수)
 * - subtitles: [{ start, end, text }] — 자막 데이터 배열 (srtPath가 없을 때)
 * - srtPath: SRT 파일 경로 (subtitles 대신 사용 가능)
 * - fontFamily: 글꼴 이름 (선택)
 * - fontSize: 글자 크기 (선택)
 *
 * 응답:
 * - downloadUrl: 자막이 입혀진 영상 다운로드 URL
 */
router.post('/burn', async (req, res) => {
  try {
    const { videoPath, subtitles, srtPath, fontFamily, fontSize } = req.body;

    // 필수 입력값 검증
    if (!videoPath) {
      return res.status(400).json({
        success: false,
        error: '영상 파일 경로(videoPath)를 입력해주세요.',
      });
    }

    if (!subtitles && !srtPath) {
      return res.status(400).json({
        success: false,
        error: '자막 데이터(subtitles) 또는 SRT 파일 경로(srtPath)를 입력해주세요.',
      });
    }

    // 영상 파일 존재 확인
    const resolvedVideoPath = videoPath.startsWith('/outputs/')
      ? path.join(__dirname, '..', videoPath)
      : videoPath;

    if (!fs.existsSync(resolvedVideoPath)) {
      return res.status(404).json({
        success: false,
        error: '영상 파일을 찾을 수 없습니다.',
      });
    }

    console.log('[Subtitle] 자막 입히기 요청');

    // SRT 파일 경로 결정
    let finalSrtPath = srtPath;

    // SRT 파일이 없고 자막 데이터가 있으면 SRT 파일 생성
    if (!finalSrtPath && subtitles && subtitles.length > 0) {
      finalSrtPath = whisperService.saveSRT(subtitles);
    }

    if (!finalSrtPath || !fs.existsSync(finalSrtPath)) {
      return res.status(400).json({
        success: false,
        error: 'SRT 자막 파일을 생성하거나 찾을 수 없습니다.',
      });
    }

    // FFmpeg로 자막 입히기 실행
    const outputPath = await ffmpegService.burnSubtitles(
      resolvedVideoPath,
      finalSrtPath,
      {
        fontFamily: fontFamily || 'NanumGothic',
        fontSize: fontSize || 24,
      }
    );

    const fileName = path.basename(outputPath);

    console.log(`[Subtitle] 자막 입히기 완료: ${fileName}`);

    res.json({
      success: true,
      downloadUrl: `/outputs/${fileName}`,
      fileName,
    });
  } catch (err) {
    console.error('[Subtitle] 자막 입히기 오류:', err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
