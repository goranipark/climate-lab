// Vite 설정: React 플러그인과 테스트(vitest) 설정
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 정적 배포용: 상대 경로로 빌드해 어느 주소에 올려도 동작하게 함
  base: './',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
  },
});
