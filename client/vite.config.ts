import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Kochbuch',
        short_name: 'Kochbuch',
        description: 'Mein persönliches Koch- und Backbuch',
        lang: 'de',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#fbf7f2',
        theme_color: '#b45309',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Recipe images: file names never change, so cache first.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/images/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'recipe-images',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Recipes, tags, shopping list: fresh when online, cached copy when offline.
            urlPattern: ({ url, request }) =>
              request.method === 'GET' &&
              url.pathname.startsWith('/api/') &&
              !url.pathname.startsWith('/api/health') &&
              !url.pathname.startsWith('/api/backup'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-data',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 1000 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
