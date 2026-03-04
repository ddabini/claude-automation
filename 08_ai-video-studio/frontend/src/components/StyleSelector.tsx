/**
 * components/StyleSelector.tsx — 스타일 선택 카드 그리드
 *
 * 여러 옵션 중 하나를 선택하는 카드형 라디오 버튼입니다.
 * 영상 스타일(시네마틱/브이로그 등)이나 모션 스타일 선택에 사용합니다.
 * 선택된 카드는 보라색 테두리로 강조됩니다.
 */
import React from 'react';
import {
  Camera,
  Video,
  Palette,
  Megaphone,
  Newspaper,
  ZoomIn,
  ZoomOut,
  MoveLeft,
  MoveRight,
  Wind,
} from 'lucide-react';

// ─────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────

/** 하나의 스타일 옵션 정보 */
export interface StyleOption {
  value: string;        // 서버에 보내는 값 (예: 'cinematic')
  label: string;        // 화면에 보이는 이름 (예: '시네마틱')
  description: string;  // 짧은 설명
  iconName: string;     // 아이콘 이름
}

interface StyleSelectorProps {
  options: StyleOption[];           // 선택지 목록
  selected: string;                 // 현재 선택된 값
  onChange: (value: string) => void; // 선택이 바뀌었을 때 실행할 함수
  columns?: number;                 // 열 개수 (기본: 3)
}

// ─────────────────────────────────────
// 아이콘 이름 → 실제 아이콘 컴포넌트 매핑
// ─────────────────────────────────────

/**
 * 문자열 아이콘 이름을 실제 lucide-react 아이콘 컴포넌트로 변환합니다.
 * (데이터에서 아이콘 이름을 문자열로 지정하기 위함)
 */
function getIcon(iconName: string, className: string) {
  const icons: Record<string, React.ReactNode> = {
    camera: <Camera className={className} />,
    video: <Video className={className} />,
    palette: <Palette className={className} />,
    megaphone: <Megaphone className={className} />,
    newspaper: <Newspaper className={className} />,
    'zoom-in': <ZoomIn className={className} />,
    'zoom-out': <ZoomOut className={className} />,
    'move-left': <MoveLeft className={className} />,
    'move-right': <MoveRight className={className} />,
    wind: <Wind className={className} />,
  };
  return icons[iconName] || <Video className={className} />;
}

// ─────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────

const StyleSelector: React.FC<StyleSelectorProps> = ({
  options,
  selected,
  onChange,
  columns = 3,
}) => {
  // 열 개수에 따른 CSS 그리드 클래스
  const gridClass =
    columns === 2
      ? 'grid-cols-2'
      : columns === 5
      ? 'grid-cols-5'
      : 'grid-cols-3';

  return (
    <div className={`grid ${gridClass} gap-3`}>
      {options.map((option) => {
        // 이 옵션이 현재 선택되었는지 확인
        const isSelected = selected === option.value;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              relative p-4 rounded-xl border-2 text-left transition-all duration-200
              hover:shadow-md active:scale-[0.98]
              ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-primary-200'
              }
            `}
          >
            {/* 아이콘 */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3
                ${isSelected ? 'bg-primary-100' : 'bg-gray-50'}`}
            >
              {getIcon(
                option.iconName,
                `w-5 h-5 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`
              )}
            </div>

            {/* 이름 + 설명 */}
            <p
              className={`font-semibold text-sm ${
                isSelected ? 'text-primary-700' : 'text-gray-700'
              }`}
            >
              {option.label}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{option.description}</p>

            {/* 선택 표시 (보라색 체크 뱃지) */}
            {isSelected && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StyleSelector;
