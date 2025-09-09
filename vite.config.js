import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        matrix: resolve(__dirname, 'src/matrix.html'),
        plans: resolve(__dirname, 'src/plans.html'),
        downloads: resolve(__dirname, 'src/downloads.html'),
        'plan-detail': resolve(__dirname, 'src/plan-detail.html'),
        admin: resolve(__dirname, 'src/admin/index.html')
      }
    }
  },
  server: {
    port: 3000
  },
  publicDir: '../public',
  optimizeDeps: {
    include: ['alpinejs']
  },
  assetsInclude: ['**/*.json']
});