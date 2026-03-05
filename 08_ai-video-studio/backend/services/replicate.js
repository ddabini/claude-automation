/**
 * ============================================
 * Replicate API 연동 서비스
 * ============================================
 *
 * Replicate는 AI 모델을 클라우드에서 실행할 수 있는 서비스입니다.
 * Wan 2.1 (텍스트→영상, 이미지→영상) 모델을 Replicate를 통해 사용합니다.
 *
 * 장점:
 * - GPU 인프라 구축 불필요 (API 키만 있으면 됨)
 * - 사용한 만큼만 과금 (영상 1개당 약 $0.05~0.20)
 * - Wan 2.1 동일 모델 — RunPod과 같은 품질
 *
 * MOCK_MODE=true일 때는 Replicate 없이 가짜 응답으로 테스트할 수 있습니다.
 */

const axios = require('axios');

// ── Replicate API 설정 ──
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_BASE_URL = 'https://api.replicate.com/v1';

// ── 모델 이름 설정 (환경변수로 변경 가능) ──
// Replicate에서 모델 이름은 "소유자/모델명" 형식
const T2V_MODEL = process.env.REPLICATE_T2V_MODEL || 'wavespeedai/wan-2.1-t2v-480p';
const I2V_MODEL = process.env.REPLICATE_I2V_MODEL || 'wavespeedai/wan-2.1-i2v-480p';

// ── Mock 모드 여부 ──
const MOCK_MODE = process.env.MOCK_MODE === 'true';

// ── Mock 작업 상태 저장소 ──
const mockJobs = new Map();

// ── 모션 스타일을 영어 프롬프트로 변환하는 사전 ──
// Wan 2.1 I2V 모델은 어떤 움직임을 만들지 영어 프롬프트로 알려줘야 합니다
const MOTION_PROMPTS = {
  'zoom-in': 'The camera slowly zooms in toward the subject, smooth cinematic motion, steady movement',
  'zoom-out': 'The camera gradually pulls back, revealing more of the scene, smooth steady zoom out',
  'pan-left': 'The camera pans smoothly from right to left across the scene, steady horizontal movement',
  'pan-right': 'The camera pans smoothly from left to right across the scene, steady horizontal movement',
  'cinematic-float': 'Gentle floating camera movement with subtle drift, dreamy cinematic atmosphere, soft motion',
};

// ── 스타일별 프롬프트 접두사 ──
// 텍스트→영상 생성 시 선택한 스타일에 맞는 영상을 만들기 위한 키워드
const STYLE_PREFIXES = {
  cinematic: 'Cinematic film style, dramatic lighting, shallow depth of field, movie-like atmosphere. ',
  vlog: 'Vlog style, natural daylight, handheld camera feel, casual warm tone. ',
  animation: 'High quality 3D animation style, vibrant colors, smooth motion, Pixar-like quality. ',
  commercial: 'Premium commercial advertisement style, polished and sleek, professional lighting. ',
  news: 'News broadcast style, clean and informative, professional framing, neutral tones. ',
};

/**
 * Replicate에 AI 영상 생성 작업을 제출하는 함수
 *
 * 비유: 영상 제작 의뢰서를 보내고 접수 번호를 받는 것
 *
 * @param {object} input - 영상 생성에 필요한 정보
 * @param {string} input.type - 생성 유형 ('text-to-video' 또는 'image-to-video')
 * @param {string} [input.prompt] - 영상 설명 텍스트
 * @param {string} [input.image] - Base64 이미지 (data URI 형식, I2V용)
 * @param {string} [input.style] - 영상 스타일 (T2V용)
 * @param {string} [input.motionStyle] - 모션 스타일 (I2V용)
 * @param {number} [input.duration] - 영상 길이(초)
 * @param {string} [input.resolution] - 해상도 (T2V용)
 * @returns {Promise<{ jobId: string }>} 작업 ID
 */
