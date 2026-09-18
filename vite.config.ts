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
      // Custom SW (injectManifest) so we can add the Web Push handlers that a
      // generated SW cannot carry. The offline rules live in src/sw.js.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
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
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    // "/src" is resolved by Vite relative to the project root.
    alias: { '@': '/src' },
  },
});
