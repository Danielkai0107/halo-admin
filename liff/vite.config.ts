import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/liff/',  // 重要：設定部署的基礎路徑
  server: {
    port: 3001,
  },
  build: {
    outDir: 'dist',
  },
});
