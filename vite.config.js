// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            if (id.includes('katex')) {
              return 'vendor-math';
            }
            return 'vendor-core';
          }
          if (id.includes('src/data/questions')) {
            return 'sat-question-banks';
          }
        },
      },
    },
  },
  server: {
    warmup: {
      clientFiles: [
        './src/App.jsx',
        './src/pages/DashboardPage.jsx',
        './src/pages/ExamWorkspacePage.jsx',
      ],
    },
  },
});