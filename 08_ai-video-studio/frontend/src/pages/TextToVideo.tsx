/**
 * pages/TextToVideo.tsx — 텍스트 → 영상 생성 페이지 (핵심 기능)
 *
 * 사용자가 텍스트를 입력하면 AI가 영상을 만들어주는 페이지입니다.
 *
 * 좌측 패널:
 *   - 프롬프트 입력 (영상 설명 텍스트)
 *   - "프롬프트 개선하기" 버튼 (AI가 더 좋은 프롬프트로 변환)
 *   - 스타일 선택 (시네마틱, 브이로그, 애니메이션, 광고, 뉴스)
 *   - 영상 길이 선택 (3초, 5초, 10초)
 *   - 해상도 선택 (1080p 16:9, 720p, 1080p 9:16)
 *   - "영상 생성하기" 버튼 + 예상 비용
 *
 * 우측 패널:
 *   - 영상 미리보기 (대기→생성중→완료 3단계)
 */
import React, { useState, useCallback } from 'react';
import { Sparkles, Wand2, Zap, AlertCircle } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { requestTextToVideo, enhancePrompt } from '@/services/api';
import { subscribeToJob } from '@/services/socket';
import VideoPreview from '@/components/VideoPreview';
import StyleSelector, { type StyleOption } from '@/components/StyleSelector';
import type { VideoStyle, VideoResolution, VideoDuration } from '@/types';

// ─────────────────────────────────────
// 옵션 데이터
// ─────────────────────────────────────

/** 영상 스타일 옵션 5가지 */
const styleOptions: StyleOption[] = [
  {
    value: 'cinematic',
    label: '시네마틱',
    description: '영화 같은 분위기',
    iconName: 'camera',
  },
  {
    value: 'vlog',
    label: '브이로그',
    description: '일상 기록 느낌',
    iconName: 'video',
  },
  {
    value: 'animation',
    label: '애니메이션',
    description: '만화 스타일',
    iconName: 'palette',
  },
  {
    value: 'commercial',
    label: '광고',
    description: '세련된 상업 영상',
    iconName: 'megaphone',
  },
  {
    value: 'news',
    label: '뉴스',
    description: '보도·인포 스타일',
    iconName: 'newspaper',
  },
];

/** 영상 길이 옵션 */
const durationOptions: { value: VideoDuration; label: string; cost: string }[] = [
  { value: 3, label: '3초', cost: '$0.15' },
  { value: 5, label: '5초', cost: '$0.25' },
  { value: 10, label: '10초', cost: '$0.50' },
];

/** 해상도 옵션 */
const resolutionOptions: {
  value: VideoResolution;
  label: string;
  description: string;
}[] = [
  { value: '1080p-16:9', label: '1080p 16:9', description: '가로 (유튜브)' },
  { value: '720p', label: '720p', description: '경량 화질' },
  { value: '1080p-9:16', label: '1080p 9:16', description: '세로 (쇼츠/릴스)' },
];

// ─────────────────────────────────────
// 예상 비용 계산
// ─────────────────────────────────────

/** 영상 길이에 따른 예상 비용 */
function estimateCost(duration: VideoDuration): string {
  const costs: Record<VideoDuration, string> = {
    3: '$0.15',
    5: '$0.25',
    10: '$0.50',
  };
  return costs[duration];
}

/** 영상 길이에 따른 예상 생성 시간 */
function estimateTime(duration: VideoDuration): string {
  const times: Record<VideoDuration, string> = {
    3: '약 30~60초',
    5: '약 40~90초',
    10: '약 60~120초',
  };
  return times[duration];
}

// ─────────────────────────────────────
// 텍스트→영상 페이지 컴포넌트
// ─────────────────────────────────────

