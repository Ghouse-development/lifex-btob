import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  build: {
    target: 'esnext',
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
        'admin-profile': resolve(__dirname, 'src/admin-profile.html'),
        'admin-notifications': resolve(__dirname, 'src/admin-notifications.html'),
        'admin-report': resolve(__dirname, 'src/admin-report.html'),
        'admin/index': resolve(__dirname, 'src/admin/index.html'),
        ai: resolve(__dirname, 'src/ai.html'),
        design: resolve(__dirname, 'src/design.html'),
        faq: resolve(__dirname, 'src/faq.html'),
        'debug-faq-comprehensive': resolve(__dirname, 'src/debug-faq-comprehensive.html'),
        'debug-faq-browser': resolve(__dirname, 'src/debug-faq-browser.html'),
        '404': resolve(__dirname, 'src/404.html'),
        '500': resolve(__dirname, 'src/500.html'),
        'admin-password-reset': resolve(__dirname, 'src/admin-password-reset.html'),
        'admin-password-update': resolve(__dirname, 'src/admin-password-update.html')
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