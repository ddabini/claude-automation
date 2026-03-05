/**
 * pages/AudioEditor.tsx — 오디오 편집 페이지
 *
 * 영상의 오디오를 편집합니다:
 * - 원본 볼륨 조절 (0~200%)
 * - BGM 추가 + 볼륨 조절
 * - 페이드 인/아웃
 *
 * 좌측: 설정 패널
 * 우측: 영상 미리보기
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  Upload,
  Download,
  Loader2,
  Film,
  X,
  Check,
  AlertCircle,
  Play,
  Pause,
} from 'lucide-react';
import { uploadVideo, editAudio } from '@/services/api';
import type { VideoMeta } from '@/types';

// ─────────────────────────────────────
// 시간 포맷
// ─────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─────────────────────────────────────
// 오디오 편집 페이지 컴포넌트
// ─────────────────────────────────────

const AudioEditor: React.FC = () => {
  // ── 영상 상태 ──
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // ── 플레이어 ──
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // ── 오디오 설정 ──
  const [volume, setVolume] = useState(100);         // 원본 볼륨 0~200%
  const [bgmFile, setBgmFile] = useState<File | null>(null);
  const [bgmVolume, setBgmVolume] = useState(50);    // BGM 볼륨 0~100%
  const [fadeIn, setFadeIn] = useState(0);            // 페이드 인 (초)
  const [fadeOut, setFadeOut] = useState(0);           // 페이드 아웃 (초)
  const [isMuted, setIsMuted] = useState(false);

  // ── 처리 상태 ──
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ── 파일 업로드 ──
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(localUrl);
    setResultUrl('');
    setErrorMsg('');

    setIsUploading(true);
    try {
      const { video } = await uploadVideo(file);
      setVideoMeta(video);
    } catch {
      setErrorMsg('서버 업로드 실패. 백엔드가 실행 중인지 확인해주세요.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  // ── 볼륨 프리뷰 (브라우저에서 실시간) ──
  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = Math.min(1, val / 100);
    }
  };

  // ── 음소거 토글 ──
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // ── 재생 토글 ──
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) v.pause();
    else v.play();
    setIsPlaying(!isPlaying);
  };

  // ── 오디오 편집 실행 ──
  const handleApply = useCallback(async () => {
    if (!videoMeta) return;

    setIsProcessing(true);
    setResultUrl('');
    setErrorMsg('');

    try {
      const result = await editAudio(
        videoMeta.uploadPath,
        { volume, bgmVolume, fadeIn, fadeOut },
        bgmFile || undefined
      );
      setResultUrl(`http://localhost:3001${result.downloadUrl}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '오디오 편집 실패';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  }, [videoMeta, volume, bgmFile, bgmVolume, fadeIn, fadeOut]);

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
                  <p className="text-sm font-medium text-gray-700 truncate">{videoFile.name}</p>
                  <p className="text-xs text-gray-400">
                    {(videoFile.size / 1024 / 1024).toFixed(1)}MB
                    {videoMeta && ` · ${formatTime(videoMeta.duration)}`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setVideoFile(null);
                    setVideoUrl('');
                    setVideoMeta(null);
                    setResultUrl('');
                    setBgmFile(null);
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
                  <p className="text-xs text-gray-400 mt-1">MP4, WebM, MOV</p>
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

          {/* ── 볼륨 조절 ── */}
          {videoUrl && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-700">원본 볼륨</label>
                <button onClick={toggleMute} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
              <div className="space-y-1">
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0%</span>
                  <span className="font-medium text-gray-700">{volume}%</span>
                  <span>200%</span>
                </div>
              </div>
            </section>
          )}

          {/* ── BGM 추가 ── */}
          {videoUrl && (
            <section className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">
                배경 음악 (BGM)
              </label>
              {bgmFile ? (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  <Music className="w-5 h-5 text-blue-500 shrink-0" />
                  <p className="text-sm text-blue-700 truncate flex-1">{bgmFile.name}</p>
                  <button
                    onClick={() => setBgmFile(null)}
                    className="p-1 hover:bg-blue-100 rounded-lg"
                  >
                    <X className="w-4 h-4 text-blue-400" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-3 p-3 border border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                  <Music className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">MP3, WAV 파일 선택</span>
                  <input
                    type="file"
                    accept="audio/mpeg,audio/wav,audio/mp3"
                    onChange={(e) => setBgmFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              )}

              {/* BGM 볼륨 */}
              {bgmFile && (
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">BGM 볼륨</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={bgmVolume}
                    onChange={(e) => setBgmVolume(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0%</span>
                    <span className="font-medium text-gray-700">{bgmVolume}%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── 페이드 인/아웃 ── */}
          {videoUrl && (
            <section className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">페이드 효과</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">페이드 인</span>
                  <select
                    value={fadeIn}
                    onChange={(e) => setFadeIn(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value={0}>없음</option>
                    <option value={1}>1초</option>
                    <option value={2}>2초</option>
                    <option value={3}>3초</option>
                    <option value={5}>5초</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">페이드 아웃</span>
                  <select
                    value={fadeOut}
                    onChange={(e) => setFadeOut(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value={0}>없음</option>
                    <option value={1}>1초</option>
                    <option value={2}>2초</option>
                    <option value={3}>3초</option>
                    <option value={5}>5초</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* ── 적용 버튼 ── */}
          {videoMeta && (
            <section className="space-y-3 pt-2">
              <button
                onClick={handleApply}
                disabled={isProcessing}
                className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5" />
                    오디오 적용하기
                  </>
                )}
              </button>
            </section>
          )}

          {/* ── 에러 ── */}
          {errorMsg && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* ── 결과 ── */}
          {resultUrl && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl">
                <Check className="w-4 h-4" />
                오디오 편집 완료!
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
          우측: 영상 미리보기
          ──────────────────────────────── */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
        {videoUrl ? (
          <div className="w-full max-w-2xl space-y-4">
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg">
              <video
                ref={videoRef}
                src={videoUrl}
                onEnded={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex justify-center">
              <button
                onClick={togglePlay}
                className="p-3 bg-primary-500 hover:bg-primary-600 rounded-full text-white"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 mx-auto">
              <Volume2 className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium text-lg">오디오 편집</p>
            <p className="text-gray-400 text-sm mt-2 max-w-sm">
              영상을 업로드하면 볼륨 조절, BGM 추가,
              <br />
              페이드 효과를 적용할 수 있습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioEditor;
