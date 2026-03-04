/**
 * App.tsx — 앱의 최상위 컴포넌트
 *
 * 페이지 간 이동(라우팅)을 설정하는 파일입니다.
 * URL에 따라 어떤 페이지를 보여줄지 결정합니다.
 *
 * URL 경로와 페이지 매핑:
 *   /                 → 대시보드
 *   /text-to-video    → 텍스트 → 영상
 *   /image-to-video   → 이미지 → 영상
 *   /subtitle         → 자막 생성
 *   /export           → 내보내기
 */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import TextToVideo from '@/pages/TextToVideo';
import ImageToVideo from '@/pages/ImageToVideo';
import SubtitleGen from '@/pages/SubtitleGen';
import Export from '@/pages/Export';

const App: React.FC = () => {
  return (
    <Routes>
      {/* Layout으로 감싸서 모든 페이지에 사이드바+헤더 적용 */}
      <Route element={<Layout />}>
        {/* 메인(대시보드) 페이지 — URL이 / 일 때 */}
        <Route path="/" element={<Dashboard />} />

        {/* 텍스트→영상 생성 페이지 */}
        <Route path="/text-to-video" element={<TextToVideo />} />

        {/* 이미지→영상 변환 페이지 */}
        <Route path="/image-to-video" element={<ImageToVideo />} />

        {/* 자막 생성 페이지 */}
        <Route path="/subtitle" element={<SubtitleGen />} />

        {/* 내보내기 페이지 */}
        <Route path="/export" element={<Export />} />
      </Route>
    </Routes>
  );
};

export default App;
