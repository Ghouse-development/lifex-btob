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
        rules: resolve(__dirname, 'src/rules.html'),
        downloads: resolve(__dirname, 'src/downloads.html'),
        'plan-detail': resolve(__dirname, 'src/plan-detail.html'),
        admin: resolve(__dirname, 'src/admin.html'),
        'admin-login': resolve(__dirname, 'src/admin-login.html'),
        'admin-plans': resolve(__dirname, 'src/admin-plans.html'),
        'admin-rules': resolve(__dirname, 'src/admin-rules.html'),
        'admin-faq': resolve(__dirname, 'src/admin-faq.html'),
        'admin-downloads': resolve(__dirname, 'src/admin-downloads.html'),
        'admin-login-google': resolve(__dirname, 'src/admin-login-google.html'),
        'admin-users': resolve(__dirname, 'src/admin-users.html'),
        'admin-system': resolve(__dirname, 'src/admin-system.html'),
        'admin/index': resolve(__dirname, 'src/admin/index.html'),
        ai: resolve(__dirname, 'src/ai.html'),
        design: resolve(__dirname, 'src/design.html'),
        faq: resolve(__dirname, 'src/faq.html')
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