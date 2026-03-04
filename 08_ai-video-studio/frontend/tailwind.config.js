/**
 * TailwindCSS 설정 파일
 * - VELA 프로젝트의 디자인 토큰(색상, 폰트 등)을 정의합니다
 * - 보라색 계열을 주요 브랜드 컬러로 사용합니다
 */
/** @type {import('tailwindcss').Config} */
export default {
  // Tailwind가 스캔할 파일 범위
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // VELA 브랜드 컬러 — 보라색 계열
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
      },
      // 폰트 패밀리 — Pretendard 우선, Noto Sans KR 폴백
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'Noto Sans KR',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
