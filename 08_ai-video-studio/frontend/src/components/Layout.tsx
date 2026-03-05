/**
 * components/Layout.tsx — 앱 전체 레이아웃 (뼈대)
 *
 * 모든 페이지에 공통으로 적용되는 구조입니다:
 * - 좌측: 사이드바 (메뉴, 로고)
 * - 우측: 헤더 + 메인 콘텐츠
 *
 * 사이드바를 접거나 펼칠 수 있어서 넓은 작업 공간이 필요할 때 유용합니다.
 */
import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Scissors,
  Volume2,
  Captions,
  Download,
  PanelLeftClose,
  PanelLeft,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

// ─────────────────────────────────────
// 사이드바 메뉴 목록
// ─────────────────────────────────────

/** 사이드바에 표시할 메뉴 항목들 */
const menuItems = [
  {
    id: 'dashboard',
    label: '대시보드',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    id: 'editor',
    label: '컷 편집',
    icon: Scissors,
    path: '/editor',
  },
  {
    id: 'audio',
    label: '오디오',
    icon: Volume2,
    path: '/audio',
  },
  {
    id: 'subtitle',
    label: '자막',
    icon: Captions,
    path: '/subtitle',
  },
  {
    id: 'export',
    label: '내보내기',
    icon: Download,
    path: '/export',
  },
];

// ─────────────────────────────────────
// 현재 경로에 해당하는 페이지 이름 찾기
// ─────────────────────────────────────

/** URL 경로를 보고 현재 페이지 이름을 반환합니다 */
function getPageTitle(pathname: string): string {
  const item = menuItems.find((m) => m.path === pathname);
  return item?.label || 'VELA';
}

// ─────────────────────────────────────
// 레이아웃 컴포넌트
// ─────────────────────────────────────

const Layout: React.FC = () => {
  // 현재 URL 경로 확인 (어떤 페이지에 있는지 알기 위해)
  const location = useLocation();
  // 사이드바 접힘 상태 + 토글 함수
  const { sidebarCollapsed, toggleSidebar } = useProjectStore();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ────────────────────────────────
          좌측 사이드바
          ──────────────────────────────── */}
      <aside
        className={`
          flex flex-col bg-white border-r border-gray-100
          transition-all duration-300 ease-in-out shrink-0
          ${sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'}
        `}
      >
        {/* ── 로고 영역 ── */}
        <div className="h-16 flex items-center px-5 border-b border-gray-50">
          {/* 로고 아이콘 — 보라색 그라데이션 배경 */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {/* 브랜드명 — 사이드바가 펼쳐져 있을 때만 표시 */}
          {!sidebarCollapsed && (
            <span className="ml-3 text-xl font-bold bg-gradient-to-r from-primary-600 to-violet-600 bg-clip-text text-transparent">
              VELA
            </span>
          )}
        </div>

        {/* ── 메뉴 목록 ── */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200 group relative
                  ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {/* 메뉴 이름 — 사이드바가 펼쳐져 있을 때만 표시 */}
                {!sidebarCollapsed && (
                  <span className="text-sm whitespace-nowrap">{item.label}</span>
                )}
                {/* 사이드바가 접힌 상태에서 마우스를 올리면 툴팁 표시 */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── 사이드바 접기/펼치기 버튼 ── */}
        <div className="p-3 border-t border-gray-50">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                       text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
            title={sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <>
                <PanelLeftClose className="w-5 h-5" />
                <span className="text-sm">접기</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ────────────────────────────────
          우측 메인 영역 (헤더 + 콘텐츠)
          ──────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── 상단 헤더 ── */}
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-100 shrink-0">
          {/* 현재 페이지 이름 */}
          <h1 className="text-lg font-bold text-gray-800">
            {getPageTitle(location.pathname)}
          </h1>

          {/* 우측: 설정 버튼 */}
          <button className="btn-ghost p-2 rounded-xl" title="설정">
            <Settings className="w-5 h-5" />
          </button>
        </header>

        {/* ── 메인 콘텐츠 영역 ── */}
        {/* Outlet: 현재 URL에 해당하는 페이지 컴포넌트가 여기에 표시됩니다 */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