async function run(input) {
  // ── Mock 모드: Replicate 없이 테스트 ──
  if (MOCK_MODE) {
    return runMock(input);
  }

  // ── 실제 Replicate API 호출 ──
  if (!REPLICATE_API_TOKEN) {
    throw new Error(
      'Replicate API 토큰이 없습니다. .env 파일에 REPLICATE_API_TOKEN을 설정하거나, MOCK_MODE=true로 테스트하세요.\n' +
      'Replicate 가입: https://replicate.com → API tokens에서 발급'
    );
  }

  try {
    const { type } = input;
    let model, predictionInput;

    if (type === 'text-to-video') {
      // ── 텍스트→영상 ──
      model = T2V_MODEL;

      // 스타일 접두사를 프롬프트 앞에 추가
      const stylePrefix = STYLE_PREFIXES[input.style] || '';
      const fullPrompt = stylePrefix + input.prompt;

      // Replicate Wan 2.1 T2V 파라미터
      // guide_scale: 프롬프트를 얼마나 충실히 따를지 (낮을수록 자연스러움)
      // shift: 노이즈 스케줄링 (낮을수록 현실적)
      predictionInput = {
        prompt: fullPrompt,
        guide_scale: 5.0,
        shift: 5.0,
        steps: 30,
      };
    } else if (type === 'image-to-video') {
      // ── 이미지→영상 ──
      model = I2V_MODEL;

      // 모션 스타일을 영어 프롬프트로 변환
      const motionPrompt = MOTION_PROMPTS[input.motionStyle] || MOTION_PROMPTS['zoom-in'];

      // Replicate Wan 2.1 I2V 파라미터
      // image: 원본 이미지 (data URI 또는 URL)
      // prompt: 어떤 움직임을 만들지 설명
      predictionInput = {
        image: input.image, // data:image/...;base64,... 형식
        prompt: motionPrompt,
        guide_scale: 4.0,  // I2V에서는 낮은 값이 더 자연스러움
        shift: 2.0,
        steps: 30,
      };
    } else {
      throw new Error(`지원하지 않는 생성 유형: ${type}`);
    }

    console.log(`[Replicate] 작업 제출: model=${model}, type=${type}`);

    // Replicate API에 prediction 생성 요청
    const response = await axios.post(
      `${REPLICATE_BASE_URL}/models/${model}/predictions`,
      { input: predictionInput },
      {
        headers: {
          Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          // "Prefer: wait" 헤더를 사용하면 동기식으로 결과를 기다릴 수도 있지만,
          // 여기서는 비동기(폴링) 방식을 사용합니다
        },
        timeout: 60000, // 60초 타임아웃 (요청 제출만)
      }
    );

    const prediction = response.data;
    console.log(`[Replicate] 작업 접수 완료: id=${prediction.id}, status=${prediction.status}`);

    return { jobId: prediction.id };
  } catch (err) {
    if (err.response) {
      const errData = err.response.data;
      throw new Error(
        `Replicate API 오류 (${err.response.status}): ${errData.detail || JSON.stringify(errData)}`
      );
    }
    throw new Error(`Replicate 연결 실패: ${err.message}`);
  }
}

/**
 * 작업 상태를 조회하는 함수
 *
 * @param {string} jobId - 작업 ID
 * @returns {Promise<{ status: string, progress: number, output?: any, error?: string }>}
 */
