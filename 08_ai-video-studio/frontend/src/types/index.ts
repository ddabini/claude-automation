/**
 * types/index.ts — 프로젝트 전체에서 사용하는 타입 정의
 *
 * VELA 영상 편집기: 컷편집, 오디오, 자막 기능 중심
 */

// ─────────────────────────────────────
// 작업 상태 타입
// ─────────────────────────────────────

/** 작업의 현재 상태 */
export type JobStatus =
  | 'idle'        // 대기 중
  | 'processing'  // 처리 중
  | 'completed'   // 완료
  | 'failed';     // 실패

/** 백그라운드 작업 진행 정보 (FFmpeg 변환 등) */
export interface ProcessingJob {
  jobId: string;
  status: JobStatus;
  progress: number;           // 0~100
  resultUrl?: string;         // 결과 파일 다운로드 URL
  errorMessage?: string;
}

// ─────────────────────────────────────
// 영상 메타데이터
// ─────────────────────────────────────

/** 업로드된 영상의 기본 정보 */
export interface VideoMeta {
  fileName: string;           // 원본 파일 이름
  fileSize: number;           // 파일 크기 (바이트)
  duration: number;           // 영상 길이 (초)
  width: number;              // 가로 해상도
  height: number;             // 세로 해상도
  fps: number;                // 프레임 레이트
  codec: string;              // 코덱 (예: h264)
  uploadPath: string;         // 서버에 저장된 경로
}

// ─────────────────────────────────────
// 컷편집 관련 타입
// ─────────────────────────────────────

/** 트림 요청 (시작~끝 구간만 자르기) */
export interface TrimRequest {
  videoPath: string;          // 서버 영상 경로
  startTime: number;          // 시작 시간 (초)
  endTime: number;            // 끝 시간 (초)
}

// ─────────────────────────────────────
// 오디오 관련 타입
// ─────────────────────────────────────

/** 오디오 편집 요청 */
export interface AudioEditRequest {
  videoPath: string;          // 서버 영상 경로
  volume: number;             // 원본 볼륨 (0~200, 100이 기본)
  bgmPath?: string;           // BGM 파일 서버 경로
  bgmVolume?: number;         // BGM 볼륨 (0~100, 50이 기본)
  fadeIn?: number;            // 페이드 인 시간 (초)
  fadeOut?: number;           // 페이드 아웃 시간 (초)
}

// ─────────────────────────────────────
// 자막 관련 타입
// ─────────────────────────────────────

/** 자막 한 줄의 정보 */
export interface SubtitleEntry {
  id: string;                 // 고유 번호
  index: number;              // 순서 번호 (1부터)
  startTime: string;          // 시작 시간 (예: "00:00:01,500")
  endTime: string;            // 끝 시간 (예: "00:00:03,200")
  text: string;               // 자막 텍스트
}

// ─────────────────────────────────────
// 내보내기 관련 타입
// ─────────────────────────────────────

/** 내보내기 설정 */
export interface ExportRequest {
  videoPath: string;
  format: 'mp4' | 'webm' | 'mov';
  resolution: '1080p' | '720p' | '480p';
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  subtitleMode: 'none' | 'hardcode' | 'srt';
  subtitles?: SubtitleEntry[];
}

// ─────────────────────────────────────
// 프로젝트 / 사이드바 타입
// ─────────────────────────────────────

/** 사이드바 메뉴 항목 */
export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}
