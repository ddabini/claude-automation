/**
 * pages/SubtitleGen.tsx — 자막 편집 페이지
 *
 * 영상에 자막을 추가합니다:
 * - 수동으로 자막 입력 (시간코드 + 텍스트)
 * - SRT 파일 가져오기
 * - SRT 다운로드
 * - 영상에 자막 하드코딩
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  Captions,
  Download,
  Upload,
  Film,
  Loader2,
  Pencil,
  Check,
  X,
  Merge,
  Plus,
  Trash2,
  FileUp,
  Play,
  Pause,
} from 'lucide-react';
import { uploadVideo, burnSubtitles } from '@/services/api';
import type { SubtitleEntry, VideoMeta } from '@/types';

// ─────────────────────────────────────
// SRT 파싱 / 생성 유틸
// ─────────────────────────────────────

/** 자막 배열을 SRT 포맷 문자열로 변환 */
function subtitlesToSRT(subtitles: SubtitleEntry[]): string {
  return subtitles
    .map((s) => `${s.index}\n${s.startTime} --> ${s.endTime}\n${s.text}\n`)
    .join('\n');
}

/** SRT 문자열을 자막 배열로 파싱 */
function parseSRT(srtText: string): SubtitleEntry[] {
  const blocks = srtText.trim().split(/\n\n+/);
  return blocks.map((block, i) => {
    const lines = block.split('\n');
    // 첫 줄: 순서번호, 두 번째 줄: 시간코드, 나머지: 텍스트
    const timeLine = lines.length >= 2 ? lines[1] : '00:00:00,000 --> 00:00:00,000';
    const [start, end] = timeLine.split('-->').map((t) => t.trim());
    const text = lines.slice(2).join('\n');
    return {
      id: `sub-${Date.now()}-${i}`,
      index: i + 1,
      startTime: start || '00:00:00,000',
      endTime: end || '00:00:00,000',
      text: text || '',
    };
  });
}

