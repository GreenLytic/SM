import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'react-hot-toast',
      'date-fns'
    ],
    exclude: ['sql.js']
  },
  worker: {
    format: 'es'
  },
  assetsInclude: ['**/*.wasm'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            'firebase/app',
            'firebase/firestore',
            'firebase/auth',
            'firebase/storage'
          ],
          charts: ['chart.js', 'react-chartjs-2'],
          maps: ['mapbox-gl', 'react-map-gl', '@turf/turf'],
          ui: ['react-hot-toast', '@react-pdf/renderer']
        }
      }
    },
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    },
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'sql.js': 'sql.js/dist/sql-wasm.js'
    }
  },
  server: {
    hmr: {
      overlay: true
    }
  }
});