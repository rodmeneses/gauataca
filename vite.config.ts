import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt', // never swap the running build silently — UpdatePrompt asks first
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'fonts/*.woff2', 'fonts/fonts.css'],
      manifest: {
        name: 'GUATACA',
        short_name: 'GUATACA',
        description: 'Panel administrativo de la banda cooperativa GUATACA',
        lang: 'es',
        dir: 'ltr',
        start_url: '/?tour=0',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#020617',
        theme_color: '#020617',
        categories: ['music', 'productivity'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Supabase reads: last-known data when offline, fresh when online.
            urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/rest\/v1\//i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Supabase auth / writes are never served from cache.
            urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/(auth|storage)\//i,
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    // "/src" is resolved by Vite relative to the project root.
    alias: { '@': '/src' },
  },
});
