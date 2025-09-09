import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: 'src/index.html',
        matrix: 'src/matrix.html',
        plans: 'src/plans.html',
        admin: 'src/admin/index.html'
      }
    }
  },
  server: {
    port: 3000
  },
  optimizeDeps: {
    include: ['alpinejs']
  }
});