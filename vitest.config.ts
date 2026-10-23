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
      // Everything under these globs counts by default, so a new module can't silently
      // skip the threshold. Add to `exclude` only for code that needs a browser/real backend.
      include: [
        'src/lib/**/*.{ts,tsx}',
        'api/*.ts',
        'src/store/vm/*.ts',
        'src/store/derive.ts',
        'src/data/changelog.ts',
        'src/i18n/*.ts',
        'src/i18n.ts',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        // Thin wrappers over browser/third-party runtimes (Supabase auth client, Web Push, env-based
        // client construction); they have no logic worth unit-testing without the real service.
        'src/lib/auth.tsx',
        'src/lib/push.tsx',
        'src/lib/supabase.ts',
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
