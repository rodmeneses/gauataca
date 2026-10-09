import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Separate from vite.config.ts: the PWA + Tailwind plugins do nothing for
// unit tests and only slow down / complicate the test runner.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': '/src' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'api/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/lib/format.ts',
        'src/lib/deepLink.ts',
        'src/lib/prefs.ts',
        'src/lib/mentions.ts',
        'src/lib/markdownLite.ts',
        'src/lib/ics.ts',
        'src/lib/search.ts',
        'src/lib/notify.ts',
        'src/lib/optimistic.ts',
        'src/lib/offlineQueue.ts',
        'src/lib/image.ts',
        'src/lib/errors.ts',
        'api/notify.ts',
        'api/calendar.ts',
        'api/_rateLimit.ts',
        'src/lib/icsFeed.ts',
        'src/store/vm/*.ts',
        'src/store/derive.ts',
        'src/data/changelog.ts',
        'src/i18n.ts',
      ],
      thresholds: {
        lines: 95,
        statements: 95,
        functions: 95,
        branches: 95,
      },
    },
  },
});
