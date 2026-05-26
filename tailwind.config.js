/** @type {import('tailwindcss').Config} */
export default {
  // Tailwind CSS가 스타일을 적용할 파일 경로들을 지정합니다.
  // HTML 및 src 폴더 밑의 모든 React/TSX 컴포넌트 파일을 분석합니다.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 금융 앱에 어울리는 신뢰감 있고 프리미엄한 다크/블루 테마 색상을 정의합니다.
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae2fd',
          300: '#7cc8fc',
          400: '#38abf9',
          50: '#0284c7', // Primary Blue
          600: '#026fa7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#031c30', // Deep Dark Navy
        },
      },
      // 글래스모피즘(Glassmorphism) 및 부드러운 전환 효과를 위한 테마 확장
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
