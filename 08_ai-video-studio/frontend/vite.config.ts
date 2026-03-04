/**
 * Vite 설정 파일
 * - 개발 서버와 빌드 도구의 설정을 담당합니다
 * - React 플러그인과 경로 별칭(@)을 설정합니다
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // React 플러그인 활성화 (JSX 변환, Fast Refresh 등)
  plugins: [react()],

  resolve: {
    // '@' 기호로 src 폴더를 가리킬 수 있게 설정 (import 경로 간소화)
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    // 개발 서버 포트 (http://localhost:5173)
    port: 5173,
    // 백엔드 API 요청을 프록시로 전달 (CORS 문제 방지)
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
