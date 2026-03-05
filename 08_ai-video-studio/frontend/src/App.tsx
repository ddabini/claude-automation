/**
 * App.tsx — 앱 최상위 컴포넌트 (라우팅)
 *
 * URL에 따라 어떤 페이지를 보여줄지 결정합니다.
 *   /           → 대시보드
 *   /editor     → 컷편집
 *   /audio      → 오디오 편집
 *   /subtitle   → 자막
 *   /export     → 내보내기
 */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import VideoEditor from '@/pages/VideoEditor';
import AudioEditor from '@/pages/AudioEditor';
import SubtitleGen from '@/pages/SubtitleGen';
import Export from '@/pages/Export';

const App: React.FC = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/editor" element={<VideoEditor />} />
        <Route path="/audio" element={<AudioEditor />} />
        <Route path="/subtitle" element={<SubtitleGen />} />
        <Route path="/export" element={<Export />} />
      </Route>
    </Routes>
  );
};

export default App;
