import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        // 固定使用 3001 端口，避免与 Claude Code (3000) 冲突
        port: 3001,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          },
          '/auth': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          },
          '/health': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          },
          '/graphql': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          }
        }
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
          manifest: {
            name: 'Vicoo — AI 知识管理',
            short_name: 'Vicoo',
            description: 'AI 驱动的个人知识管理工作台',
            theme_color: '#0df259',
            background_color: '#FFFCF5',
            display: 'standalone',
            start_url: '/',
            orientation: 'any',
            categories: ['productivity', 'education'],
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            navigateFallback: 'index.html',
            runtimeCaching: [
              {
                urlPattern: /\/api\//i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-cache',
                  expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
                  networkTimeoutSeconds: 5,
                }
              },
              {
                urlPattern: /\/uploads\//i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'media-cache',
                  expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
                }
              },
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: mode === 'production',
            drop_debugger: mode === 'production'
          }
        },
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'visualization': ['@xyflow/react'],
              'ui-vendor': ['@vicoo/ui']
            }
          }
        },
        sourcemap: mode !== 'production',
        chunkSizeWarningLimit: 1000
      },
      optimizeDeps: {
        include: ['react', 'react-dom', '@xyflow/react']
      }
    };
});
