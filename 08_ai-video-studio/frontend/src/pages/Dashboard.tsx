/**
 * pages/Dashboard.tsx — 대시보드 (메인 화면)
 *
 * 사용자가 앱에 처음 들어왔을 때 보는 화면입니다.
 * 3가지 핵심 기능(컷편집, 오디오, 자막)으로 빠르게 이동할 수 있습니다.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scissors,
  Volume2,
  Captions,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

// ─────────────────────────────────────
// 빠른 시작 카드 데이터
// ─────────────────────────────────────

const quickStartCards = [
  {
    id: 'editor',
    title: '컷 편집',
    description: '영상을 업로드하고 원하는 구간만 잘라서 저장합니다',
    icon: Scissors,
    path: '/editor',
    gradient: 'from-primary-500 to-violet-600',
  },
  {
    id: 'audio',
    title: '오디오 편집',
    description: '볼륨 조절, BGM 추가, 페이드 인/아웃 효과를 적용합니다',
    icon: Volume2,
    path: '/audio',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'subtitle',
    title: '자막',
    description: '자막을 직접 입력하거나 SRT를 가져와서 영상에 입힙니다',
    icon: Captions,
    path: '/subtitle',
    gradient: 'from-emerald-500 to-teal-500',
  },
];

// ─────────────────────────────────────
// 대시보드 컴포넌트
// ─────────────────────────────────────

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-10">
      {/* ── 헤더 ── */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              VELA 영상 편집기
            </h2>
            <p className="text-gray-500 text-sm">
              영상을 업로드하고 편집하세요. 어떤 작업을 시작할까요?
            </p>
          </div>
        </div>

        {/* ── 빠른 시작 카드 3개 ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickStartCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => navigate(card.path)}
                className="card p-7 text-left group hover:shadow-lg hover:border-primary-100
                           transition-all duration-300 hover:-translate-y-1"
              >
                {/* 아이콘 */}
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient}
                              flex items-center justify-center mb-5 shadow-sm`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* 제목 + 화살표 */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800">{card.title}</h3>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
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

      {/* ── 사용법 안내 ── */}
      <section className="card p-8">
        <h3 className="font-bold text-gray-800 mb-4">사용 순서</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: '1', title: '영상 업로드', desc: 'MP4, WebM, MOV 파일' },
            { step: '2', title: '컷 편집', desc: '원하는 구간 자르기' },
            { step: '3', title: '오디오/자막', desc: 'BGM, 볼륨, 자막 추가' },
            { step: '4', title: '내보내기', desc: '원하는 형식으로 저장' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center mx-auto mb-3">
                {item.step}
              </div>
              <p className="font-semibold text-gray-700 text-sm">{item.title}</p>
              <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
