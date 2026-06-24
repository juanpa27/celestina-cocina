import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,         // se gestiona en public/manifest.json

      workbox: {
        // Pre-cachea todo el bundle estático
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,webp,woff2,svg}'],

        // SPA: todas las navegaciones devuelven index.html
        navigateFallback: '/index.html',

        runtimeCaching: [
          {
            // Imágenes de Supabase Storage — sirve del cache mientras refresca
            urlPattern: ({ url }) =>
              url.hostname.includes('supabase.co') &&
              url.pathname.includes('/storage/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'supabase-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // API de Supabase — siempre intenta red, fallback a cache (5 min)
            urlPattern: ({ url }) => url.hostname.includes('supabase.co'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts — un año de cache
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },

      // No activar el SW en desarrollo para no interferir con HMR
      devOptions: { enabled: false },
    }),
  ],
})
