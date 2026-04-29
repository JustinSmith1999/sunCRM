import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      events: 'rollup-plugin-node-polyfills/polyfills/events',
      stream: 'rollup-plugin-node-polyfills/polyfills/stream',
      crypto: 'rollup-plugin-node-polyfills/polyfills/crypto-browserify',
      buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
    },
  },
  define: {
    'process.env': {},
    'global': 'globalThis',
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    // Avoid the giant single-bundle problem; split heavy libs and the rest.
    // Lower TTI for 100+ concurrent users hitting first paint.
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'recharts': ['recharts'],
          'icons': ['lucide-react'],
        },
      },
    },
  },
});