/** 초를 SRT 시간코드로 변환 (00:00:01,000) */
function secondsToTimecode(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// ─────────────────────────────────────
// 자막 페이지 컴포넌트
// ─────────────────────────────────────

const SubtitleGen: React.FC = () => {
  // ── 영상 상태 ──
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // ── 플레이어 ──
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // ── 자막 목록 ──
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  // ── 처리 상태 ──
  const [isBurning, setIsBurning] = useState(false);
  const [resultUrl, setResultUrl] = useState('');

  // ── 영상 업로드 ──
  const handleVideoSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(localUrl);
    setResultUrl('');

    setIsUploading(true);
    try {
      const { video } = await uploadVideo(file);
      setVideoMeta(video);
    } catch {
      // 서버 없어도 로컬 미리보기 가능
    } finally {
      setIsUploading(false);
    }
  }, []);

  // ── SRT 파일 가져오기 ──
  const handleImportSRT = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const parsed = parseSRT(text);
      setSubtitles(parsed);
    };
    reader.readAsText(file);
  };

  // ── 새 자막 추가 ──
  const addSubtitle = () => {
    const newIndex = subtitles.length + 1;
    const startSec = currentTime;
    const endSec = currentTime + 3; // 기본 3초 길이

    setSubtitles((prev) => [
      ...prev,
      {
        id: `sub-${Date.now()}`,
        index: newIndex,
        startTime: secondsToTimecode(startSec),
        endTime: secondsToTimecode(endSec),
        text: '',
      },
    ]);
  };

  // ── 자막 삭제 ──
  const deleteSubtitle = (id: string) => {
    setSubtitles((prev) =>
      prev
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, index: i + 1 }))
    );
  };

  // ── 수정 시작 ──
  const startEditing = (sub: SubtitleEntry) => {
    setEditingId(sub.id);
    setEditText(sub.text);
    setEditStart(sub.startTime);
    setEditEnd(sub.endTime);
  };

  // ── 수정 저장 ──
  const saveEditing = () => {
    if (!editingId) return;
    setSubtitles((prev) =>
      prev.map((s) =>
        s.id === editingId
          ? { ...s, text: editText, startTime: editStart, endTime: editEnd }
          : s
      )
    );
    setEditingId(null);
  };

  // ── SRT 다운로드 ──
  const handleDownloadSRT = () => {
    const srt = subtitlesToSRT(subtitles);
    const blob = new Blob([srt], { type: 'text/srt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vela-subtitle-${Date.now()}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── 영상에 자막 하드코딩 ──
  const handleBurn = useCallback(async () => {
    if (!videoMeta || subtitles.length === 0) return;

    setIsBurning(true);
    setResultUrl('');
    try {
      const result = await burnSubtitles(videoMeta.uploadPath, subtitles);
      setResultUrl(`http://localhost:3001${result.downloadUrl}`);
    } catch {
      alert('자막 하드코딩에 실패했습니다.');
    } finally {
      setIsBurning(false);
    }
  }, [videoMeta, subtitles]);

  // ── 재생 토글 ──
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) v.pause();
    else v.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="h-full flex">
      {/* ────────────────────────────────
          좌측: 영상 + 자막 목록
          ──────────────────────────────── */}
      <div className="w-[480px] shrink-0 border-r border-gray-100 bg-white overflow-y-auto">
        <div className="p-6 space-y-5">
          {/* ── 영상 업로드 ── */}
          <section>
            <label className="block text-sm font-bold text-gray-700 mb-3">영상 파일</label>
            {videoFile ? (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Film className="w-5 h-5 text-primary-500 shrink-0" />
                <p className="text-sm text-gray-700 truncate flex-1">{videoFile.name}</p>
                <button
                  onClick={() => { setVideoFile(null); setVideoUrl(''); setVideoMeta(null); }}
                  className="p-1 hover:bg-gray-200 rounded-lg"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary-300 transition-all">
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-sm text-gray-500">영상 업로드 (MP4, WebM, MOV)</span>
                <input type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
              </label>
            )}
            {isUploading && (
              <div className="flex items-center gap-2 mt-2 text-sm text-primary-600">
                <Loader2 className="w-4 h-4 animate-spin" /> 업로드 중...
              </div>
            )}
          </section>

          {/* ── SRT 가져오기 + 자막 추가 버튼 ── */}
          <section className="flex gap-2">
            <label className="flex-1 btn-outline py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer">
              <FileUp className="w-4 h-4" />
              SRT 가져오기
              <input type="file" accept=".srt" onChange={handleImportSRT} className="hidden" />
            </label>
            <button
              onClick={addSubtitle}
              className="flex-1 btn-outline py-2.5 text-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              자막 추가
            </button>
          </section>

          {/* ── 자막 목록 ── */}
          <section className="space-y-2">
            {subtitles.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                자막이 없습니다. "자막 추가" 또는 SRT 파일을 가져오세요.
              </p>
            ) : (
              subtitles.map((sub) => (
                <div key={sub.id} className="card p-3 hover:shadow-sm transition-shadow">
                  {editingId === sub.id ? (
                    /* 수정 모드 */
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          value={editStart}
                          onChange={(e) => setEditStart(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs font-mono"
                          placeholder="00:00:01,000"
                        />
                        <span className="text-gray-300 self-center">→</span>
                        <input
                          value={editEnd}
                          onChange={(e) => setEditEnd(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs font-mono"
                          placeholder="00:00:04,000"
                        />
                      </div>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full px-2 py-1 border border-primary-200 rounded text-sm resize-none"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex gap-1 justify-end">
                        <button onClick={saveEditing} className="p-1.5 hover:bg-emerald-50 rounded text-emerald-500">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 hover:bg-red-50 rounded text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 보기 모드 */
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 rounded bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center">
                          {sub.index}
                        </span>
                        <span className="text-xs font-mono text-gray-400">{sub.startTime}</span>
                        <span className="text-xs text-gray-300">→</span>
                        <span className="text-xs font-mono text-gray-400">{sub.endTime}</span>
                        <div className="ml-auto flex gap-0.5">
                          <button onClick={() => startEditing(sub)} className="p-1 hover:bg-gray-100 rounded">
                            <Pencil className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                          <button onClick={() => deleteSubtitle(sub.id)} className="p-1 hover:bg-red-50 rounded">
                            <Trash2 className="w-3.5 h-3.5 text-red-300" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 pl-8">
                        {sub.text || <span className="text-gray-300 italic">텍스트를 입력하세요</span>}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </section>

          {/* ── 내보내기 옵션 ── */}
          {subtitles.length > 0 && (
            <section className="space-y-2 pt-3 border-t border-gray-100">
              <button onClick={handleDownloadSRT} className="w-full btn-outline py-2.5 text-sm flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                SRT 다운로드
              </button>
              {videoMeta && (
                <button onClick={handleBurn} disabled={isBurning} className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2">
                  {isBurning ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> 자막 입히는 중...</>
                  ) : (
                    <><Merge className="w-4 h-4" /> 영상에 자막 합치기</>
                  )}
                </button>
              )}
              {resultUrl && (
                <a href={resultUrl} download className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> 결과 다운로드
                </a>
              )}
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
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg relative">
              <video
                ref={videoRef}
                src={videoUrl}
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                onEnded={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
              />
              {/* 현재 시간에 해당하는 자막 오버레이 */}
              {subtitles.map((sub) => {
                // 간단 파싱: 시간코드를 초로 변환
                const toSec = (tc: string) => {
                  const [time, ms] = tc.split(',');
                  const parts = time.split(':').map(Number);
                  return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0) + (Number(ms) || 0) / 1000;
                };
                const start = toSec(sub.startTime);
                const end = toSec(sub.endTime);
                if (currentTime >= start && currentTime <= end) {
                  return (
                    <div
                      key={sub.id}
                      className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm max-w-md text-center"
                    >
                      {sub.text}
                    </div>
                  );
                }
                return null;
              })}
            </div>
            <div className="flex justify-center">
              <button onClick={togglePlay} className="p-3 bg-primary-500 hover:bg-primary-600 rounded-full text-white">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 mx-auto">
              <Captions className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium text-lg">자막 편집기</p>
            <p className="text-gray-400 text-sm mt-2 max-w-sm">
              영상을 업로드하고 자막을 추가하면
              <br />
              실시간으로 미리볼 수 있습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubtitleGen;
