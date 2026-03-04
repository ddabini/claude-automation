/**
 * pages/SubtitleGen.tsx — AI 자막 생성 페이지
 *
 * 영상을 업로드하면 AI(Whisper)가 음성을 인식하여 자동으로 자막을 만듭니다.
 *
 * 플로우:
 * 1. 영상 파일 업로드
 * 2. "자막 생성하기" 버튼
 * 3. 자막 결과를 에디터에서 수정 (시간코드 + 텍스트)
 * 4. SRT 다운로드 또는 "영상에 자막 합치기"
 */
import React, { useState, useCallback } from 'react';
import {
  Captions,
  Download,
  Film,
  Loader2,
  Pencil,
  Check,
  X,
  Merge,
} from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import type { SubtitleEntry } from '@/types';

// ─────────────────────────────────────
// 더미 자막 데이터 (백엔드 연동 전 테스트용)
// ─────────────────────────────────────

const dummySubtitles: SubtitleEntry[] = [
  {
    id: '1',
    index: 1,
    startTime: '00:00:01,000',
    endTime: '00:00:04,500',
    text: '안녕하세요, 오늘은 AI 영상 제작 플랫폼을 소개합니다.',
  },
  {
    id: '2',
    index: 2,
    startTime: '00:00:05,000',
    endTime: '00:00:09,200',
    text: '텍스트 한 줄만 입력하면 멋진 영상이 만들어집니다.',
  },
  {
    id: '3',
    index: 3,
    startTime: '00:00:09,500',
    endTime: '00:00:13,800',
    text: '이미지에 모션을 추가하는 것도 가능합니다.',
  },
  {
    id: '4',
    index: 4,
    startTime: '00:00:14,000',
    endTime: '00:00:18,500',
    text: '자동 자막 생성부터 편집까지, VELA로 모든 것을 해결하세요.',
  },
];

// ─────────────────────────────────────
// 자막 → SRT 파일 포맷 변환
// ─────────────────────────────────────

/**
 * 자막 데이터를 SRT(SubRip) 포맷 문자열로 변환합니다.
 * SRT 형식 예:
 * 1
 * 00:00:01,000 --> 00:00:04,500
 * 안녕하세요
 */
function subtitlesToSRT(subtitles: SubtitleEntry[]): string {
  return subtitles
    .map(
      (s) =>
        `${s.index}\n${s.startTime} --> ${s.endTime}\n${s.text}\n`
    )
    .join('\n');
}

// ─────────────────────────────────────
// 자막 생성 페이지 컴포넌트
// ─────────────────────────────────────

