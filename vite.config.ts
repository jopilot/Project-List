import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // React 플러그인을 Vite 빌드 파이프라인에 주입합니다.
  plugins: [react()],
});
