/**
 * stores/projectStore.ts — Zustand 전역 상태 관리
 *
 * 앱 전체에서 공유하는 데이터를 관리합니다.
 * - 현재 작업 중인 영상 정보
 * - FFmpeg 작업 진행 상태
 * - 자막 목록
 * - 사이드바 상태
 */
import { create } from 'zustand';
import type { VideoMeta, ProcessingJob, SubtitleEntry } from '@/types';

// ─────────────────────────────────────
// 스토어 타입 정의
// ─────────────────────────────────────

interface ProjectStore {
  // ── 현재 작업 영상 ──
  currentVideo: VideoMeta | null;
  setCurrentVideo: (video: VideoMeta | null) => void;

  // ── FFmpeg 처리 작업 상태 ──
  processingJob: ProcessingJob;
  updateProcessingJob: (job: Partial<ProcessingJob>) => void;
  resetProcessingJob: () => void;

  // ── 자막 ──
  subtitles: SubtitleEntry[];
  setSubtitles: (subtitles: SubtitleEntry[]) => void;
  updateSubtitle: (id: string, text: string) => void;

  // ── UI 상태 ──
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

// ─────────────────────────────────────
// 초기값
// ─────────────────────────────────────

const initialProcessingJob: ProcessingJob = {
  jobId: '',
  status: 'idle',
  progress: 0,
};

// ─────────────────────────────────────
// 스토어 생성
// ─────────────────────────────────────

export const useProjectStore = create<ProjectStore>((set) => ({
  // ── 현재 작업 영상 ──
  currentVideo: null,
  setCurrentVideo: (video) => set({ currentVideo: video }),

  // ── 처리 작업 상태 ──
  processingJob: initialProcessingJob,
  updateProcessingJob: (job) =>
    set((state) => ({
      processingJob: { ...state.processingJob, ...job },
    })),
  resetProcessingJob: () => set({ processingJob: initialProcessingJob }),

  // ── 자막 ──
  subtitles: [],
  setSubtitles: (subtitles) => set({ subtitles }),
  updateSubtitle: (id, text) =>
    set((state) => ({
      subtitles: state.subtitles.map((s) =>
        s.id === id ? { ...s, text } : s
      ),
    })),

  // ── UI ──
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
