/**
 * services/api.ts — 백엔드 API 통신 모듈
 *
 * 영상 업로드, 트림, 오디오 편집, 자막, 내보내기 등
 * 모든 백엔드 요청을 처리합니다.
 */
import axios from 'axios';
import type { VideoMeta, SubtitleEntry } from '@/types';

// ─────────────────────────────────────
// API 기본 설정
// ─────────────────────────────────────

const API_BASE = '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // FFmpeg 작업은 시간이 걸릴 수 있으므로 2분
  headers: { 'Content-Type': 'application/json' },
});

// ─────────────────────────────────────
// 영상 업로드
// ─────────────────────────────────────

/**
 * 영상을 서버에 업로드하고 메타데이터를 받아옵니다.
 * FFmpeg로 영상 길이, 해상도, 코덱 정보를 분석합니다.
 */
export async function uploadVideo(
  file: File
): Promise<{ success: boolean; video: VideoMeta }> {
  const formData = new FormData();
  formData.append('video', file);

  const response = await apiClient.post('/video/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// ─────────────────────────────────────
// 컷편집 (트림)
// ─────────────────────────────────────

/**
 * 영상의 특정 구간만 잘라냅니다.
 * @param videoPath - 서버에 저장된 영상 경로
 * @param startTime - 시작 시간 (초)
 * @param endTime - 끝 시간 (초)
 */
export async function trimVideo(
  videoPath: string,
  startTime: number,
  endTime: number
): Promise<{ success: boolean; downloadUrl: string; fileName: string }> {
  const response = await apiClient.post('/video/trim', {
    videoPath,
    startTime,
    endTime,
  });
  return response.data;
}

// ─────────────────────────────────────
// 오디오 편집
// ─────────────────────────────────────

/**
 * 영상의 오디오를 편집합니다 (볼륨, BGM, 페이드).
 */
export async function editAudio(
  videoPath: string,
  options: {
    volume: number;        // 0~200
    bgmVolume?: number;    // 0~100
    fadeIn?: number;       // 초
    fadeOut?: number;      // 초
  },
  bgmFile?: File
): Promise<{ success: boolean; downloadUrl: string; fileName: string }> {
  const formData = new FormData();
  formData.append('videoPath', videoPath);
  formData.append('volume', String(options.volume));
  if (options.bgmVolume !== undefined) formData.append('bgmVolume', String(options.bgmVolume));
  if (options.fadeIn !== undefined) formData.append('fadeIn', String(options.fadeIn));
  if (options.fadeOut !== undefined) formData.append('fadeOut', String(options.fadeOut));
  if (bgmFile) formData.append('bgm', bgmFile);

  const response = await apiClient.post('/audio/edit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

// ─────────────────────────────────────
// 자막
// ─────────────────────────────────────

/**
 * 자막을 영상에 하드코딩합니다.
 */
export async function burnSubtitles(
  videoPath: string,
  subtitles: SubtitleEntry[]
): Promise<{ success: boolean; downloadUrl: string; fileName: string }> {
  const response = await apiClient.post('/subtitle/burn', {
    videoPath,
    subtitles,
  });
  return response.data;
}

// ─────────────────────────────────────
// 내보내기
// ─────────────────────────────────────

/**
 * 영상을 원하는 포맷/해상도/비율로 변환합니다.
 */
export async function exportVideo(options: {
  videoPath: string;
  format: string;
  resolution: string;
  aspectRatio: string;
}): Promise<{ success: boolean; downloadUrl: string; fileName: string }> {
  const response = await apiClient.post('/video/export', options);
  return response.data;
}
