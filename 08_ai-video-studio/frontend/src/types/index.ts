/**
 * types/index.ts — 프로젝트 전체에서 사용하는 타입(데이터 형태) 정의
 *
 * TypeScript의 타입은 "이 데이터가 어떤 모양이어야 하는지"를 미리 약속하는 것입니다.
 * 예를 들어, "프로젝트에는 반드시 이름, 날짜, 상태가 있어야 한다"고 정해두면
 * 실수로 빠뜨리는 것을 방지할 수 있습니다.
 */

// ─────────────────────────────────────
// 영상 생성 관련 타입
// ─────────────────────────────────────

/** 영상 스타일 종류 (5가지) */
export type VideoStyle =
  | 'cinematic'    // 시네마틱 — 영화 느낌
  | 'vlog'         // 브이로그 — 일상 기록 느낌
  | 'animation'    // 애니메이션 — 만화 느낌
  | 'commercial'   // 광고 — 상업 영상 느낌
  | 'news';        // 뉴스 — 보도 느낌

/** 영상 해상도 옵션 */
export type VideoResolution =
  | '1080p-16:9'   // 가로 1080p (유튜브 기본)
  | '720p'         // 720p (경량)
  | '1080p-9:16';  // 세로 1080p (쇼츠, 릴스)

/** 영상 길이 옵션 (초 단위) */
export type VideoDuration = 3 | 5 | 10;

/** 이미지→영상 변환 시 모션 스타일 */
export type MotionStyle =
  | 'zoom-in'         // 줌 인 — 점점 가까이
  | 'zoom-out'        // 줌 아웃 — 점점 멀리
  | 'pan-left'        // 좌측 이동
  | 'pan-right'       // 우측 이동
  | 'cinematic-float'; // 시네마틱 부유 — 부드럽게 떠다니는 느낌

/** 영상 생성 작업의 현재 상태 */
export type JobStatus =
  | 'idle'        // 대기 중 — 아직 시작하지 않음
  | 'preparing'   // 준비 중 — 프롬프트 최적화 등
  | 'generating'  // 생성 중 — AI가 영상을 만들고 있음
  | 'processing'  // 후처리 중 — 인코딩, 포맷 변환 등
  | 'completed'   // 완료 — 영상 생성 성공
  | 'failed';     // 실패 — 오류 발생

// ─────────────────────────────────────
// 텍스트→영상 생성 요청 데이터
// ─────────────────────────────────────

/** 텍스트→영상 생성 시 서버에 보내는 데이터 */
export interface TextToVideoRequest {
  prompt: string;             // 사용자가 입력한 영상 설명 텍스트
  style: VideoStyle;          // 선택한 스타일
  duration: VideoDuration;    // 영상 길이 (초)
  resolution: VideoResolution; // 해상도 + 비율
}

/** 이미지→영상 생성 시 서버에 보내는 데이터 */
export interface ImageToVideoRequest {
  imageFile: File;            // 업로드한 이미지 파일
  motionStyle: MotionStyle;   // 모션 스타일
  duration: VideoDuration;    // 영상 길이 (초)
}

// ─────────────────────────────────────
// 작업(Job) 관련 타입
// ─────────────────────────────────────

/** 영상 생성 작업의 진행 상태 정보 */
export interface GenerationJob {
  jobId: string;              // 작업 고유 번호
  status: JobStatus;          // 현재 상태
  progress: number;           // 진행률 (0~100)
  estimatedSeconds: number;   // 예상 남은 시간 (초)
  resultUrl?: string;         // 완성된 영상 URL (완료 시에만 있음)
  errorMessage?: string;      // 오류 메시지 (실패 시에만 있음)
}

// ─────────────────────────────────────
// 프로젝트 관련 타입
// ─────────────────────────────────────

/** 프로젝트 하나의 정보 */
export interface Project {
  id: string;                 // 프로젝트 고유 번호
  name: string;               // 프로젝트 이름
  type: 'text-to-video' | 'image-to-video' | 'subtitle'; // 프로젝트 유형
  thumbnailUrl?: string;      // 썸네일 이미지 URL
  videoUrl?: string;          // 완성된 영상 URL
  status: JobStatus;          // 현재 상태
  createdAt: string;          // 생성 일시
  updatedAt: string;          // 마지막 수정 일시
}

// ─────────────────────────────────────
// 자막 관련 타입
// ─────────────────────────────────────

/** 자막 한 줄의 정보 */
export interface SubtitleEntry {
  id: string;                 // 자막 항목 고유 번호
  index: number;              // 자막 순서 번호 (1부터 시작)
  startTime: string;          // 시작 시간 (예: "00:00:01,500")
  endTime: string;            // 끝 시간 (예: "00:00:03,200")
  text: string;               // 자막 텍스트
}

// ─────────────────────────────────────
// 사용량 통계 타입
// ─────────────────────────────────────

/** 이번 달 사용량 요약 */
export interface UsageStats {
  videosGenerated: number;    // 이번 달 생성한 영상 수
  storageUsedMB: number;      // 사용한 저장 공간 (MB)
  storageLimitMB: number;     // 최대 저장 공간 (MB)
  estimatedCost: number;      // 이번 달 예상 비용 ($)
}

// ─────────────────────────────────────
// 사이드바 메뉴 아이템 타입
// ─────────────────────────────────────

/** 사이드바 메뉴 항목 */
export interface MenuItem {
  id: string;                 // 메뉴 고유 ID
  label: string;              // 메뉴 이름 (화면에 표시)
  icon: string;               // 아이콘 이름 (lucide-react)
  path: string;               // 이동할 URL 경로
}
