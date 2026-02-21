import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const webPath = path.resolve(__dirname, '../web');

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@web': webPath,
      '@components': path.resolve(__dirname, '../web/components'),
      '@pages': path.resolve(__dirname, '../web/pages'),
      '@contexts': path.resolve(__dirname, '../web/contexts'),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
});
