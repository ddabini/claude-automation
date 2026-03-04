/**
 * components/ProgressBar.tsx — 진행률 표시 바
 *
 * 영상 생성이 얼마나 진행되었는지를 시각적으로 보여줍니다.
 * - 퍼센트(%) 숫자 표시
 * - 색이 채워지는 바 (그라데이션)
 * - 예상 남은 시간 표시
 */
import React from 'react';

// ─────────────────────────────────────
// 컴포넌트 입력값(Props) 정의
// ─────────────────────────────────────

interface ProgressBarProps {
  progress: number;           // 진행률 (0~100)
  estimatedSeconds: number;   // 예상 남은 시간 (초)
  showLabel?: boolean;        // 퍼센트 라벨 표시 여부 (기본: true)
}

// ─────────────────────────────────────
// 남은 시간을 사람이 읽기 좋은 형태로 변환
// ─────────────────────────────────────

/**
 * 초 단위 시간을 "약 1분 30초" 같은 한국어로 변환합니다.
 */
function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return '곧 완료됩니다';
  if (seconds < 60) return `약 ${seconds}초 남음`;

  // 60초 이상이면 분+초로 표시
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) return `약 ${minutes}분 남음`;
  return `약 ${minutes}분 ${remainingSeconds}초 남음`;
}

// ─────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  estimatedSeconds,
  showLabel = true,
}) => {
  // 진행률을 0~100 범위로 안전하게 제한
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full space-y-2">
      {/* 상단: 퍼센트 + 남은 시간 */}
      {showLabel && (
        <div className="flex justify-between items-center text-sm">
          {/* 진행률 퍼센트 */}
          <span className="font-semibold text-primary-700">
            {Math.round(safeProgress)}%
          </span>
          {/* 예상 남은 시간 */}
          <span className="text-gray-400">
            {formatRemainingTime(estimatedSeconds)}
          </span>
        </div>
      )}

      {/* 진행률 바 (배경 + 채워지는 부분) */}
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        {/* 채워지는 부분 — 보라색 그라데이션 */}
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-violet-500 transition-all duration-500 ease-out"
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
