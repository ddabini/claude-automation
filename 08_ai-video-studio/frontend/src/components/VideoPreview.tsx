/**
 * components/VideoPreview.tsx — 영상 미리보기 컴포넌트
 *
 * 영상 생성의 3단계를 보여주는 컴포넌트입니다:
 * 1. 대기 중 — "영상이 여기에 표시됩니다" 안내 화면
 * 2. 생성 중 — 진행률 애니메이션과 예상 시간
 * 3. 완료 — 실제 영상 재생기
 */
import React from 'react';
import { Play, Download, Film, Loader2 } from 'lucide-react';
import type { GenerationJob } from '@/types';
import ProgressBar from './ProgressBar';

// ─────────────────────────────────────
// 컴포넌트 입력값(Props) 정의
// ─────────────────────────────────────

interface VideoPreviewProps {
  job: GenerationJob;                    // 생성 작업 상태 정보
  onDownload?: () => void;              // 다운로드 버튼 클릭 시 실행할 함수
  onEdit?: () => void;                  // 편집하기 버튼 클릭 시 실행할 함수
}

// ─────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────

const VideoPreview: React.FC<VideoPreviewProps> = ({ job, onDownload, onEdit }) => {
  // ── 1. 대기 상태 — 아직 생성을 시작하지 않은 상태 ──
  if (job.status === 'idle') {
    return (
      <div className="w-full aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4">
        {/* 영상 아이콘 — 부드럽게 흔들리는 애니메이션 */}
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center animate-float">
          <Film className="w-8 h-8 text-primary-400" />
        </div>
        <div className="text-center">
          <p className="text-gray-500 font-medium">영상 미리보기</p>
          <p className="text-gray-400 text-sm mt-1">
            영상을 생성하면 여기에 표시됩니다
          </p>
        </div>
      </div>
    );
  }

  // ── 2. 생성 중 상태 — 진행률 애니메이션 표시 ──
  if (
    job.status === 'preparing' ||
    job.status === 'generating' ||
    job.status === 'processing'
  ) {
    // 상태별 한국어 메시지
    const statusMessages: Record<string, string> = {
      preparing: 'AI가 프롬프트를 최적화하고 있습니다...',
      generating: 'AI가 영상을 만들고 있습니다...',
      processing: '영상을 후처리하고 있습니다...',
    };

    return (
      <div className="w-full aspect-video bg-gradient-to-br from-primary-50 to-violet-50 rounded-2xl border border-primary-100 flex flex-col items-center justify-center gap-6 p-8">
        {/* 로딩 스피너 + 빛나는 효과 */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center animate-pulse-glow">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          </div>
        </div>

        {/* 상태 메시지 */}
        <div className="text-center space-y-2">
          <p className="text-primary-700 font-semibold text-lg">
            {statusMessages[job.status] || '처리 중...'}
          </p>
        </div>

        {/* 진행률 바 */}
        <div className="w-full max-w-md">
          <ProgressBar
            progress={job.progress}
            estimatedSeconds={job.estimatedSeconds}
          />
        </div>
      </div>
    );
  }

  // ── 3. 실패 상태 — 에러 메시지 표시 ──
  if (job.status === 'failed') {
    return (
      <div className="w-full aspect-video bg-red-50 rounded-2xl border border-red-200 flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-3xl">!</span>
        </div>
        <div className="text-center">
          <p className="text-red-700 font-semibold">영상 생성에 실패했습니다</p>
          <p className="text-red-500 text-sm mt-1">
            {job.errorMessage || '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.'}
          </p>
        </div>
      </div>
    );
  }

  // ── 4. 완료 상태 — 영상 재생기 + 버튼들 ──
  return (
    <div className="w-full space-y-4">
      {/* 영상 플레이어 */}
      <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-lg">
        {job.resultUrl ? (
          <video
            src={job.resultUrl}
            controls
            className="w-full h-full object-contain"
            poster="" // 영상 첫 프레임을 포스터로 사용
          >
            브라우저가 영상 재생을 지원하지 않습니다.
          </video>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-16 h-16 text-white/50" />
          </div>
        )}
      </div>

      {/* 액션 버튼들 */}
      <div className="flex gap-3">
        {/* MP4 다운로드 버튼 */}
        <button
          onClick={onDownload}
          className="btn-primary flex items-center gap-2 flex-1"
        >
          <Download className="w-4 h-4" />
          MP4 다운로드
        </button>
        {/* 편집하기 버튼 */}
        <button
          onClick={onEdit}
          className="btn-outline flex items-center gap-2 flex-1"
        >
          편집하기
        </button>
      </div>
    </div>
  );
};

export default VideoPreview;
