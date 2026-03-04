/**
 * pages/Export.tsx — 내보내기 페이지
 *
 * 완성된 영상을 원하는 형식으로 내보내는 페이지입니다.
 * - 해상도 선택 (1080p / 720p)
 * - 비율 선택 (16:9 가로 / 9:16 세로 / 1:1 정방형)
 * - 자막 모드 선택 (없음 / 하드 인코딩 / SRT 별도)
 * - 내보내기 실행 + 다운로드
 */
import React, { useState } from 'react';
import {
  Download,
  Monitor,
  Smartphone,
  Square,
  Captions,
  FileVideo,
  Check,
  Loader2,
  ArrowRight,
} from 'lucide-react';

// ─────────────────────────────────────
// 옵션 데이터
// ─────────────────────────────────────

/** 해상도 옵션 */
const resolutions = [
  { value: '1080p', label: '1080p (Full HD)', description: '1920x1080 · 고화질' },
  { value: '720p', label: '720p (HD)', description: '1280x720 · 경량' },
];

/** 비율 옵션 */
const ratios = [
  { value: '16:9', label: '16:9', description: '가로 (유튜브)', icon: Monitor },
  { value: '9:16', label: '9:16', description: '세로 (쇼츠/릴스)', icon: Smartphone },
  { value: '1:1', label: '1:1', description: '정방형 (인스타)', icon: Square },
];

/** 자막 모드 옵션 */
const subtitleModes = [
  { value: 'none', label: '자막 없음', description: '영상만 내보내기' },
  { value: 'hardcode', label: '하드 인코딩', description: '영상에 자막을 직접 새겨넣기' },
  { value: 'srt', label: 'SRT 별도', description: 'SRT 파일을 따로 내보내기' },
];

// ─────────────────────────────────────
// 내보내기 페이지 컴포넌트
// ─────────────────────────────────────

const Export: React.FC = () => {
  // ── 설정 상태 ──
  const [resolution, setResolution] = useState('1080p');
  const [ratio, setRatio] = useState('16:9');
  const [subtitleMode, setSubtitleMode] = useState('none');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  // ── 내보내기 실행 ──
  const handleExport = async () => {
    setIsExporting(true);
    setExportComplete(false);

    try {
      // TODO: 백엔드 연동 시 실제 내보내기 API 호출
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setExportComplete(true);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      {/* ── 헤더 ── */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FileVideo className="w-5 h-5 text-primary-500" />
          영상 내보내기
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          원하는 형식을 선택하고 최종 영상을 내보내세요
        </p>
      </div>

      {/* ── 해상도 선택 ── */}
      <section className="card p-6">
        <h3 className="font-bold text-gray-700 mb-4">해상도</h3>
        <div className="grid grid-cols-2 gap-3">
          {resolutions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setResolution(opt.value)}
              className={`p-4 rounded-xl border-2 text-left transition-all
                ${
                  resolution === opt.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-100 hover:border-primary-200'
                }`}
            >
              <p className={`font-semibold text-sm ${resolution === opt.value ? 'text-primary-700' : 'text-gray-700'}`}>
                {opt.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── 비율 선택 ── */}
      <section className="card p-6">
        <h3 className="font-bold text-gray-700 mb-4">화면 비율</h3>
        <div className="grid grid-cols-3 gap-3">
          {ratios.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => setRatio(opt.value)}
                className={`p-4 rounded-xl border-2 text-center transition-all
                  ${
                    ratio === opt.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-100 hover:border-primary-200'
                  }`}
              >
                <Icon
                  className={`w-6 h-6 mx-auto mb-2 ${
                    ratio === opt.value ? 'text-primary-600' : 'text-gray-400'
                  }`}
                />
                <p className={`font-semibold text-sm ${ratio === opt.value ? 'text-primary-700' : 'text-gray-700'}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 자막 모드 선택 ── */}
      <section className="card p-6">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Captions className="w-4 h-4 text-primary-500" />
          자막
        </h3>
        <div className="space-y-2">
          {subtitleModes.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSubtitleMode(opt.value)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all
                ${
                  subtitleMode === opt.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-100 hover:border-primary-200'
                }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${
                      subtitleMode === opt.value
                        ? 'border-primary-500'
                        : 'border-gray-300'
                    }`}
                >
                  {subtitleMode === opt.value && (
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                  )}
                </div>
                <span className={`font-medium text-sm ${subtitleMode === opt.value ? 'text-primary-700' : 'text-gray-700'}`}>
                  {opt.label}
                </span>
              </div>
              <span className="text-xs text-gray-400">{opt.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── 내보내기 요약 + 버튼 ── */}
      <section className="card p-6">
        {/* 설정 요약 */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <span className="bg-gray-100 px-2.5 py-1 rounded-lg font-medium">{resolution}</span>
          <ArrowRight className="w-3 h-3 text-gray-300" />
          <span className="bg-gray-100 px-2.5 py-1 rounded-lg font-medium">{ratio}</span>
          <ArrowRight className="w-3 h-3 text-gray-300" />
          <span className="bg-gray-100 px-2.5 py-1 rounded-lg font-medium">MP4 (H.264)</span>
        </div>

        {/* 내보내기 버튼 */}
        {exportComplete ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl">
              <Check className="w-5 h-5" />
              <span className="font-medium">내보내기 완료!</span>
            </div>
            <button
              onClick={() => {
                /* 다운로드 */
              }}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              MP4 다운로드
            </button>
            <button
              onClick={() => setExportComplete(false)}
              className="w-full btn-outline py-3 text-sm"
            >
              다른 설정으로 다시 내보내기
            </button>
          </div>
        ) : (
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                내보내는 중...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                영상 내보내기
              </>
            )}
          </button>
        )}
      </section>
    </div>
  );
};

export default Export;
