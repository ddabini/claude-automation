/**
 * pages/ImageToVideo.tsx — 이미지 → 영상 변환 페이지
 *
 * 사용자가 이미지를 업로드하면 AI가 모션을 추가하여 영상으로 만들어줍니다.
 *
 * 플로우:
 * 1. 이미지 업로드 (드래그앤드롭 or 파일 선택)
 * 2. 모션 스타일 선택 (Zoom In / Zoom Out / Pan Left 등)
 * 3. 영상 길이 선택 (3초 / 5초 / 10초)
 * 4. "영상 생성하기" 버튼 → 진행률 → 완료 후 미리보기
 */
import React, { useState, useCallback } from 'react';
import { Sparkles, Zap, AlertCircle } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { requestImageToVideo } from '@/services/api';
import { subscribeToJob } from '@/services/socket';
import FileUpload from '@/components/FileUpload';
import VideoPreview from '@/components/VideoPreview';
import StyleSelector, { type StyleOption } from '@/components/StyleSelector';
import type { MotionStyle, VideoDuration } from '@/types';

// ─────────────────────────────────────
// 옵션 데이터
// ─────────────────────────────────────

/** 모션 스타일 옵션 5가지 */
const motionOptions: StyleOption[] = [
  {
    value: 'zoom-in',
    label: 'Zoom In',
    description: '점점 가까이',
    iconName: 'zoom-in',
  },
  {
    value: 'zoom-out',
    label: 'Zoom Out',
    description: '점점 멀리',
    iconName: 'zoom-out',
  },
  {
    value: 'pan-left',
    label: 'Pan Left',
    description: '좌측으로 이동',
    iconName: 'move-left',
  },
  {
    value: 'pan-right',
    label: 'Pan Right',
    description: '우측으로 이동',
    iconName: 'move-right',
  },
  {
    value: 'cinematic-float',
    label: 'Cinematic Float',
    description: '부드럽게 부유',
    iconName: 'wind',
  },
];

/** 영상 길이 옵션 */
const durationOptions: { value: VideoDuration; label: string }[] = [
  { value: 3, label: '3초' },
  { value: 5, label: '5초' },
  { value: 10, label: '10초' },
];

// ─────────────────────────────────────
// 이미지→영상 페이지 컴포넌트
// ─────────────────────────────────────

const ImageToVideo: React.FC = () => {
  // ── 입력값 상태 ──
  const [imageFile, setImageFile] = useState<File | null>(null);          // 업로드된 이미지
  const [motionStyle, setMotionStyle] = useState<MotionStyle>('zoom-in'); // 모션 스타일
  const [duration, setDuration] = useState<VideoDuration>(5);            // 영상 길이

  // ── UI 상태 ──
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── 전역 상태 ──
  const { generationJob, updateGenerationJob, resetGenerationJob } =
    useProjectStore();

  // ── 영상 생성 요청 ──
  const handleGenerate = useCallback(async () => {
    if (!imageFile) return;

    setIsSubmitting(true);
    resetGenerationJob();

    try {
      const { jobId, estimatedSeconds } = await requestImageToVideo(
        imageFile,
        motionStyle,
        duration
      );

      updateGenerationJob({
        jobId,
        status: 'generating',
        progress: 0,
        estimatedSeconds,
      });

      // 실시간 진행률 구독
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
      // 백엔드 미연동 — 데모 시뮬레이션
      simulateGeneration();
    } finally {
      setIsSubmitting(false);
    }
  }, [imageFile, motionStyle, duration, resetGenerationJob, updateGenerationJob]);

  // ── 데모 시뮬레이션 ──
  const simulateGeneration = () => {
    updateGenerationJob({
      jobId: 'demo-img-' + Date.now(),
      status: 'preparing',
      progress: 0,
      estimatedSeconds: 8,
    });

    setTimeout(() => {
      updateGenerationJob({ status: 'generating', progress: 30, estimatedSeconds: 6 });
    }, 1500);

    setTimeout(() => {
      updateGenerationJob({ progress: 60, estimatedSeconds: 3 });
    }, 3500);

    setTimeout(() => {
      updateGenerationJob({ status: 'processing', progress: 90, estimatedSeconds: 1 });
    }, 5500);

    setTimeout(() => {
      updateGenerationJob({
        status: 'completed',
        progress: 100,
        estimatedSeconds: 0,
        resultUrl:
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      });
    }, 7000);
  };

  // ── 다운로드 ──
  const handleDownload = () => {
    if (generationJob.resultUrl) {
      const a = document.createElement('a');
      a.href = generationJob.resultUrl;
      a.download = `vela-image-video-${Date.now()}.mp4`;
      a.click();
    }
  };

  // 생성 버튼 비활성화 조건
  const isGenerating =
    generationJob.status !== 'idle' &&
    generationJob.status !== 'completed' &&
    generationJob.status !== 'failed';
  const canGenerate = imageFile !== null && !isGenerating && !isSubmitting;

  return (
    <div className="h-full flex">
      {/* ────────────────────────────────
          좌측: 설정 패널
          ──────────────────────────────── */}
      <div className="w-[440px] shrink-0 border-r border-gray-100 bg-white overflow-y-auto">
        <div className="p-6 space-y-7">
          {/* ── 섹션 1: 이미지 업로드 ── */}
          <section>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              이미지 업로드
            </label>
            <FileUpload
              accept="image/jpeg,image/png,image/webp"
              label="이미지를 업로드하세요"
              sublabel="JPG, PNG, WebP · 최대 10MB"
              icon="image"
              file={imageFile}
              onFileSelect={setImageFile}
              maxSizeMB={10}
            />
          </section>

          {/* ── 섹션 2: 모션 스타일 선택 ── */}
          <section>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              모션 스타일
            </label>
            <StyleSelector
              options={motionOptions}
              selected={motionStyle}
              onChange={(v) => setMotionStyle(v as MotionStyle)}
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
                  className={`flex-1 py-3 rounded-xl border-2 text-center font-bold transition-all
                    ${
                      duration === opt.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-100 bg-white text-gray-600 hover:border-primary-200'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* ── 생성 버튼 ── */}
          <section className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
              <span>
                이미지에 모션을 추가하여 {duration}초 영상을 만듭니다
              </span>
            </div>

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

            {(generationJob.status === 'completed' ||
              generationJob.status === 'failed') && (
              <button
                onClick={() => {
                  resetGenerationJob();
                  setImageFile(null);
                }}
                className="w-full btn-outline py-3 text-sm"
              >
                새로운 영상 만들기
              </button>
            )}
          </section>
        </div>
      </div>

      {/* ────────────────────────────────
          우측: 영상 미리보기
          ──────────────────────────────── */}
      <div className="flex-1 bg-gray-50 p-8 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <VideoPreview
            job={generationJob}
            onDownload={handleDownload}
            onEdit={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageToVideo;
