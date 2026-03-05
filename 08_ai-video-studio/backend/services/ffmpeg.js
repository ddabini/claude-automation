/**
 * ============================================
 * FFmpeg 영상 처리 서비스
 * ============================================
 *
 * FFmpeg는 영상/음성 파일을 변환·편집하는 도구입니다.
 * 이 서비스는 FFmpeg를 Node.js에서 쉽게 사용할 수 있게 감싸줍니다.
 *
 * 주요 기능:
 * - 영상에서 오디오만 추출 (자막 생성용)
 * - 자막을 영상에 직접 입히기 (하드코딩)
 * - 영상 포맷/해상도 변환
 * - 썸네일 생성
 */

const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 출력 파일 저장 경로
const OUTPUTS_DIR = path.join(__dirname, '..', 'outputs');

/**
 * FFmpeg가 설치되어 있는지 확인
 * @returns {Promise<boolean>}
 */
function checkFFmpegInstalled() {
  return new Promise((resolve) => {
    ffmpeg.getAvailableFormats((err) => {
      if (err) {
        console.warn('[FFmpeg] FFmpeg가 설치되지 않았거나 PATH에 없습니다:', err.message);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * 영상에서 오디오만 추출하는 함수
 *
 * 비유: 동영상에서 "소리 부분"만 따로 떼어내는 것
 *       (자막 생성을 위해 음성만 필요할 때 사용)
 *
 * @param {string} videoPath - 원본 영상 파일 경로
 * @returns {Promise<string>} 추출된 오디오 파일 경로 (.wav)
 */
async function extractAudio(videoPath) {
  const isInstalled = await checkFFmpegInstalled();
  if (!isInstalled) {
    throw new Error('FFmpeg가 설치되지 않았습니다. brew install ffmpeg 으로 설치해주세요.');
  }

  // 출력 파일 이름 생성 (겹치지 않도록 고유 ID 사용)
  const outputFileName = `audio-${uuidv4()}.wav`;
  const outputPath = path.join(OUTPUTS_DIR, outputFileName);

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      // 오디오 코덱: PCM 16bit (Whisper가 선호하는 형식)
      .audioCodec('pcm_s16le')
      // 샘플링 속도: 16kHz (음성 인식에 적합)
      .audioFrequency(16000)
      // 모노 채널 (음성 인식에는 모노면 충분)
      .audioChannels(1)
      // 영상은 제외하고 오디오만 추출
      .noVideo()
      .output(outputPath)
      .on('start', (cmd) => {
        console.log(`[FFmpeg] 오디오 추출 시작: ${cmd}`);
      })
      .on('end', () => {
        console.log(`[FFmpeg] 오디오 추출 완료: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`[FFmpeg] 오디오 추출 실패: ${err.message}`);
        reject(new Error(`오디오 추출 실패: ${err.message}`));
      })
      .run();
  });
}

/**
 * 자막을 영상에 내장하는 함수 (소프트 자막)
 *
 * 비유: 영상에 자막 트랙을 넣어두는 것
 *       (유튜브 CC 자막처럼 플레이어에서 켜고 끌 수 있음)
 *       재인코딩이 필요 없어서 매우 빠름
 *
 * @param {string} videoPath - 원본 영상 파일 경로
 * @param {string} srtPath - SRT 자막 파일 경로
 * @param {object} [options] - 자막 옵션 (현재 미사용, 향후 확장용)
 * @returns {Promise<string>} 자막이 내장된 영상 파일 경로
 */
async function burnSubtitles(videoPath, srtPath, options = {}) {
  const isInstalled = await checkFFmpegInstalled();
  if (!isInstalled) {
    throw new Error('FFmpeg가 설치되지 않았습니다. brew install ffmpeg 으로 설치해주세요.');
  }

  const outputFileName = `subtitled-${uuidv4()}.mp4`;
  const outputPath = path.join(OUTPUTS_DIR, outputFileName);

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      // SRT 파일을 두 번째 입력으로 추가
      .input(srtPath)
      // 영상과 오디오는 그대로 복사 (재인코딩 없음 → 빠름)
      .videoCodec('copy')
      .audioCodec('copy')
      // 자막 코덱: mov_text (MP4 컨테이너에서 사용하는 자막 형식)
      .outputOptions([
        '-c:s mov_text',
        '-metadata:s:s:0 language=kor',
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log(`[FFmpeg] 자막 입히기 시작: ${cmd}`);
      })
      .on('end', () => {
        console.log(`[FFmpeg] 자막 입히기 완료: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`[FFmpeg] 자막 입히기 실패: ${err.message}`);
        reject(new Error(`자막 입히기 실패: ${err.message}`));
      })
      .run();
  });
}

/**
 * 영상 포맷/해상도/비율을 변환하는 함수
 *
 * 비유: 사진을 다른 크기나 형식으로 변환하는 것처럼,
 *       영상도 다른 해상도나 형식으로 바꿀 수 있습니다.
 *
 * @param {string} videoPath - 원본 영상 파일 경로
 * @param {object} options - 변환 설정
 * @param {string} [options.format] - 출력 포맷 (mp4, webm, mov, gif)
 * @param {string} [options.resolution] - 해상도 ('1080p', '720p', '480p', '4k')
 * @param {string} [options.aspectRatio] - 화면 비율 ('16:9', '9:16', '1:1', '4:5')
 * @returns {Promise<string>} 변환된 영상 파일 경로
 */
async function convertFormat(videoPath, options = {}) {
  const isInstalled = await checkFFmpegInstalled();
  if (!isInstalled) {
    throw new Error('FFmpeg가 설치되지 않았습니다. brew install ffmpeg 으로 설치해주세요.');
  }

  const { format = 'mp4', resolution, aspectRatio } = options;

  const outputFileName = `converted-${uuidv4()}.${format}`;
  const outputPath = path.join(OUTPUTS_DIR, outputFileName);

  // 해상도를 픽셀 크기로 변환하는 매핑
  const resolutionMap = {
    '480p': { width: 854, height: 480 },
    '720p': { width: 1280, height: 720 },
    '1080p': { width: 1920, height: 1080 },
    '4k': { width: 3840, height: 2160 },
  };

  return new Promise((resolve, reject) => {
    let command = ffmpeg(videoPath);

    // 비디오 필터 목록 (필요한 것만 추가)
    const filters = [];

    // 해상도 변환이 요청된 경우
    if (resolution && resolutionMap[resolution]) {
      const { width, height } = resolutionMap[resolution];
      // scale 필터: -2는 비율 유지하면서 짝수 값으로 맞춤
      filters.push(`scale=${width}:-2`);
    }

    // 화면 비율 변환이 요청된 경우 (패딩 추가 방식)
    if (aspectRatio) {
      // 비율을 숫자로 변환 (예: '16:9' → 16/9)
      const [w, h] = aspectRatio.split(':').map(Number);
      const ratio = w / h;

      // 원하는 비율에 맞게 패딩(여백) 추가
      // pad 필터: 원본 영상 주변에 검은색 여백을 넣어서 비율 맞춤
      filters.push(
        `pad=iw:iw/${ratio}:(ow-iw)/2:(oh-ih)/2:black`
      );
    }

    // 비디오 필터 적용
    if (filters.length > 0) {
      command = command.videoFilters(filters);
    }

    // 포맷별 코덱 설정
    if (format === 'webm') {
      command = command.videoCodec('libvpx-vp9').audioCodec('libopus');
    } else if (format === 'gif') {
      // GIF는 오디오 없음
      command = command.noAudio();
    } else {
      // MP4, MOV: H.264 + AAC (가장 호환성 좋은 조합)
      command = command.videoCodec('libx264').audioCodec('aac');
    }

    command
      .output(outputPath)
      .on('start', (cmd) => {
        console.log(`[FFmpeg] 변환 시작: ${cmd}`);
      })
      .on('end', () => {
        console.log(`[FFmpeg] 변환 완료: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`[FFmpeg] 변환 실패: ${err.message}`);
        reject(new Error(`영상 변환 실패: ${err.message}`));
      })
      .run();
  });
}

/**
 * 영상에서 썸네일(대표 이미지)을 생성하는 함수
 *
 * 비유: 영상의 "표지 사진"을 만드는 것
 *
 * @param {string} videoPath - 영상 파일 경로
 * @param {string} [timestamp] - 캡처할 시간 위치 (기본: '00:00:01', 1초 지점)
 * @returns {Promise<string>} 썸네일 이미지 파일 경로 (.png)
 */
async function generateThumbnail(videoPath, timestamp = '00:00:01') {
  const isInstalled = await checkFFmpegInstalled();
  if (!isInstalled) {
    throw new Error('FFmpeg가 설치되지 않았습니다. brew install ffmpeg 으로 설치해주세요.');
  }

  const outputFileName = `thumb-${uuidv4()}.png`;
  const outputPath = path.join(OUTPUTS_DIR, outputFileName);

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      // 특정 시간 지점으로 이동
      .seekInput(timestamp)
      // 1프레임만 캡처
      .frames(1)
      .output(outputPath)
      .on('start', (cmd) => {
        console.log(`[FFmpeg] 썸네일 생성 시작: ${cmd}`);
      })
      .on('end', () => {
        console.log(`[FFmpeg] 썸네일 생성 완료: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`[FFmpeg] 썸네일 생성 실패: ${err.message}`);
        reject(new Error(`썸네일 생성 실패: ${err.message}`));
      })
      .run();
  });
}

/**
 * 영상 파일의 메타데이터(정보)를 조회하는 함수
 *
 * @param {string} videoPath - 영상 파일 경로
 * @returns {Promise<object>} 영상 정보 (길이, 해상도, 코덱 등)
 */
async function getVideoInfo(videoPath) {
  const isInstalled = await checkFFmpegInstalled();
  if (!isInstalled) {
    throw new Error('FFmpeg가 설치되지 않았습니다. brew install ffmpeg 으로 설치해주세요.');
  }

  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(new Error(`영상 정보 조회 실패: ${err.message}`));
        return;
      }

      // 영상 스트림과 오디오 스트림 찾기
      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

      resolve({
        duration: metadata.format.duration,          // 영상 길이 (초)
        size: metadata.format.size,                   // 파일 크기 (바이트)
        format: metadata.format.format_name,          // 파일 포맷
        width: videoStream ? videoStream.width : null, // 가로 해상도
        height: videoStream ? videoStream.height : null, // 세로 해상도
        videoCodec: videoStream ? videoStream.codec_name : null,  // 영상 코덱
        audioCodec: audioStream ? audioStream.codec_name : null,  // 오디오 코덱
        fps: videoStream ? eval(videoStream.r_frame_rate) : null, // 초당 프레임 수
      });
    });
  });
}

