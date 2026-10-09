# GUATACA

Bilingual (ES/EN) React app for a Venezuelan dance/folklore band — events, setlists,
repertoire, ledger/gear, brainstorm, members, and a design-system view.

## Stack

- React 18 + TypeScript (strict) + Vite 6 + Tailwind CSS v4 + lucide-react
- `@supabase/supabase-js` v2 (Postgres + Auth + RLS + Storage)
- Deployed on Vercel (`gauataca.vercel.app`), auto-deploys from GitHub `main`
- PWA via `vite-plugin-pwa` (service worker, self-hosted fonts, zero third-party requests)

## Commands

- `npm run build` — `tsc -b && vite build` (the CI gate)
- `npm run coverage` — `vitest run --coverage` (also a CI gate; enforces the
  thresholds in `vitest.config.ts`)
- `npm run lint` — ESLint (CI gate; warnings allowed, errors fail)
- `npm run size` — gzip JS budget check, run after `npm run build` (CI gate; budget in `scripts/check-bundle-size.mjs`)
- `npm run e2e` — Playwright smoke tests (Supabase fully mocked in `e2e/support.ts`; first run needs
  `npx playwright install chromium`; separate `e2e` job in CI)
- `npm run dev` — local dev (service worker disabled by design)
- `npm run assets:fonts` / `npm run assets:icons` — regenerate PWA assets

## Architecture

- **State:** `src/store/store.tsx` (`State` + `GuatacaProvider`) → `src/store/useGuataca.ts`
  (the `Guataca` view-model, derived from state + Supabase data) → `src/store/vm/`
  (per-entity view-model builders; the expensive derived lists are memoised in `useDerived.ts`).
- **Data:** `src/lib/data.tsx` (`DataProvider` + central `run()` mutation wrapper) →
  `src/lib/api.ts` (Supabase read/write). `src/lib/auth.ts` for auth.
- **Shell:** `src/components/shell/Shell.tsx` picks phone vs desktop; mobile in
  `src/components/mobile/`, desktop in `src/components/shell/` + `src/components/views/`.
- **Primitives:** `src/components/ui/index.tsx` (`Modal`, `Badge`, `Pill`, `Segment`, …).
- **i18n:** `src/i18n.ts` — `T` dictionary, `Localized = {es, en}`.

## Conventions

- **Money:** cents in the DB, dollars in domain types (`money()` / `money0()` helpers).
- **Localized text:** DB uses `_es`/`_en` column pairs; `L(lang, v)` picks.
- **Migrations:** Flyway-style in `db/migrations/` (`V__*.sql` versioned, `R__*.sql`
  repeatable). Frontend-only changes need no migration.
- **Theming:** `src/styles.css` — `--g-*` palette (dark default + light override) mapped
  through Tailwind `@theme` to `--color-*` utilities. Components must reference tokens
  (`var(--color-*)`), never raw hex, or they won't follow the theme.
- **Device detection:** `src/store/useGuataca.ts` — `isMobileViewport =
  isPhoneViewport || (isCoarsePointer && isTabletViewport)`. Touch devices up to tablet
  width get the phone layout.
- **Unit test coverage:** `vitest.config.ts` enforces a 95% threshold
  (lines/statements/functions/branches) over its coverage `include` list — the
  business-logic modules that have a dedicated `*.test.ts` file (`src/lib`, `src/store/vm/*.ts`,
  `src/i18n.ts`, `src/data/changelog.ts`, …), not components. When you add a new module to
  that list, either add it fully tested or don't add it — a half-covered module will fail
  the threshold. This is also a CI gate (`npm run coverage` in `.github/workflows/test.yml`),
  so a PR that drops coverage below 95% fails to merge.
- **Changelog (MANDATORY on every PR):** `src/data/changelog.ts` — `CHANGELOG` array (newest first), shown to
  members as a "What's new" dialog. Every PR with a user-facing change must add one
  `{es, en}` bullet to it: either to the current unreleased version's `changes` list, or,
  if starting a new release, a new entry at the top with `version` bumped to match
  `package.json` (a test enforces they match). Skip it only for pure refactors, internal
  tooling, or dev-only changes with nothing a band member would notice. Before opening or
  finishing any PR, check `git diff` for `src/data/changelog.ts`; if it's absent and the
  change is user-visible, add the bullet before committing — never wait to be reminded.

## Gotchas

- The service worker precaches the app shell; a new deploy applies only after the user
  accepts the update prompt. Hard-refresh if you're testing a deploy and don't see changes.
- `npm run dev` never registers a service worker (`devOptions.enabled: false`).
