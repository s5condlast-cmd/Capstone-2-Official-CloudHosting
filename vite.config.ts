import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('docx') && !id.includes('docx-preview')) {
                return 'vendor-docx';
              }
              if (id.includes('exceljs') || id.includes('xlsx')) {
                return 'vendor-excel';
              }
              if (id.includes('pdfjs-dist')) {
                return 'vendor-pdfjs';
              }
              if (id.includes('@embedpdf')) {
                return 'vendor-embedpdf';
              }
              if (
                id.includes('@udecode') ||
                id.includes('platejs') ||
                id.includes('@platejs') ||
                id.includes('/slate/') ||
                id.includes('\\slate\\') ||
                id.includes('/slate-') ||
                id.includes('\\slate-')
              ) {
                return 'vendor-plate';
              }
            }
          },
        },
      },
      chunkSizeWarningLimit: 2500,
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true
        }
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true' ? { overlay: false } : false,
      watch: {
        ignored: ['**/Templates-*/**']
      }
    },
  };
});
