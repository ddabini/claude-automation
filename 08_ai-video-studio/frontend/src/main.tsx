/**
 * main.tsx — 앱의 시작점 (진입점)
 * - React 앱을 HTML의 #root 요소에 연결합니다
 * - 라우터 설정을 통해 페이지 간 이동을 가능하게 합니다
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// #root 요소에 React 앱을 렌더링 (화면에 그리기)
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
