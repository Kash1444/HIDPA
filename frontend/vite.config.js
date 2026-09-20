import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Dev convenience: forward /api to the FastAPI backend so the browser
      // makes same-origin requests and CORS never enters the picture.
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  },
  build: { outDir: 'dist', sourcemap: true }
});