const TextToVideo: React.FC = () => {
  // ── 입력값 상태 ──
  const [prompt, setPrompt] = useState('');                              // 프롬프트 텍스트
  const [style, setStyle] = useState<VideoStyle>('cinematic');           // 선택된 스타일
  const [duration, setDuration] = useState<VideoDuration>(5);           // 영상 길이
  const [resolution, setResolution] = useState<VideoResolution>('1080p-16:9'); // 해상도

  // ── UI 상태 ──
  const [isEnhancing, setIsEnhancing] = useState(false);                // 프롬프트 개선 중
  const [isSubmitting, setIsSubmitting] = useState(false);              // 생성 요청 전송 중

  // ── 전역 상태 (Zustand 스토어) ──
  const { generationJob, updateGenerationJob, resetGenerationJob } =
    useProjectStore();

  // ── 프롬프트 개선하기 ──
  const handleEnhancePrompt = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const result = await enhancePrompt(prompt, style);
      setPrompt(result.enhanced);
    } catch {
      // API 연결 전에는 더미 데이터로 시뮬레이션
      const enhanced = `[AI 개선] ${prompt}\n\n(시네마틱 스타일에 최적화된 프롬프트로 변환되었습니다. 카메라 앵글, 조명, 분위기 디테일이 추가됩니다.)`;
      setPrompt(enhanced);
    } finally {
      setIsEnhancing(false);
    }
  }, [prompt, style]);

  // ── 영상 생성 요청 ──
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsSubmitting(true);
    resetGenerationJob();

    try {
      // 서버에 생성 요청
      const { jobId, estimatedSeconds } = await requestTextToVideo({
        prompt,
        style,
        duration,
        resolution,
      });

      // 작업 상태를 "생성 중"으로 업데이트
      updateGenerationJob({
        jobId,
        status: 'generating',
        progress: 0,
        estimatedSeconds,
      });

      // Socket.io로 실시간 진행률 구독
      subscribeToJob(jobId, (data) => {
        updateGenerationJob({
          status: data.status as typeof generationJob.status,
          progress: data.progress,
          estimatedSeconds: data.estimatedSeconds,
          resultUrl: data.resultUrl,
          errorMessage: data.errorMessage,
        });
      });
    } catch {
      // 백엔드 미연동 상태 — 데모 시뮬레이션
      simulateGeneration();
    } finally {
      setIsSubmitting(false);
    }
  }, [prompt, style, duration, resolution, resetGenerationJob, updateGenerationJob]);

  // ── 데모용 시뮬레이션 (백엔드 연동 전 UI 테스트) ──
  const simulateGeneration = () => {
    updateGenerationJob({
      jobId: 'demo-' + Date.now(),
      status: 'preparing',
      progress: 0,
      estimatedSeconds: 10,
    });

    // 단계별 진행 시뮬레이션 (실제로는 Socket.io가 처리)
    setTimeout(() => {
      updateGenerationJob({ status: 'generating', progress: 20, estimatedSeconds: 8 });
    }, 1500);

    setTimeout(() => {
      updateGenerationJob({ progress: 50, estimatedSeconds: 5 });
    }, 3000);

    setTimeout(() => {
      updateGenerationJob({ progress: 80, estimatedSeconds: 2 });
    }, 5000);

    setTimeout(() => {
      updateGenerationJob({ status: 'processing', progress: 95, estimatedSeconds: 1 });
    }, 7000);

    setTimeout(() => {
      updateGenerationJob({
        status: 'completed',
        progress: 100,
        estimatedSeconds: 0,
        // 데모용 비디오 URL (실제로는 Firebase Storage URL)
        resultUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      });
    }, 8500);
  };

  // ── 다운로드 처리 ──
  const handleDownload = () => {
    if (generationJob.resultUrl) {
      const a = document.createElement('a');
      a.href = generationJob.resultUrl;
      a.download = `vela-video-${Date.now()}.mp4`;
      a.click();
    }
  };

  // 생성 버튼 비활성화 조건
  const isGenerating =
    generationJob.status !== 'idle' && generationJob.status !== 'completed' && generationJob.status !== 'failed';
  const canGenerate = prompt.trim().length > 0 && !isGenerating && !isSubmitting;

  return (
    <div className="h-full flex">
      {/* ────────────────────────────────
          좌측: 설정 패널
          ──────────────────────────────── */}
      <div className="w-[440px] shrink-0 border-r border-gray-100 bg-white overflow-y-auto">
        <div className="p-6 space-y-7">
          {/* ── 섹션 1: 프롬프트 입력 ── */}
          <section>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              프롬프트
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="만들고 싶은 영상을 자세히 설명해주세요.&#10;&#10;예: 해질녘 해변을 걷는 사람의 뒷모습. 황금빛 햇살이 파도에 반사되고, 바람에 머리카락이 흩날린다."
              className="w-full h-36 px-4 py-3 border border-gray-200 rounded-xl text-sm
                         placeholder:text-gray-400 resize-none
                         focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400
                         transition-all"
            />
            {/* 프롬프트 개선 버튼 */}
            <button
              onClick={handleEnhancePrompt}
              disabled={!prompt.trim() || isEnhancing}
              className="mt-2 flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700
                         font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wand2 className={`w-4 h-4 ${isEnhancing ? 'animate-spin' : ''}`} />
              {isEnhancing ? '개선 중...' : '프롬프트 개선하기'}
            </button>
          </section>

          {/* ── 섹션 2: 스타일 선택 ── */}
          <section>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              스타일
            </label>
            <StyleSelector
              options={styleOptions}
              selected={style}
              onChange={(v) => setStyle(v as VideoStyle)}
              columns={3}
            />
          </section>

          {/* ── 섹션 3: 영상 길이 ── */}
          <section>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              영상 길이
            </label>
            <div className="flex gap-3">
              {durationOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDuration(opt.value)}
                  className={`flex-1 py-3 rounded-xl border-2 text-center transition-all
                    ${
                      duration === opt.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-100 bg-white text-gray-600 hover:border-primary-200'
                    }`}
                >
                  <p className="font-bold text-lg">{opt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.cost}</p>
                </button>
              ))}
            </div>
          </section>

          {/* ── 섹션 4: 해상도 ── */}
          <section>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              해상도
            </label>
            <div className="space-y-2">
              {resolutionOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setResolution(opt.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all
                    ${
                      resolution === opt.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-100 hover:border-primary-200'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {/* 라디오 원형 표시 */}
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                        ${
                          resolution === opt.value
                            ? 'border-primary-500'
                            : 'border-gray-300'
                        }`}
                    >
                      {resolution === opt.value && (
                        <div className="w-2 h-2 rounded-full bg-primary-500" />
                      )}
                    </div>
                    <span
                      className={`font-medium text-sm ${
                        resolution === opt.value
                          ? 'text-primary-700'
                          : 'text-gray-700'
                      }`}
                    >
                      {opt.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* ── 생성 버튼 + 예상 정보 ── */}
          <section className="space-y-3 pt-2">
            {/* 예상 비용 + 시간 안내 */}
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
              <span>
                예상 비용{' '}
                <strong className="text-gray-700">
                  {estimateCost(duration)}
                </strong>{' '}
                · 생성 시간{' '}
                <strong className="text-gray-700">
                  {estimateTime(duration)}
                </strong>
              </span>
            </div>

            {/* 생성 버튼 */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2"
            >
              {isSubmitting || isGenerating ? (
                <>
                  <Zap className="w-5 h-5 animate-pulse" />
                  생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  영상 생성하기
                </>
              )}
            </button>

            {/* 생성 완료/실패 후 다시 생성 버튼 */}
            {(generationJob.status === 'completed' ||
              generationJob.status === 'failed') && (
              <button
                onClick={() => resetGenerationJob()}
                className="w-full btn-outline py-3 text-sm"
              >
                새로운 영상 만들기
              </button>
            )}
          </section>
        </div>
      </div>

      {/* ────────────────────────────────
          우측: 영상 미리보기 패널
          ──────────────────────────────── */}
      <div className="flex-1 bg-gray-50 p-8 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <VideoPreview
            job={generationJob}
            onDownload={handleDownload}
            onEdit={() => {
              /* Phase 2: 편집 화면으로 이동 */
            }}
          />

          {/* 생성 중일 때 하단 팁 메시지 */}
          {isGenerating && (
            <p className="text-center text-sm text-gray-400 mt-6">
              AI가 영상을 생성하는 동안 다른 작업을 할 수 있습니다.
              <br />
              완료되면 알려드립니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextToVideo;
