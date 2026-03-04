/**
 * stores/projectStore.ts — Zustand 상태 관리 스토어
 *
 * Zustand는 앱 전체에서 공유하는 데이터를 관리하는 도구입니다.
 * 예를 들어, "현재 어떤 프로젝트를 보고 있는가", "영상 생성이 몇 % 진행되었는가" 등의
 * 정보를 여러 화면에서 동시에 확인하고 업데이트할 수 있게 합니다.
 *
 * 일반 변수와의 차이: 상태가 바뀌면 관련 화면이 자동으로 다시 그려집니다.
 */
import { create } from 'zustand';
import type {
  Project,
  GenerationJob,
  SubtitleEntry,
  UsageStats,
} from '@/types';

// ─────────────────────────────────────
// 스토어의 데이터 구조 정의
// ─────────────────────────────────────

/** 스토어에 담기는 모든 데이터와 함수의 타입 */
interface ProjectStore {
  // ── 데이터 ──
  projects: Project[];              // 모든 프로젝트 목록
  currentProject: Project | null;   // 현재 선택된 프로젝트
  generationJob: GenerationJob;     // 영상 생성 작업 상태
  subtitles: SubtitleEntry[];       // 자막 목록
  usageStats: UsageStats;           // 사용량 통계
  sidebarCollapsed: boolean;        // 사이드바 접힘 여부

  // ── 함수 (액션) ──
  setProjects: (projects: Project[]) => void;            // 프로젝트 목록 설정
  setCurrentProject: (project: Project | null) => void;  // 현재 프로젝트 설정
  addProject: (project: Project) => void;                // 프로젝트 추가
  updateGenerationJob: (job: Partial<GenerationJob>) => void; // 생성 작업 상태 업데이트
  resetGenerationJob: () => void;                         // 생성 작업 초기화
  setSubtitles: (subtitles: SubtitleEntry[]) => void;    // 자막 목록 설정
  updateSubtitle: (id: string, text: string) => void;    // 특정 자막 수정
  setUsageStats: (stats: UsageStats) => void;            // 사용량 설정
  toggleSidebar: () => void;                             // 사이드바 접기/펼치기
}

// ─────────────────────────────────────
// 초기값 (앱 시작 시 기본 상태)
// ─────────────────────────────────────

/** 영상 생성 작업의 초기 상태 — 아무것도 진행하지 않은 상태 */
const initialGenerationJob: GenerationJob = {
  jobId: '',
  status: 'idle',
  progress: 0,
  estimatedSeconds: 0,
};

/** 사용량 통계 초기값 */
const initialUsageStats: UsageStats = {
  videosGenerated: 0,
  storageUsedMB: 0,
  storageLimitMB: 5120, // 5GB 기본 한도
  estimatedCost: 0,
};

// ─────────────────────────────────────
// 스토어 생성
// ─────────────────────────────────────

/**
 * 프로젝트 스토어 — 앱 전체에서 사용하는 공유 데이터 저장소
 *
 * 사용 방법:
 *   const { projects, addProject } = useProjectStore();
 */
export const useProjectStore = create<ProjectStore>((set) => ({
  // ── 초기 데이터 ──
  projects: [],
  currentProject: null,
  generationJob: initialGenerationJob,
  subtitles: [],
  usageStats: initialUsageStats,
  sidebarCollapsed: false,

  // ── 프로젝트 관련 함수 ──

  /** 프로젝트 목록 전체를 새로 설정 */
  setProjects: (projects) => set({ projects }),

  /** 현재 보고 있는 프로젝트를 설정 */
  setCurrentProject: (project) => set({ currentProject: project }),

  /** 새 프로젝트를 목록 맨 앞에 추가 */
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),

  // ── 영상 생성 관련 함수 ──

  /** 생성 작업 상태를 부분적으로 업데이트 (진행률, 상태 등) */
  updateGenerationJob: (job) =>
    set((state) => ({
      generationJob: { ...state.generationJob, ...job },
    })),

  /** 생성 작업을 처음 상태로 되돌리기 */
  resetGenerationJob: () => set({ generationJob: initialGenerationJob }),

  // ── 자막 관련 함수 ──

  /** 자막 목록 전체를 새로 설정 */
  setSubtitles: (subtitles) => set({ subtitles }),

  /** 특정 자막의 텍스트를 수정 */
  updateSubtitle: (id, text) =>
    set((state) => ({
      subtitles: state.subtitles.map((s) =>
        s.id === id ? { ...s, text } : s
      ),
    })),

  // ── 기타 함수 ──

  /** 사용량 통계 업데이트 */
  setUsageStats: (stats) => set({ usageStats: stats }),

  /** 사이드바 접기/펼치기 토글 */
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
