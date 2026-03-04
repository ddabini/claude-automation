/**
 * pages/Dashboard.tsx — 대시보드 (메인 화면)
 *
 * 사용자가 앱에 들어왔을 때 처음 보는 화면입니다.
 * - 빠른 시작: 영상 생성 유형 3가지 카드
 * - 최근 프로젝트: 작업했던 프로젝트 목록
 * - 사용량: 이번 달 생성 수, 저장 용량, 비용
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Type,
  Image,
  Scissors,
  ArrowRight,
  Film,
  Clock,
  HardDrive,
  Sparkles,
  TrendingUp,
  FolderOpen,
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

// ─────────────────────────────────────
// 빠른 시작 카드 데이터
// ─────────────────────────────────────

/** 빠른 시작 카드 3개의 정보 */
const quickStartCards = [
  {
    id: 'text-to-video',
    title: '텍스트 → 영상',
    description: '텍스트를 입력하면 AI가 영상을 만들어줍니다',
    icon: Type,
    path: '/text-to-video',
    gradient: 'from-primary-500 to-violet-600',
    bgLight: 'bg-primary-50',
  },
  {
    id: 'image-to-video',
    title: '이미지 → 영상',
    description: '이미지에 모션을 추가하여 영상으로 변환합니다',
    icon: Image,
    path: '/image-to-video',
    gradient: 'from-blue-500 to-cyan-500',
    bgLight: 'bg-blue-50',
  },
  {
    id: 'subtitle',
    title: '자막 생성',
    description: '영상의 음성을 인식하여 자동으로 자막을 만듭니다',
    icon: Scissors,
    path: '/subtitle',
    gradient: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-50',
  },
];

// ─────────────────────────────────────
// 더미 최근 프로젝트 (백엔드 연동 전 임시 데이터)
// ─────────────────────────────────────

const dummyProjects = [
  {
    id: '1',
    name: '브랜드 소개 영상',
    type: 'text-to-video' as const,
    status: 'completed' as const,
    updatedAt: '2시간 전',
    thumbnailColor: 'bg-gradient-to-br from-purple-400 to-pink-400',
  },
  {
    id: '2',
    name: '제품 사진 모션',
    type: 'image-to-video' as const,
    status: 'completed' as const,
    updatedAt: '어제',
    thumbnailColor: 'bg-gradient-to-br from-blue-400 to-cyan-400',
  },
  {
    id: '3',
    name: '인터뷰 영상 자막',
    type: 'subtitle' as const,
    status: 'completed' as const,
    updatedAt: '3일 전',
    thumbnailColor: 'bg-gradient-to-br from-emerald-400 to-teal-400',
  },
];

// ─────────────────────────────────────
// 타입별 한국어 라벨
// ─────────────────────────────────────

const typeLabels: Record<string, string> = {
  'text-to-video': '텍스트 → 영상',
  'image-to-video': '이미지 → 영상',
  subtitle: '자막 생성',
};

const statusLabels: Record<string, { text: string; color: string }> = {
  completed: { text: '완료', color: 'bg-emerald-100 text-emerald-700' },
  generating: { text: '생성 중', color: 'bg-amber-100 text-amber-700' },
  failed: { text: '실패', color: 'bg-red-100 text-red-700' },
};

// ─────────────────────────────────────
// 대시보드 컴포넌트
// ─────────────────────────────────────

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { usageStats } = useProjectStore();

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10">
      {/* ────────────────────────────────
          인사 + 빠른 시작 섹션
          ──────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              텍스트에서 스크린으로
            </h2>
            <p className="text-gray-500 text-sm">
              AI로 영상을 만들어보세요. 어떤 작업을 시작할까요?
            </p>
          </div>
        </div>

        {/* 빠른 시작 카드 3개 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {quickStartCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => navigate(card.path)}
                className="card p-6 text-left group hover:shadow-lg hover:border-primary-100
                           transition-all duration-300 hover:-translate-y-1"
              >
                {/* 아이콘 — 그라데이션 배경 */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient}
                              flex items-center justify-center mb-4 shadow-sm`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* 제목 + 화살표 */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-800">{card.title}</h3>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                </div>

                {/* 설명 */}
                <p className="text-sm text-gray-500 leading-relaxed">
                  {card.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ────────────────────────────────
          사용량 요약 + 최근 프로젝트
          ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── 사용량 요약 (좌측 1칸) ── */}
        <section className="space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            이번 달 사용량
          </h3>

          {/* 영상 생성 수 */}
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                <Film className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">생성한 영상</p>
                <p className="text-xl font-bold text-gray-800">
                  {usageStats.videosGenerated}
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    개
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* 저장 용량 */}
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">저장 공간</p>
                <p className="text-xl font-bold text-gray-800">
                  {(usageStats.storageUsedMB / 1024).toFixed(1)}
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    / {(usageStats.storageLimitMB / 1024).toFixed(0)}GB
                  </span>
                </p>
              </div>
            </div>
            {/* 용량 바 */}
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (usageStats.storageUsedMB / usageStats.storageLimitMB) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* 예상 비용 */}
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">이번 달 예상 비용</p>
                <p className="text-xl font-bold text-gray-800">
                  ${usageStats.estimatedCost.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 최근 프로젝트 (우측 2칸) ── */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-primary-500" />
              최근 프로젝트
            </h3>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              전체 보기
            </button>
          </div>

          {/* 프로젝트가 없을 때 — 빈 상태 */}
          {dummyProjects.length === 0 ? (
            <div className="card p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">
                아직 프로젝트가 없습니다
              </p>
              <p className="text-gray-400 text-sm mt-1">
                위의 빠른 시작을 눌러 첫 영상을 만들어보세요
              </p>
            </div>
          ) : (
            /* 프로젝트 목록 */
            <div className="space-y-3">
              {dummyProjects.map((project) => {
                const status = statusLabels[project.status];
                return (
                  <div
                    key={project.id}
                    className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    {/* 썸네일 (색상 그라데이션으로 대체) */}
                    <div
                      className={`w-20 h-14 rounded-lg ${project.thumbnailColor} flex items-center justify-center shrink-0`}
                    >
                      <Film className="w-6 h-6 text-white/80" />
                    </div>

                    {/* 프로젝트 정보 */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate group-hover:text-primary-600 transition-colors">
                        {project.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">
                          {typeLabels[project.type]}
                        </span>
                        <span className="text-xs text-gray-300">|</span>
                        <span className="text-xs text-gray-400">
                          {project.updatedAt}
                        </span>
                      </div>
                    </div>

                    {/* 상태 뱃지 */}
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${status.color}`}
                    >
                      {status.text}
                    </span>

                    {/* 화살표 */}
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