const SubtitleGen: React.FC = () => {
  // ── 상태 ──
  const [videoFile, setVideoFile] = useState<File | null>(null);        // 업로드된 영상
  const [isGenerating, setIsGenerating] = useState(false);              // 생성 중 여부
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);      // 생성된 자막
  const [editingId, setEditingId] = useState<string | null>(null);      // 수정 중인 자막 ID
  const [editText, setEditText] = useState('');                         // 수정 중인 텍스트
  const [isMerging, setIsMerging] = useState(false);                    // 자막 합치기 중

  // ── 자막 생성 요청 ──
  const handleGenerate = useCallback(async () => {
    if (!videoFile) return;

    setIsGenerating(true);
    setSubtitles([]);

    try {
      // TODO: 백엔드 연동 시 실제 API 호출로 교체
      // const { jobId } = await requestSubtitleGeneration(videoFile);
      // ... polling or socket for result ...

      // 데모: 2초 후 더미 자막 표시
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSubtitles(dummySubtitles);
    } catch {
      // 에러 처리
      alert('자막 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  }, [videoFile]);

  // ── 자막 텍스트 수정 시작 ──
  const startEditing = (subtitle: SubtitleEntry) => {
    setEditingId(subtitle.id);
    setEditText(subtitle.text);
  };

  // ── 자막 텍스트 수정 완료 ──
  const saveEditing = () => {
    if (editingId) {
      setSubtitles((prev) =>
        prev.map((s) =>
          s.id === editingId ? { ...s, text: editText } : s
        )
      );
      setEditingId(null);
      setEditText('');
    }
  };

  // ── 수정 취소 ──
  const cancelEditing = () => {
    setEditingId(null);
    setEditText('');
  };

  // ── SRT 파일 다운로드 ──
  const handleDownloadSRT = () => {
    const srtContent = subtitlesToSRT(subtitles);
    const blob = new Blob([srtContent], { type: 'text/srt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vela-subtitle-${Date.now()}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── 영상에 자막 합치기 ──
  const handleMerge = async () => {
    setIsMerging(true);
    try {
      // TODO: 백엔드 연동 시 실제 API 호출
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert('자막이 영상에 합쳐졌습니다! (데모)');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* ────────────────────────────────
          좌측: 업로드 + 생성 패널
          ──────────────────────────────── */}
      <div className="w-[440px] shrink-0 border-r border-gray-100 bg-white overflow-y-auto">
        <div className="p-6 space-y-7">
          {/* ── 영상 업로드 ── */}
          <section>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              영상 업로드
            </label>
            <FileUpload
              accept="video/mp4,video/webm,video/quicktime"
              label="영상 파일을 업로드하세요"
              sublabel="MP4, WebM, MOV · 최대 500MB"
              icon="video"
              file={videoFile}
              onFileSelect={setVideoFile}
              maxSizeMB={500}
            />
          </section>

          {/* ── 자막 생성 버튼 ── */}
          <section>
            <button
              onClick={handleGenerate}
              disabled={!videoFile || isGenerating}
              className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  자막 생성 중...
                </>
              ) : (
                <>
                  <Captions className="w-5 h-5" />
                  자막 생성하기
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              OpenAI Whisper 기반 · 한국어 정확도 약 88~92%
            </p>
          </section>

          {/* ── 자막이 생성된 후: 내보내기 옵션 ── */}
          {subtitles.length > 0 && (
            <section className="space-y-3 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-700">내보내기</h3>

              {/* SRT 다운로드 */}
              <button
                onClick={handleDownloadSRT}
                className="w-full btn-outline py-3 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                SRT 파일 다운로드
              </button>

              {/* 영상에 자막 합치기 */}
              <button
                onClick={handleMerge}
                disabled={isMerging}
                className="w-full btn-outline py-3 flex items-center justify-center gap-2"
              >
                {isMerging ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    합치는 중...
                  </>
                ) : (
                  <>
                    <Merge className="w-4 h-4" />
                    영상에 자막 합치기
                  </>
                )}
              </button>
            </section>
          )}
        </div>
      </div>

      {/* ────────────────────────────────
          우측: 자막 편집 에디터
          ──────────────────────────────── */}
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        {subtitles.length === 0 ? (
          // ── 빈 상태 ──
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 animate-float">
              <Captions className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium text-lg">자막 에디터</p>
            <p className="text-gray-400 text-sm mt-2 max-w-sm">
              영상을 업로드하고 자막을 생성하면
              <br />
              여기에서 시간코드와 텍스트를 수정할 수 있습니다
            </p>
          </div>
        ) : (
          // ── 자막 목록 에디터 ──
          <div className="p-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Film className="w-4 h-4 text-primary-500" />
                자막 편집
                <span className="text-sm font-normal text-gray-400">
                  ({subtitles.length}개)
                </span>
              </h3>
            </div>

            {/* 자막 항목 목록 */}
            <div className="space-y-3">
              {subtitles.map((subtitle) => (
                <div
                  key={subtitle.id}
                  className="card p-4 hover:shadow-md transition-shadow"
                >
                  {/* 상단: 순서 번호 + 시간코드 */}
                  <div className="flex items-center gap-3 mb-2">
                    {/* 순서 번호 */}
                    <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary-600 text-xs font-bold flex items-center justify-center">
                      {subtitle.index}
                    </span>

                    {/* 시작 시간 */}
                    <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      {subtitle.startTime}
                    </span>
                    <span className="text-xs text-gray-300">→</span>
                    {/* 끝 시간 */}
                    <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      {subtitle.endTime}
                    </span>

                    {/* 수정 버튼 */}
                    <div className="ml-auto">
                      {editingId === subtitle.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={saveEditing}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500"
                            title="저장"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                            title="취소"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(subtitle)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                          title="수정"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 하단: 자막 텍스트 (수정 가능) */}
                  {editingId === subtitle.id ? (
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
                      rows={2}
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed pl-10">
                      {subtitle.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubtitleGen;
