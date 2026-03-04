/**
 * services/api.ts — 백엔드 API 통신 모듈
 *
 * 프론트엔드에서 백엔드 서버로 데이터를 보내거나 받아오는 함수들을 모아둔 파일입니다.
 * 마치 "배달 서비스"처럼, 프론트엔드가 요청을 보내면 백엔드가 처리 결과를 돌려줍니다.
 *
 * 모든 함수는 async(비동기)로 되어 있어서, 서버 응답을 기다리는 동안
 * 화면이 멈추지 않고 계속 동작합니다.
 */
import axios from 'axios';
import type {
  TextToVideoRequest,
  GenerationJob,
  SubtitleEntry,
} from '@/types';

// ─────────────────────────────────────
// API 기본 설정
// ─────────────────────────────────────

/** API 요청을 보낼 기본 주소 (개발 환경에서는 Vite 프록시가 localhost:4000으로 전달) */
const API_BASE = '/api';

/** axios 인스턴스 — 모든 요청에 공통 설정을 적용 */
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 최대 30초 대기 (영상 생성은 별도 폴링)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─────────────────────────────────────
// 텍스트 → 영상 생성 API
// ─────────────────────────────────────

/**
 * 텍스트 프롬프트로 영상 생성을 요청합니다.
 * - 서버에 프롬프트, 스타일, 길이, 해상도를 보냅니다
 * - 서버는 작업 ID(jobId)와 예상 시간을 돌려줍니다
 * - 실제 영상 생성은 서버에서 비동기로 진행됩니다
 */
export async function requestTextToVideo(
  data: TextToVideoRequest
): Promise<{ jobId: string; estimatedSeconds: number }> {
  const response = await apiClient.post('/video/generate-text', data);
  return response.data;
}

/**
 * 프롬프트를 AI가 더 좋게 개선해줍니다.
 * - 사용자가 입력한 간단한 텍스트를 영상 생성에 최적화된 프롬프트로 변환합니다
 */
export async function enhancePrompt(
  prompt: string,
  style: string
): Promise<{ enhanced: string }> {
  const response = await apiClient.post('/video/enhance-prompt', {
    prompt,
    style,
  });
  return response.data;
}

// ─────────────────────────────────────
// 이미지 → 영상 생성 API
// ─────────────────────────────────────

/**
 * 이미지 파일을 업로드하고 영상으로 변환을 요청합니다.
 * - FormData로 이미지 파일을 전송합니다 (일반 JSON이 아닌 파일 전송)
 * - 모션 스타일과 영상 길이도 함께 전송합니다
 */
export async function requestImageToVideo(
  imageFile: File,
  motionStyle: string,
  duration: number
): Promise<{ jobId: string; estimatedSeconds: number }> {
  // 파일 전송을 위한 특수 데이터 형식 (FormData)
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('motionStyle', motionStyle);
  formData.append('duration', String(duration));

  const response = await apiClient.post('/video/generate-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// ─────────────────────────────────────
// 작업 상태 확인 API
// ─────────────────────────────────────

/**
 * 영상 생성 작업의 현재 진행 상태를 확인합니다.
 * - 작업 ID로 서버에 "지금 몇 % 됐나요?" 하고 물어봅니다
 * - 완료되면 resultUrl에 영상 다운로드 URL이 포함됩니다
 */
export async function getJobStatus(jobId: string): Promise<GenerationJob> {
  const response = await apiClient.get(`/video/status/${jobId}`);
  return response.data;
}

// ─────────────────────────────────────
// 자막 관련 API
// ─────────────────────────────────────

/**
 * 영상 파일을 업로드하고 AI 자막 생성을 요청합니다.
 * - 영상의 음성을 AI(Whisper)가 인식하여 자막으로 변환합니다
 * - 결과: 시간코드가 포함된 자막 목록
 */
export async function requestSubtitleGeneration(
  videoFile: File
): Promise<{ jobId: string }> {
  const formData = new FormData();
  formData.append('video', videoFile);

  const response = await apiClient.post('/subtitle/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * 자막 생성 결과를 가져옵니다.
 * - 생성이 완료되면 시간코드와 텍스트가 포함된 자막 목록을 반환합니다
 */
export async function getSubtitleResult(
  jobId: string
): Promise<{ status: string; subtitles: SubtitleEntry[] }> {
  const response = await apiClient.get(`/subtitle/result/${jobId}`);
  return response.data;
}

// ─────────────────────────────────────
// 내보내기(Export) API
// ─────────────────────────────────────

/**
 * 영상 내보내기를 요청합니다.
 * - 해상도, 비율, 자막 포함 여부 등을 설정하고 최종 렌더링을 요청합니다
 */
export async function requestExport(options: {
  videoUrl: string;
  resolution: string;
  format: string;
  subtitleMode: 'none' | 'hardcode' | 'srt';
  subtitles?: SubtitleEntry[];
}): Promise<{ jobId: string; estimatedSeconds: number }> {
  const response = await apiClient.post('/video/export', options);
  return response.data;
}

// ─────────────────────────────────────
// 프로젝트 관련 API
// ─────────────────────────────────────

/**
 * 최근 프로젝트 목록을 가져옵니다.
 */
export async function getRecentProjects(): Promise<{
  projects: Array<{
    id: string;
    name: string;
    type: string;
    thumbnailUrl: string;
    status: string;
    updatedAt: string;
  }>;
}> {
  const response = await apiClient.get('/projects/recent');
  return response.data;
}

/**
 * 사용량 통계를 가져옵니다.
 */
export async function getUsageStats(): Promise<{
  videosGenerated: number;
  storageUsedMB: number;
  storageLimitMB: number;
  estimatedCost: number;
}> {
  const response = await apiClient.get('/usage/stats');
  return response.data;
}
