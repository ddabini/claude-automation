/**
 * pages/Export.tsx — 내보내기 페이지
 *
 * 영상을 업로드하고 원하는 형식(해상도, 비율, 포맷)으로 변환하여 내보냅니다.
 */
import React, { useState, useRef } from 'react';
import {
  Download,
  Monitor,
  Smartphone,
  Square,
  FileVideo,
  Check,
  Loader2,
  ArrowRight,
  Upload,
  Film,
} from 'lucide-react';
import { uploadVideo, exportVideo } from '@/services/api';
import type { VideoMeta } from '@/types';

// ─────────────────────────────────────
// 옵션 데이터
// ─────────────────────────────────────

/** 포맷 옵션 */
const formats = [
  { value: 'mp4', label: 'MP4', description: 'H.264 · 가장 호환성 좋음' },
  { value: 'webm', label: 'WebM', description: 'VP9 · 웹 최적화' },
  { value: 'mov', label: 'MOV', description: 'Apple QuickTime' },
];

/** 해상도 옵션 */
const resolutions = [
  { value: '1080p', label: '1080p (Full HD)', description: '1920x1080 · 고화질' },
  { value: '720p', label: '720p (HD)', description: '1280x720 · 경량' },
  { value: '480p', label: '480p (SD)', description: '854x480 · 초경량' },
];

/** 비율 옵션 */
const ratios = [
  { value: '16:9', label: '16:9', description: '가로 (유튜브)', icon: Monitor },
  { value: '9:16', label: '9:16', description: '세로 (쇼츠/릴스)', icon: Smartphone },
  { value: '1:1', label: '1:1', description: '정방형 (인스타)', icon: Square },
];

// ─────────────────────────────────────
// 내보내기 페이지 컴포넌트
// ─────────────────────────────────────

const Export: React.FC = () => {
  // ── 영상 상태 ──
  const [video, setVideo] = useState<VideoMeta | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 설정 상태 ──
  const [format, setFormat] = useState('mp4');
  const [resolution, setResolution] = useState('1080p');
  const [ratio, setRatio] = useState('16:9');

  // ── 내보내기 상태 ──
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [exportFileName, setExportFileName] = useState('');
  const [error, setError] = useState('');

  // ── 영상 업로드 ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');
    setExportComplete(false);

    try {
      const result = await uploadVideo(file);
      if (result.success) {
        setVideo(result.video);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '업로드 실패');
    } finally {
      setIsUploading(false);
    }
  };

  // ── 내보내기 실행 ──
  const handleExport = async () => {
    if (!video) return;

    setIsExporting(true);
    setExportComplete(false);
    setError('');

    try {
      const result = await exportVideo({
        videoPath: video.uploadPath,
        format,
        resolution,
        aspectRatio: ratio,
      });

      if (result.success) {
        setDownloadUrl(result.downloadUrl);
        setExportFileName(result.fileName);
        setExportComplete(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '내보내기 실패');
    } finally {
      setIsExporting(false);
    }
  };

  // ── 다운로드 ──
  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = exportFileName;
    a.click();
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
          영상을 업로드하고 원하는 형식으로 변환하세요
        </p>
      </div>

      {/* ── 영상 업로드 ── */}
      <section className="card p-6">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary-500" />
          영상 선택
        </h3>

        {video ? (
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <Film className="w-5 h-5 text-primary-500" />
              <div>
                <p className="font-medium text-sm text-gray-800">{video.fileName}</p>
                <p className="text-xs text-gray-400">
                  {video.width}x{video.height} · {Math.round(video.duration)}초 · {(video.fileSize / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-outline text-xs px-3 py-1.5"
            >
              변경
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 text-center
                       hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-2" />
            ) : (
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            )}
            <p className="text-sm text-gray-500">
              {isUploading ? '업로드 중...' : 'MP4, WebM, MOV 파일을 선택하세요'}
            </p>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </section>

      {/* ── 포맷 선택 ── */}
      <section className="card p-6">
        <h3 className="font-bold text-gray-700 mb-4">출력 포맷</h3>
        <div className="grid grid-cols-3 gap-3">
          {formats.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFormat(opt.value)}
              className={`p-4 rounded-xl border-2 text-center transition-all
                ${
                  format === opt.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-100 hover:border-primary-200'
                }`}
            >
              <p className={`font-semibold text-sm ${format === opt.value ? 'text-primary-700' : 'text-gray-700'}`}>
                {opt.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── 해상도 선택 ── */}
      <section className="card p-6">
        <h3 className="font-bold text-gray-700 mb-4">해상도</h3>
        <div className="grid grid-cols-3 gap-3">
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

      {/* ── 에러 표시 ── */}
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* ── 내보내기 요약 + 버튼 ── */}
      <section className="card p-6">
        {/* 설정 요약 */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <span className="bg-gray-100 px-2.5 py-1 rounded-lg font-medium">{format.toUpperCase()}</span>
          <ArrowRight className="w-3 h-3 text-gray-300" />
          <span className="bg-gray-100 px-2.5 py-1 rounded-lg font-medium">{resolution}</span>
          <ArrowRight className="w-3 h-3 text-gray-300" />
          <span className="bg-gray-100 px-2.5 py-1 rounded-lg font-medium">{ratio}</span>
        </div>

        {/* 내보내기 버튼 */}
        {exportComplete ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl">
              <Check className="w-5 h-5" />
              <span className="font-medium">내보내기 완료!</span>
            </div>
            <button
              onClick={handleDownload}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {exportFileName} 다운로드
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
            disabled={isExporting || !video}
            className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                변환 중...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                {video ? '영상 내보내기' : '영상을 먼저 업로드하세요'}
              </>
            )}
          </button>
        )}
      </section>
    </div>
  );
};

export default Export;
