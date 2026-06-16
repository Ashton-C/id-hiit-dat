import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // No SW in `vite dev` → npm run dev is unaffected.
      devOptions: { enabled: false },
      includeAssets: ['favicon.svg', 'apple-touch-icon-180.png'],
      manifest: {
        name: "I'd HIIT Dat",
        short_name: 'HIIT Dat',
        description: 'A seamless HIIT interval workout timer.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#15171c',
        background_color: '#15171c',
        lang: 'en',
        categories: ['health', 'fitness', 'sports'],
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,woff2}'],
        globIgnores: ['music/**'], // future bundled audio served by runtime CacheFirst
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'audio' || /\/music\//.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'idhiit-audio-v1',
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 180 },
            },
          },
        ],
      },
    }),
  ],
})