async function status(jobId) {
  // ── Mock 모드 ──
  if (MOCK_MODE) {
    return statusMock(jobId);
  }

  // ── 실제 Replicate API 호출 ──
  try {
    const response = await axios.get(
      `${REPLICATE_BASE_URL}/predictions/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        },
        timeout: 15000,
      }
    );

    const prediction = response.data;

    // Replicate 상태를 VELA 상태로 변환
    // Replicate: starting → processing → succeeded/failed/canceled
    // VELA:     IN_QUEUE → IN_PROGRESS → COMPLETED/FAILED
    const statusMap = {
      starting: 'IN_QUEUE',
      processing: 'IN_PROGRESS',
      succeeded: 'COMPLETED',
      failed: 'FAILED',
      canceled: 'FAILED',
    };

    const velaStatus = statusMap[prediction.status] || 'IN_PROGRESS';

    // 진행률 추정 (Replicate는 정확한 진행률을 제공하지 않으므로 상태 기반 추정)
    let progress = 0;
    if (prediction.status === 'starting') progress = 10;
    if (prediction.status === 'processing') {
      // logs에서 진행률 파싱 시도
      progress = parseProgressFromLogs(prediction.logs) || 50;
    }
    if (prediction.status === 'succeeded') progress = 100;

    // 결과 처리
    let output = null;
    if (prediction.status === 'succeeded' && prediction.output) {
      // Replicate output은 모델마다 형식이 다름
      // 문자열(URL) 또는 배열일 수 있음
      const videoUrl = Array.isArray(prediction.output)
        ? prediction.output[0]
        : prediction.output;

      output = {
        video_url: videoUrl,
        thumbnail_url: null,
      };
    }

    return {
      status: velaStatus,
      progress,
      output,
      error: prediction.error || null,
      estimatedTime: prediction.status === 'processing' ? 30 : null,
    };
  } catch (err) {
    if (err.response) {
      throw new Error(`Replicate 상태 조회 실패 (${err.response.status}): ${JSON.stringify(err.response.data)}`);
    }
    throw new Error(`Replicate 연결 실패: ${err.message}`);
  }
}

/**
 * 작업을 취소하는 함수
 * @param {string} jobId - 취소할 작업 ID
 */
async function cancel(jobId) {
  if (MOCK_MODE) {
    mockJobs.delete(jobId);
    return { success: true };
  }

  try {
    await axios.post(
      `${REPLICATE_BASE_URL}/predictions/${jobId}/cancel`,
      {},
      {
        headers: {
          Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        },
        timeout: 15000,
      }
    );
    return { success: true };
  } catch (err) {
    if (err.response) {
      throw new Error(`Replicate 작업 취소 실패: ${JSON.stringify(err.response.data)}`);
    }
    throw new Error(`Replicate 연결 실패: ${err.message}`);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 유틸리티 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 영상 길이(초)를 프레임 수로 변환
 * Wan 2.1은 약 16fps로 영상을 생성
 */
function durationToFrames(seconds) {
  const frameMap = {
    3: 49,   // 약 3초
    5: 81,   // 약 5초 (기본값)
    10: 161, // 약 10초
  };
  return frameMap[seconds] || 81;
}

/**
 * Replicate 로그에서 진행률을 파싱하는 함수
 * 일부 모델은 로그에 "50%" 같은 형태로 진행률을 출력함
 */
function parseProgressFromLogs(logs) {
  if (!logs) return null;

  // "X%" 패턴 검색 (마지막 매칭을 사용)
  const matches = logs.match(/(\d+)%/g);
  if (matches && matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    const percent = parseInt(lastMatch);
    if (percent >= 0 && percent <= 100) {
      return percent;
    }
  }

  // "step X/Y" 패턴 검색
  const stepMatch = logs.match(/step\s+(\d+)\s*\/\s*(\d+)/i);
  if (stepMatch) {
    const current = parseInt(stepMatch[1]);
    const total = parseInt(stepMatch[2]);
    if (total > 0) {
      return Math.min(95, Math.floor((current / total) * 100));
    }
  }

  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Mock 모드 함수 (테스트용)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Mock 모드에서 작업을 시뮬레이션하는 함수
 * 업로드된 이미지가 있으면 해당 이미지를 결과에 반영합니다
 */
function runMock(input) {
  const jobId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  mockJobs.set(jobId, {
    status: 'IN_PROGRESS',
    progress: 0,
    startedAt: Date.now(),
    completesAt: Date.now() + 5000, // 5초 후 완료
    type: input.type,
    // Mock에서도 이미지 정보를 보존 (결과에 반영하기 위해)
    hasImage: !!input.image,
    motionStyle: input.motionStyle || null,
    prompt: input.prompt || '',
  });

  console.log(`[Replicate Mock] 작업 시작: ${jobId} (type=${input.type})`);
  return { jobId };
}

/**
 * Mock 모드에서 상태를 조회하는 함수
 */
function statusMock(jobId) {
  const job = mockJobs.get(jobId);

  if (!job) {
    return { status: 'FAILED', progress: 0, error: '존재하지 않는 작업입니다.' };
  }

  const now = Date.now();
  const elapsed = now - job.startedAt;
  const total = job.completesAt - job.startedAt;

  // 완료 시간이 지났으면 완료 처리
  if (now >= job.completesAt) {
    job.status = 'COMPLETED';
    job.progress = 100;

    // Mock 결과 영상 URL (무료 공개 샘플 영상)
    // 참고: Mock 모드에서는 실제 이미지 기반 영상을 생성할 수 없습니다
    const sampleVideos = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    ];
    // 작업 유형에 따라 다른 샘플 선택
    const videoIndex = job.type === 'image-to-video' ? 1 : 0;

    return {
      status: 'COMPLETED',
      progress: 100,
      output: {
        video_url: sampleVideos[videoIndex],
        thumbnail_url: null,
      },
      isMock: true, // Mock 모드임을 표시 (프론트에서 안내 메시지 표시용)
    };
  }

  // 진행률 계산 (0~90% 범위에서 선형 증가)
  const progress = Math.min(90, Math.floor((elapsed / total) * 90));
  job.progress = progress;

  return {
    status: 'IN_PROGRESS',
    progress,
    estimatedTime: Math.ceil((job.completesAt - now) / 1000),
  };
}

module.exports = { run, status, cancel, MOCK_MODE, MOTION_PROMPTS, STYLE_PREFIXES };
