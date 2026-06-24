// Service Worker — Celestina Cocina
// Modo: injectManifest (Workbox inyecta el precache aquí)
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

self.skipWaiting()
clientsClaim()

// ── Precache del bundle estático ────────────────────────────────────────────
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// SPA: todas las navegaciones sirven index.html
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))

// ── Runtime caching ─────────────────────────────────────────────────────────

// Imágenes de Supabase Storage — sirve del cache mientras refresca (7 días)
registerRoute(
  ({ url }) => url.hostname.includes('supabase.co') && url.pathname.includes('/storage/'),
  new StaleWhileRevalidate({
    cacheName: 'supabase-images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
)

// API de Supabase — siempre intenta red, fallback a cache (5 min)
registerRoute(
  ({ url }) => url.hostname.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-api',
    networkTimeoutSeconds: 8,
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 300 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
)

// Google Fonts — un año
registerRoute(
  /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
)

// ── Push notifications ──────────────────────────────────────────────────────

self.addEventListener('push', event => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Celestina Cocina', body: event.data.text() }
  }

  const {
    title       = '🛍 Nuevo pedido',
    body        = 'Entrá a ver los detalles',
    url         = '/admin/pedidos',
    orderNumber,
  } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:      '/android-icon-192x192.png',
      badge:     '/android-icon-72x72.png',
      vibrate:   [200, 100, 200, 100, 400],
      tag:       `order-${orderNumber ?? Date.now()}`, // evita duplicados
      renotify:  true,
      data:      { url },
      actions:   [{ action: 'view', title: '📋 Ver pedido' }],
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  if (event.action === 'dismiss') return

  const url = event.notification.data?.url ?? '/admin/pedidos'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        // Reutiliza ventana admin ya abierta
        const admin = list.find(c => c.url.includes('/admin'))
        if (admin) {
          admin.focus()
          return admin.navigate(url)
        }
        return self.clients.openWindow(url)
      })
  )
})
