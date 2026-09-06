# GUATACA — Session Handoff

> Written 2026-09-06. Pick up from here in a new session.

## What this is

**GUATACA** (formerly "BandSync") — a bilingual (ES/EN) React app for a Venezuelan
dance/folklore band. Manages events, setlists, repertoire, ledger/gear, brainstorm,
members, and a design-system view.

- **Stack:** React 18 + TypeScript (strict) + Vite 6 + Tailwind CSS v4 + lucide-react,
  `@supabase/supabase-js` v2.
- **Backend:** Supabase (Postgres + Auth + RLS + Storage). Migrations are Flyway-style
  in `db/migrations/` (`V__*.sql` versioned, `R__*.sql` repeatable).
- **Deploy:** Vercel (`gauataca.vercel.app`), auto-deploys from GitHub `main`.
- **Money:** cents in the DB, dollars in domain types.
- **Demo mode:** `isDemo = !VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY` — in-memory
  fallback when env keys are absent.

## Current git state

`main` is at **`bc2d79b`** (merge of PR #3), in sync with `origin/main`, working tree clean.

```
bc2d79b Merge pull request #3 from rodmeneses/pwa
9942f57 feat: make GUATACA an installable PWA
54cf28b build: self-host fonts and add PWA static assets
a06b018 Fix mobile detection for landscape phones and tablets   ← my fix
ce839f1 Merge pull request #2 from rodmeneses/ui-improvements
7c8fc38 feat: ui-redesign                                        ← Sergio
4166aeb Rename BandSync → GUATACA
```

## What happened this session

1. **Reviewed PR #2** ("Responsive UI overhaul + light/dark theming", Sergio) — merged by
   the user via GitHub. Adds light/dark/system theming, responsive breakpoints
   (phone ≤768 / tablet 768–1024 / desktop), bottom-sheet modals, touch targets, a11y.
2. **Fixed a mobile-detection bug** (`a06b018`): the shell was chosen by viewport width
   alone, so a phone in landscape (or "Request Desktop Site", or a tablet) fell into the
   desktop shell with no way back. Fix: treat touch devices (coarse pointer) up to tablet
   width as phone. See `src/store/useGuataca.ts` → `isMobileViewport`.
3. **Reviewed PR #3** ("Convert GUATACA to an installable PWA", Sergio) — merged by the
   user via GitHub. Adds `vite-plugin-pwa` (manifest, icons, service worker with
   precache + scoped runtime caching), offline banner + write short-circuit, and
   self-hosted fonts (zero third-party requests). **No DB/Flyway migrations required.**

## ⚠️ Pending / known issues

### 1. Missing `--g-pink` / `--g-teal` in the system-light theme (unfixed)
Found during PR #2 review, **still present** in `src/styles.css`. The
`@media (prefers-color-scheme: light)` block (used when theme = "system" and the OS is
light) is missing these two tokens. They exist in `:root` (dark, lines ~163–164) and
`:root[data-theme='light']` (lines ~224–225), but not in the media-query block.

**Effect:** with theme = "system" + light OS, the **balada** genre chip, **guacharaca**
genre chip, and the **Apple Music icon** fall back to dark neon values (`#f472b6` /
`#2dd4bf`) and are unreadable on white.

**Fix (2 lines):** add to the `@media (prefers-color-scheme: light)` block:
```css
--g-pink: #be185d;
--g-teal: #0f766e;
```

### 2. Sergio's PR #2 caveats (still open)
- Real-device iOS Safari (toolbar-collapse + keyboard) untested.
- `ShareSheet`, `CustodyDialog`, `SettleDialog` still roll their own overlay and don't
  get the new bottom-sheet / scroll-lock treatment.

### 3. PR #3 deliberately deferred
- Offline-first data (IndexedDB mirror + write queue) — skipped; song charts/event media
  are external Drive/iCloud links that don't work offline anyway.
- Web push notifications — deferred until Phase 2 auth + a backend function exist.

## Key files map

| File | Role |
|---|---|
| `src/store/useGuataca.ts` | Main store/view-model — device/layout detection, all derived VMs |
| `src/store/store.tsx` | State + `GuatacaProvider` |
| `src/store/vm.ts` | View-model builders (`songVm`, `txVm`, `memberVm`, …) + color tokens |
| `src/styles.css` | Theme token system (`--g-*` palette → `@theme` → `--color-*`) |
| `src/lib/data.tsx` | `DataProvider` + central `run()` mutation wrapper (offline guard) |
| `src/lib/api.ts` | Supabase read/write layer |
| `src/lib/prefs.ts` | Theme/lang `localStorage` persistence |
| `src/i18n.ts` | ES/EN dictionary (`T`) |
| `src/components/shell/Shell.tsx` | Root layout — picks phone vs desktop shell + overlays |
| `src/components/mobile/MobileShell.tsx` | Mobile shell (fixed-position, tab bar) |
| `src/components/ui/index.tsx` | Primitives (`Modal`, `Badge`, `Pill`, `Segment`, …) |
| `db/migrations/` | Flyway migrations (versioned `V__` + repeatable `R__`) |
| `scripts/gen-icons.mjs`, `scripts/vendor-fonts.mjs` | Regenerate PWA icons / fonts |

## Useful commands

```sh
npm run build          # tsc -b && vite build (the CI gate)
npm run dev            # local dev (service worker disabled by design)
npm run assets:fonts   # re-vendor fonts into public/fonts/
npm run assets:icons   # regenerate the icon set into public/
```

## Suggested next steps

1. Apply the 2-line `--g-pink`/`--g-teal` fix above (or ask Sergio to).
2. Optionally verify the PWA install flow on a real phone (add-to-home-screen, offline
   reload, update prompt).
3. If the mobile shell still shows desktop on a phone after `a06b018`, check for
   "Request Desktop Website" in the browser (reports >1024px, intentionally left on desktop).
