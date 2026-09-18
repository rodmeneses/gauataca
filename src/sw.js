/**
 * Service worker (injectManifest). vite-plugin-pwa injects `self.__WB_MANIFEST`
 * (the precache list) at build time; everything else here is hand-written:
 * the offline navigation fallback, the Supabase read/write caching rules
 * (ported verbatim from the old generateSW `workbox` config), and the Web Push
 * handlers that generateSW cannot carry.
 *
 * `registerType: 'prompt'` is preserved: the SW never claims pages or skips
 * waiting on its own — the new version activates only after the user accepts
 * the update prompt (UpdatePrompt.tsx sends a `SKIP_WAITING` message).
 */
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

/* --------------------------------------------------------- offline app shell */
// SPA fallback: any navigation request served from cache (the shell) when offline.
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')));

/* --------------------------------------------------- Supabase read / write */
// REST reads: last-known data offline, fresh whenever online.
registerRoute(
  /^https:\/\/[a-z0-9]+\.supabase\.co\/rest\/v1\//i,
  new NetworkFirst({
    cacheName: 'supabase-api',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 }),
    ],
  }),
);

// Auth + storage are never served from cache.
registerRoute(/^https:\/\/[a-z0-9]+\.supabase\.co\/(auth|storage)\//i, new NetworkOnly());

/* ------------------------------------------------------------ update flow */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ----------------------------------------------------- Web Push (notify) */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // ignore malformed payloads
  }
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(data.title || 'GUATACA', options));
});

self.addEventListener('notificationclick', (event) => {
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.notification.close();
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const win of windows) {
        if ('focus' in win) {
          await win.navigate(url);
          return win.focus();
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
