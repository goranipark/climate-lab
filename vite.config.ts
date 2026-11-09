// Vite 설정: React 플러그인, 오프라인(PWA) 플러그인, 테스트(vitest) 설정
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // 오프라인 동작: 빌드한 정적 파일을 서비스 워커가 미리 저장한다 (todo.md M4)
    VitePWA({
      // 등록 스크립트(registerSW.js)를 index.html에 자동으로 넣는다. src 코드는 고치지 않는다
      injectRegister: 'auto',
      // 새 버전은 내려받는 즉시 서비스 워커만 바꾸고, 보고 있는 화면은 새로고침하지 않는다.
      // 그래서 수업 중 화면이 갑자기 바뀌지 않고, 다음에 열거나 새로고침할 때 새 버전이 보인다.
      registerType: 'autoUpdate',
      manifest: {
        name: '기후변화 탐사 연구소',
        short_name: '기후 탐사',
        lang: 'ko',
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#dceeff',
        background_color: '#dceeff',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // 앱이 쓰는 확장자의 빌드 파일을 모두 미리 저장 (약 4.4MB, 글꼴 조각이 3MB)
        globPatterns: ['**/*.{html,js,css,svg,webp,png,woff2}'],
        // 오프라인에서 ?class=3 같은 주소로 열어도 저장해 둔 index.html을 보여 준다
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  // 정적 배포용: 상대 경로로 빌드해 어느 주소에 올려도 동작하게 함
  base: './',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
  },
});
