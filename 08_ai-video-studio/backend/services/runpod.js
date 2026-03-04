/**
 * ============================================
 * RunPod Serverless API 연동 서비스
 * ============================================
 *
 * RunPod은 GPU 서버를 빌려서 AI 모델을 실행하는 서비스입니다.
 * 텍스트→영상, 이미지→영상 등 무거운 AI 작업을 RunPod 서버에 맡깁니다.
 *
 * MOCK_MODE=true일 때는 RunPod 없이 가짜 응답으로 테스트할 수 있습니다.
 * (개발 중 RunPod API 키가 없어도 전체 플로우를 확인 가능)
 */

const axios = require('axios');

// RunPod API 설정
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID;
const RUNPOD_BASE_URL = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}`;

// Mock 모드 여부
const MOCK_MODE = process.env.MOCK_MODE === 'true';

// 진행 중인 Mock 작업 상태 저장소
const mockJobs = new Map();

/**
 * RunPod에 작업을 제출하는 함수 (비동기 실행)
 *
 * 비유: 세탁소에 옷을 맡기고 번호표를 받는 것처럼,
 *       AI 작업을 RunPod에 맡기고 jobId(번호표)를 받습니다.
 *
 * @param {object} input - RunPod에 전달할 입력 데이터
 * @param {string} input.prompt - 영상 생성 프롬프트 (텍스트→영상)
 * @param {string} [input.image] - Base64 인코딩된 이미지 (이미지→영상)
 * @param {string} [input.style] - 영상 스타일
 * @param {number} [input.duration] - 영상 길이(초)
 * @param {string} [input.resolution] - 해상도 (720p, 1080p 등)
 * @returns {Promise<{ jobId: string }>} 작업 ID
 */
async function run(input) {
  // ── Mock 모드: RunPod 없이 테스트 ──
  if (MOCK_MODE) {
    const jobId = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Mock 작업 상태 초기화
    mockJobs.set(jobId, {
      status: 'IN_PROGRESS',
      progress: 0,
      startedAt: Date.now(),
      // Mock 작업은 5초 후 완료
      completesAt: Date.now() + 5000,
    });

    console.log(`[RunPod Mock] 작업 시작: ${jobId}`);
    return { jobId };
  }

  // ── 실제 RunPod API 호출 ──
  try {
    // API 키 확인
    if (!RUNPOD_API_KEY || !RUNPOD_ENDPOINT_ID) {
      throw new Error(
        'RunPod API 설정이 없습니다. .env 파일에 RUNPOD_API_KEY와 RUNPOD_ENDPOINT_ID를 설정하거나, MOCK_MODE=true로 테스트하세요.'
      );
    }

    const response = await axios.post(
      `${RUNPOD_BASE_URL}/run`,
      { input },
      {
        headers: {
          Authorization: `Bearer ${RUNPOD_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30초 타임아웃
      }
    );

    return { jobId: response.data.id };
  } catch (err) {
    // 네트워크 에러나 RunPod 에러 처리
    if (err.response) {
      throw new Error(`RunPod API 오류 (${err.response.status}): ${JSON.stringify(err.response.data)}`);
    }
    throw new Error(`RunPod 연결 실패: ${err.message}`);
  }
}

/**
 * 작업 상태를 조회하는 함수
 *
 * 비유: 세탁소에 "제 옷 다 됐나요?" 하고 확인하는 것
 *
 * @param {string} jobId - 작업 ID (run 함수에서 받은 번호표)
 * @returns {Promise<{ status: string, progress: number, output?: any }>}
 *   status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
 *   progress: 0~100 (진행률)
 *   output: 완료 시 결과 데이터 (영상 URL 등)
 */
async function status(jobId) {
  // ── Mock 모드 ──
  if (MOCK_MODE) {
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

      return {
        status: 'COMPLETED',
        progress: 100,
        output: {
          // Mock 결과: 샘플 영상 URL (무료 테스트 영상)
          video_url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
          thumbnail_url: 'https://via.placeholder.com/640x360.png?text=VELA+Mock+Result',
          duration: 5,
          resolution: '720p',
        },
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

  // ── 실제 RunPod API 호출 ──
  try {
    const response = await axios.get(
      `${RUNPOD_BASE_URL}/status/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${RUNPOD_API_KEY}`,
        },
        timeout: 15000,
      }
    );

    const data = response.data;

    return {
      status: data.status,
      progress: data.status === 'COMPLETED' ? 100 : (data.progress || 0),
      output: data.output || null,
      estimatedTime: data.estimatedTime || null,
    };
  } catch (err) {
    if (err.response) {
      throw new Error(`RunPod 상태 조회 실패 (${err.response.status}): ${JSON.stringify(err.response.data)}`);
    }
    throw new Error(`RunPod 연결 실패: ${err.message}`);
  }
}

/**
 * 진행 중인 작업을 취소하는 함수
 * @param {string} jobId - 취소할 작업 ID
 * @returns {Promise<{ success: boolean }>}
 */
async function cancel(jobId) {
  // ── Mock 모드 ──
  if (MOCK_MODE) {
    const job = mockJobs.get(jobId);
    if (job) {
      mockJobs.delete(jobId);
      console.log(`[RunPod Mock] 작업 취소: ${jobId}`);
    }
    return { success: true };
  }

  // ── 실제 RunPod API 호출 ──
  try {
    await axios.post(
      `${RUNPOD_BASE_URL}/cancel/${jobId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${RUNPOD_API_KEY}`,
        },
        timeout: 15000,
      }
    );

    return { success: true };
  } catch (err) {
    if (err.response) {
      throw new Error(`RunPod 작업 취소 실패: ${JSON.stringify(err.response.data)}`);
    }
    throw new Error(`RunPod 연결 실패: ${err.message}`);
  }
}

module.exports = { run, status, cancel, MOCK_MODE };
