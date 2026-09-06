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
- `npm run dev` — local dev (service worker disabled by design)
- `npm run assets:fonts` / `npm run assets:icons` — regenerate PWA assets

## Architecture

- **State:** `src/store/store.tsx` (`State` + `GuatacaProvider`) → `src/store/useGuataca.ts`
  (the `Guataca` view-model, derived from state + Supabase data) → `src/store/vm.ts`
  (per-entity view-model builders).
- **Data:** `src/lib/data.tsx` (`DataProvider` + central `run()` mutation wrapper) →
  `src/lib/api.ts` (Supabase read/write). `src/lib/auth.ts` for auth.
- **Shell:** `src/components/shell/Shell.tsx` picks phone vs desktop; mobile in
  `src/components/mobile/`, desktop in `src/components/shell/` + `src/components/views/`.
- **Primitives:** `src/components/ui/index.tsx` (`Modal`, `Badge`, `Pill`, `Segment`, …).
- **i18n:** `src/i18n.ts` — `T` dictionary, `Localized = {es, en}`.

## Conventions

- **Money:** cents in the DB, dollars in domain types (`money()` / `money0()` helpers).
- **Localized text:** DB uses `_es`/`_en` column pairs; `L(lang, v)` picks.
- **Demo mode:** `isDemo = !VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY` — in-memory
  fallback, no Supabase.
- **Migrations:** Flyway-style in `db/migrations/` (`V__*.sql` versioned, `R__*.sql`
  repeatable). Frontend-only changes need no migration.
- **Theming:** `src/styles.css` — `--g-*` palette (dark default + light override) mapped
  through Tailwind `@theme` to `--color-*` utilities. Components must reference tokens
  (`var(--color-*)`), never raw hex, or they won't follow the theme.
- **Device detection:** `src/store/useGuataca.ts` — `isMobileViewport =
  isPhoneViewport || (isCoarsePointer && isTabletViewport)`. Touch devices up to tablet
  width get the phone layout.

## Gotchas

- The service worker precaches the app shell; a new deploy applies only after the user
  accepts the update prompt. Hard-refresh if you're testing a deploy and don't see changes.
- `npm run dev` never registers a service worker (`devOptions.enabled: false`).