/**
 * 영상의 특정 구간만 잘라내는 함수 (트림/컷 편집)
 *
 * 비유: 긴 영상에서 원하는 부분만 "가위로 오려내는" 것
 *
 * @param {string} videoPath - 원본 영상 파일 경로
 * @param {number} startTime - 시작 시간 (초)
 * @param {number} endTime - 끝 시간 (초)
 * @returns {Promise<string>} 잘라낸 영상 파일 경로
 */
async function trimVideo(videoPath, startTime, endTime) {
  const isInstalled = await checkFFmpegInstalled();
  if (!isInstalled) {
    throw new Error('FFmpeg가 설치되지 않았습니다. brew install ffmpeg 으로 설치해주세요.');
  }

  const outputFileName = `trimmed-${uuidv4()}.mp4`;
  const outputPath = path.join(OUTPUTS_DIR, outputFileName);

  // 구간 길이 계산
  const duration = endTime - startTime;

  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      // 시작 지점으로 이동 (입력 단계에서 시크 → 빠름)
      .setStartTime(startTime)
      // 잘라낼 구간 길이 설정
      .setDuration(duration)
      // 영상/오디오 코덱을 copy로 설정 (재인코딩 안 함 → 매우 빠름)
      .videoCodec('copy')
      .audioCodec('copy')
      .output(outputPath)
      .on('start', (cmd) => {
        console.log(`[FFmpeg] 트림 시작: ${cmd}`);
      })
      .on('end', () => {
        console.log(`[FFmpeg] 트림 완료: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`[FFmpeg] 트림 실패: ${err.message}`);
        reject(new Error(`영상 트림 실패: ${err.message}`));
      })
      .run();
  });
}

/**
 * 영상의 오디오를 편집하는 함수
 *
 * 볼륨 조절, BGM 추가, 페이드 인/아웃 효과를 적용합니다.
 *
 * 비유: 영상의 소리를 크게/작게 만들거나,
 *       배경 음악을 깔고, 시작/끝에 서서히 소리가 커지거나 작아지게 만드는 것
 *
 * @param {string} videoPath - 원본 영상 파일 경로
 * @param {object} options - 오디오 편집 설정
 * @param {number} [options.volume] - 원본 볼륨 (0~200, 100이 기본)
 * @param {string} [options.bgmPath] - BGM 오디오 파일 경로
 * @param {number} [options.bgmVolume] - BGM 볼륨 (0~100, 50이 기본)
 * @param {number} [options.fadeIn] - 페이드 인 시간 (초)
 * @param {number} [options.fadeOut] - 페이드 아웃 시간 (초)
 * @returns {Promise<string>} 편집된 영상 파일 경로
 */
async function editAudio(videoPath, options = {}) {
  const isInstalled = await checkFFmpegInstalled();
  if (!isInstalled) {
    throw new Error('FFmpeg가 설치되지 않았습니다. brew install ffmpeg 으로 설치해주세요.');
  }

  const {
    volume = 100,
    bgmPath = null,
    bgmVolume = 50,
    fadeIn = 0,
    fadeOut = 0,
  } = options;

  const outputFileName = `audio-edited-${uuidv4()}.mp4`;
  const outputPath = path.join(OUTPUTS_DIR, outputFileName);

  // 영상 정보 가져오기 (페이드 아웃 시작 시점 계산용)
  let videoDuration = 0;
  try {
    const info = await getVideoInfo(videoPath);
    videoDuration = info.duration || 0;
  } catch (e) {
    console.warn('[FFmpeg] 영상 정보 조회 실패, 페이드 아웃 미적용:', e.message);
  }

  return new Promise((resolve, reject) => {
    let command = ffmpeg(videoPath);

    // BGM 파일이 있으면 두 번째 입력으로 추가
    if (bgmPath && fs.existsSync(bgmPath)) {
      command = command.input(bgmPath);
    }

    // 오디오 필터 체인 구성
    // FFmpeg의 복합 필터(complex filter)를 사용해서 여러 효과를 한번에 적용
    const complexFilters = [];

    // 원본 오디오 볼륨 조절 (100 = 원본, 50 = 절반, 200 = 두 배)
    const volumeRatio = volume / 100;
    let mainAudioLabel = '[0:a]'; // 첫 번째 입력의 오디오 스트림

    // 볼륨 조절 필터
    let currentLabel = 'volout';
    complexFilters.push(`${mainAudioLabel}volume=${volumeRatio}[${currentLabel}]`);

    // 페이드 인 효과 (소리가 서서히 커짐)
    if (fadeIn > 0) {
      const prevLabel = currentLabel;
      currentLabel = 'fadein';
      complexFilters.push(`[${prevLabel}]afade=t=in:st=0:d=${fadeIn}[${currentLabel}]`);
    }

    // 페이드 아웃 효과 (소리가 서서히 작아짐)
    if (fadeOut > 0 && videoDuration > 0) {
      const fadeOutStart = videoDuration - fadeOut;
      const prevLabel = currentLabel;
      currentLabel = 'fadeout';
      complexFilters.push(`[${prevLabel}]afade=t=out:st=${fadeOutStart}:d=${fadeOut}[${currentLabel}]`);
    }

    // BGM 믹싱 (원본 오디오 + BGM을 하나로 합침)
    if (bgmPath && fs.existsSync(bgmPath)) {
      const bgmVolumeRatio = bgmVolume / 100;
      const prevLabel = currentLabel;
      currentLabel = 'final';
      // BGM 볼륨 조절 후 원본 오디오와 합침
      complexFilters.push(`[1:a]volume=${bgmVolumeRatio}[bgm]`);
      complexFilters.push(
        `[${prevLabel}][bgm]amix=inputs=2:duration=first:dropout_transition=2[${currentLabel}]`
      );
    }

    // 복합 필터 적용
    command = command
      .complexFilter(complexFilters, currentLabel)
      .videoCodec('copy') // 영상은 그대로 복사 (빠름)
      .audioCodec('aac')  // 오디오만 재인코딩
      .output(outputPath)
      .on('start', (cmd) => {
        console.log(`[FFmpeg] 오디오 편집 시작: ${cmd}`);
      })
      .on('end', () => {
        console.log(`[FFmpeg] 오디오 편집 완료: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`[FFmpeg] 오디오 편집 실패: ${err.message}`);
        reject(new Error(`오디오 편집 실패: ${err.message}`));
      });

    command.run();
  });
}

module.exports = {
  extractAudio,
  burnSubtitles,
  convertFormat,
  generateThumbnail,
  getVideoInfo,
  checkFFmpegInstalled,
  trimVideo,
  editAudio,
};
