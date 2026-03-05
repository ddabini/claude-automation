/**
 * pages/VideoEditor.tsx — 컷편집 페이지
 *
 * 영상을 업로드하고 원하는 구간만 잘라내는 페이지입니다.
 *
 * 좌측 패널:
 *   - 영상 업로드
 *   - 트림 시작/끝 시간 설정
 *   - "자르기 실행" 버튼
 *
 * 우측 패널:
 *   - 영상 플레이어 + 타임라인
 *   - 결과 다운로드
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Scissors,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Download,
  Upload,
  Loader2,
  Film,
  Clock,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import { uploadVideo, trimVideo } from '@/services/api';
import type { VideoMeta } from '@/types';

// ─────────────────────────────────────
// 시간 포맷 유틸
// ─────────────────────────────────────

/** 초를 "00:00" 또는 "00:00:00" 형태로 변환 */
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─────────────────────────────────────
// 컷편집 페이지 컴포넌트
// ─────────────────────────────────────

const VideoEditor: React.FC = () => {
  // ── 영상 상태 ──
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // ── 플레이어 상태 ──
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // ── 트림 설정 ──
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  // ── 처리 상태 ──
  const [isTrimming, setIsTrimming] = useState(false);
  const [resultUrl, setResultUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  // ── 파일 선택 처리 ──
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 브라우저에서 미리보기용 URL 생성
    const localUrl = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(localUrl);
    setResultUrl('');
    setErrorMsg('');

    // 서버에 업로드하여 메타데이터 가져오기
    setIsUploading(true);
    try {
      const { video } = await uploadVideo(file);
      setVideoMeta(video);
      setTrimStart(0);
      setTrimEnd(video.duration);
    } catch {
      // 서버 업로드 실패해도 로컬 미리보기는 가능
      setErrorMsg('서버 업로드 실패. 백엔드가 실행 중인지 확인해주세요.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  // ── 비디오 로드 완료 시 duration 설정 ──
  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (v) {
      setDuration(v.duration);
      if (!videoMeta) {
        // 서버 메타 없으면 브라우저 정보 사용
        setTrimEnd(v.duration);
      }
    }
  };

  // ── 재생 시간 업데이트 ──
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (v) setCurrentTime(v.currentTime);
  };

  // ── 재생/일시정지 ──
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) {
      v.pause();
    } else {
      v.play();
    }
    setIsPlaying(!isPlaying);
  };

  // ── 5초 앞/뒤로 이동 ──
  const skip = (seconds: number) => {
    const v = videoRef.current;
    if (v) {
      v.currentTime = Math.max(0, Math.min(duration, v.currentTime + seconds));
    }
  };

  // ── 타임라인 클릭으로 시간 이동 ──
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    v.currentTime = ratio * duration;
  };

  // ── 현재 위치를 트림 시작/끝으로 설정 ──
  const setStartFromCurrent = () => setTrimStart(currentTime);
  const setEndFromCurrent = () => setTrimEnd(currentTime);

  // ── 트림 실행 ──
  const handleTrim = useCallback(async () => {
    if (!videoMeta) return;

    setIsTrimming(true);
    setResultUrl('');
    setErrorMsg('');

    try {
      const result = await trimVideo(videoMeta.uploadPath, trimStart, trimEnd);
      // 서버의 결과 파일 URL
      setResultUrl(`http://localhost:3001${result.downloadUrl}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '트림 실패';
      setErrorMsg(msg);
    } finally {
      setIsTrimming(false);
    }
  }, [videoMeta, trimStart, trimEnd]);

  // ── 구간 미리보기 (트림 구간만 재생) ──
  const previewTrimRange = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = trimStart;
    v.play();
    setIsPlaying(true);
  };

  // ── 트림 구간 끝에 도달하면 일시정지 ──
  useEffect(() => {
    if (isPlaying && currentTime >= trimEnd) {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  }, [currentTime, trimEnd, isPlaying]);

  // 트림 구간 길이
  const trimDuration = Math.max(0, trimEnd - trimStart);

  return (
    <div className="h-full flex">
      {/* ────────────────────────────────
          좌측: 설정 패널
          ──────────────────────────────── */}
      <div className="w-[380px] shrink-0 border-r border-gray-100 bg-white overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* ── 영상 업로드 ── */}
          <section>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              영상 파일
            </label>
            {videoFile ? (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Film className="w-5 h-5 text-primary-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {videoFile.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(videoFile.size / 1024 / 1024).toFixed(1)}MB
                    {videoMeta && ` · ${formatTime(videoMeta.duration)} · ${videoMeta.width}x${videoMeta.height}`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setVideoFile(null);
                    setVideoUrl('');
                    setVideoMeta(null);
                    setResultUrl('');
                    setTrimStart(0);
                    setTrimEnd(0);
                  }}
                  className="p-1 hover:bg-gray-200 rounded-lg"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-all">
                <Upload className="w-8 h-8 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">영상을 업로드하세요</p>
                  <p className="text-xs text-gray-400 mt-1">MP4, WebM, MOV · 최대 500MB</p>
                </div>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
            {isUploading && (
              <div className="flex items-center gap-2 mt-2 text-sm text-primary-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                서버에 업로드 중...
              </div>
            )}
          </section>

          {/* ── 트림 설정 ── */}
          {videoUrl && duration > 0 && (
            <section className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">
                구간 설정
              </label>

              {/* 시작 시간 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">시작 시간</span>
                  <button
                    onClick={setStartFromCurrent}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    현재 위치로 설정
                  </button>
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={trimStart}
                  onChange={(e) => setTrimStart(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <span className="text-sm font-mono text-gray-700">{formatTime(trimStart)}</span>
              </div>

              {/* 끝 시간 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">끝 시간</span>
                  <button
                    onClick={setEndFromCurrent}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    현재 위치로 설정
                  </button>
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <span className="text-sm font-mono text-gray-700">{formatTime(trimEnd)}</span>
              </div>

              {/* 구간 정보 */}
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded-xl">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <span>
                  선택 구간: <strong className="text-gray-700">{formatTime(trimDuration)}</strong>
                  {' '}({trimDuration.toFixed(1)}초)
                </span>
              </div>

              {/* 구간 미리보기 */}
              <button
                onClick={previewTrimRange}
                className="w-full btn-outline py-2.5 text-sm flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                선택 구간 미리보기
              </button>
            </section>
          )}

          {/* ── 트림 실행 버튼 ── */}
          {videoMeta && (
            <section className="space-y-3 pt-2">
              <button
                onClick={handleTrim}
                disabled={isTrimming || trimDuration <= 0}
                className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2"
              >
                {isTrimming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    자르는 중...
                  </>
                ) : (
                  <>
                    <Scissors className="w-5 h-5" />
                    영상 자르기
                  </>
                )}
              </button>
            </section>
          )}

          {/* ── 에러 메시지 ── */}
          {errorMsg && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* ── 결과 다운로드 ── */}
          {resultUrl && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl">
                <Check className="w-4 h-4" />
                트림 완료!
              </div>
              <a
                href={resultUrl}
                download
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                결과 다운로드
              </a>
            </section>
          )}
        </div>
      </div>

      {/* ────────────────────────────────
          우측: 영상 플레이어
          ──────────────────────────────── */}
      <div className="flex-1 bg-gray-50 flex flex-col">
        {videoUrl ? (
          <>
            {/* 영상 플레이어 */}
            <div className="flex-1 flex items-center justify-center p-6">
              <video
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                className="max-w-full max-h-full rounded-xl shadow-lg bg-black"
              />
            </div>

            {/* 타임라인 + 컨트롤 */}
            <div className="bg-white border-t border-gray-100 px-6 py-4 space-y-3">
              {/* 타임라인 바 */}
              <div
                className="relative w-full h-10 bg-gray-100 rounded-lg cursor-pointer overflow-hidden"
                onClick={handleTimelineClick}
              >
                {/* 트림 구간 하이라이트 */}
                {duration > 0 && (
                  <div
                    className="absolute top-0 h-full bg-primary-100"
                    style={{
                      left: `${(trimStart / duration) * 100}%`,
                      width: `${((trimEnd - trimStart) / duration) * 100}%`,
                    }}
                  />
                )}
                {/* 현재 재생 위치 */}
                {duration > 0 && (
                  <div
                    className="absolute top-0 w-0.5 h-full bg-primary-600 z-10"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  />
                )}
                {/* 트림 시작/끝 마커 */}
                {duration > 0 && (
                  <>
                    <div
                      className="absolute top-0 w-1 h-full bg-emerald-500 z-10"
                      style={{ left: `${(trimStart / duration) * 100}%` }}
                    />
                    <div
                      className="absolute top-0 w-1 h-full bg-red-400 z-10"
                      style={{ left: `${(trimEnd / duration) * 100}%` }}
                    />
                  </>
                )}
              </div>

              {/* 컨트롤 바 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => skip(-5)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <SkipBack className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="p-2.5 bg-primary-500 hover:bg-primary-600 rounded-full text-white"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button onClick={() => skip(5)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <SkipForward className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* 시간 표시 */}
                <span className="text-sm font-mono text-gray-500">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </>
        ) : (
          /* 빈 상태 */
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6">
              <Scissors className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium text-lg">컷 편집</p>
            <p className="text-gray-400 text-sm mt-2 max-w-sm">
              영상을 업로드하면 원하는 구간을
              <br />
              잘라내고 다운로드할 수 있습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoEditor;
