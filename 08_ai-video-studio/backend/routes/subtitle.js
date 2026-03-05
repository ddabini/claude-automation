/**
 * ============================================
 * 자막 API 라우트
 * ============================================
 *
 * 자막을 영상에 직접 입히는(하드코딩) API를 처리합니다.
 *
 * 엔드포인트:
 * POST /api/subtitle/burn — 자막 데이터를 영상에 하드코딩
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 서비스 모듈 불러오기
const ffmpegService = require('../services/ffmpeg');

// 출력 파일 저장 경로
const OUTPUTS_DIR = path.join(__dirname, '..', 'outputs');

/**
 * 초 단위 시간을 SRT 타임스탬프 형식으로 변환
 * 예: 90.5 → '00:01:30,500'
 */
function secondsToSRT(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds % 1) * 1000);

  return (
    String(hours).padStart(2, '0') + ':' +
    String(minutes).padStart(2, '0') + ':' +
    String(seconds).padStart(2, '0') + ',' +
    String(milliseconds).padStart(3, '0')
  );
}

/**
 * 자막 배열을 SRT 파일로 저장
 * @param {Array<{ start: number, end: number, text: string }>} subtitles
 * @returns {string} 생성된 SRT 파일 경로
 */
function saveSRT(subtitles) {
  const outputFileName = `subtitle-${uuidv4()}.srt`;
  const outputPath = path.join(OUTPUTS_DIR, outputFileName);

  // SRT 형식으로 변환
  const srtContent = subtitles
    .map((seg, i) => {
      const startTime = secondsToSRT(seg.start);
      const endTime = secondsToSRT(seg.end);
      return `${i + 1}\n${startTime} --> ${endTime}\n${seg.text}\n`;
    })
    .join('\n');

  fs.writeFileSync(outputPath, srtContent, 'utf-8');
  console.log(`[Subtitle] SRT 파일 저장: ${outputPath}`);

  return outputPath;
}

/**
 * POST /api/subtitle/burn
 * 자막을 영상에 직접 입히기 (하드코딩)
 *
 * 비유: 영상 위에 자막을 "인쇄"해서 항상 보이게 만드는 것
 *
 * 요청 본문:
 * - videoPath: 영상 파일 경로 (필수)
 * - subtitles: [{ start, end, text }] — 자막 데이터 배열
 * - fontFamily: 글꼴 이름 (선택)
 * - fontSize: 글자 크기 (선택)
 *
 * 응답:
 * - downloadUrl: 자막이 입혀진 영상 다운로드 URL
 */
router.post('/burn', async (req, res) => {
  try {
    const { videoPath, subtitles, fontFamily, fontSize } = req.body;

    // 필수 입력값 검증
    if (!videoPath) {
      return res.status(400).json({
        success: false,
        error: '영상 파일 경로(videoPath)를 입력해주세요.',
      });
    }

    if (!subtitles || subtitles.length === 0) {
      return res.status(400).json({
        success: false,
        error: '자막 데이터(subtitles)를 입력해주세요.',
      });
    }

    // 영상 파일 존재 확인 (서버 내부 상대 경로를 절대 경로로 변환)
    const resolvedVideoPath = path.join(__dirname, '..', videoPath);

    if (!fs.existsSync(resolvedVideoPath)) {
      return res.status(404).json({
        success: false,
        error: '영상 파일을 찾을 수 없습니다.',
      });
    }

    console.log(`[Subtitle] 자막 입히기 요청: ${subtitles.length}개 구간`);

    // 자막 데이터를 SRT 파일로 변환
    const srtPath = saveSRT(subtitles);

    // FFmpeg로 자막 입히기 실행
    const outputPath = await ffmpegService.burnSubtitles(
      resolvedVideoPath,
      srtPath,
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
