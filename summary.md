# GUATACA — Session Handoff

> Written 2026-09-07. Pick up from here in a new session.

## What this is

**GUATACA** (formerly "BandSync") — a bilingual (ES/EN) React app for a Venezuelan
dance/folklore band. Manages events, setlists, repertoire, ledger/gear, brainstorm,
members, and a design-system view.

- **Stack:** React 18 + TypeScript (strict) + Vite 6 + Tailwind CSS v4 + lucide-react,
  `@supabase/supabase-js` v2.
- **Backend:** Supabase (Postgres + Auth + RLS + Storage). Migrations are Flyway-style
  in `db/migrations/` — currently a single consolidated `V1__baseline.sql`.
- **Deploy:** Vercel (`gauataca.vercel.app`), auto-deploys from GitHub `main`.
- **Money:** cents in the DB, dollars in domain types.
- **Demo mode:** `isDemo = !VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY` — in-memory
  fallback (mock arrays in `src/data/`) when env keys are absent.

## Current git state

`main` is at **`3d54e34`**, in sync with `origin/main`, working tree clean.

```
3d54e34 Merge pull request #6 from rodmeneses/notifications-with-reload
9a8270d feat: silent data refresh after mutations, nicer toasts   ← Sergio
f7986cb Merge pull request #5 from rodmeneses/feat/edit-events-genres-balance
c475ce3 feat: edit events, add genres, fix negative balance color  ← Rodrigo
cbcfa83 Merge pull request #4 from rodmeneses/claudeMD
8e88845 Adds Claude.MD and summary.MD
bc2d79b Merge pull request #3 from rodmeneses/pwa
9942f57 feat: make GUATACA an installable PWA
54cf28b build: self-host fonts and add PWA static assets
a06b018 Fix mobile detection for landscape phones and tablets
ce839f1 Merge pull request #2 from rodmeneses/ui-improvements
7c8fc38 feat: ui-redesign                                        ← Sergio
4166aeb Rename BandSync → GUATACA
```

## What happened since the last handoff

Three PRs landed on top of the PWA work (PR #3):

1. **PR #4 — `claudeMD`** (`8e88845`): added `CLAUDE.md` (project instructions) and
   `summary.md` (the previous handoff). Docs only, no code.
2. **PR #5 — edit events, add genres, fix negative balance color** (`c475ce3`):
   - Added four genres to the song catalog — **tonada, pop, otra, instrumental** —
     bringing the total to 14 (see `src/data/songs.ts` → `GENRES`).
   - Made existing events **editable** (title/type/date/time/hours/venue/fee/cost/
     note/setlist) via a new `updateEvent` mutation (`src/lib/api.ts` +
     `src/lib/data.tsx`).
   - Pool balance now renders **red when negative**.
3. **PR #6 — silent data refresh + nicer toasts** (`9a8270d`, Sergio):
   - Every mutation used to go through `run()` → `reload()`, which set `loading=true`
     and swapped the whole app for a full-screen spinner (the "flick"). Now `run()`
     refetches **silently** — `reload({ silent: true })` keeps the current screen
     mounted and swaps data in place; a failed background refetch no longer tears the
     screen down (it dispatches `guataca:mutation-error` instead).
   - New `mutating` flag (true while a write + its refetch are in flight) drives a thin
     indeterminate **`TopProgress`** bar (`src/components/shell/TopProgress.tsx`),
     delayed 120ms so fast writes don't flash it.
   - **Toasts** gained tap-to-dismiss, full-width on phones, and a fade/slide-out exit
     animation; the store gained `dismissToast()`.

## ⚠️ Pending / known issues

### 1. Missing `--g-pink` / `--g-teal` in the system-light theme (unfixed)
Still present in `src/styles.css`. The `@media (prefers-color-scheme: light)` block
(used when theme = "system" and the OS is light) is missing these two tokens. They exist
in `:root` (dark, lines ~173–174) and `:root[data-theme='light']` (lines ~234–235), but
not in the media-query block (which ends at `--g-fuchsia`, line ~291).

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
- `ShareSheet`, `CustodyDialog`, `SettleDialog` still roll their own overlay
  (`fixed inset-0` + scrim) and don't get the shared bottom-sheet / scroll-lock
  treatment. Verified still true as of this handoff.

### 3. PR #3 deliberately deferred (still deferred)
- Offline-first data (IndexedDB mirror + write queue) — skipped; song charts/event media
  are external Drive/iCloud links that don't work offline anyway.
- Web push notifications — deferred until Phase 2 auth + a backend function exist.

### 4. Treasurer name is hard-coded (by design, for now)
The treasurer shown in the ledger balance card and the sidebar is a **hard-coded string**,
not derived from a member record:

- `src/components/views/Ledger.tsx` — `{t.treasurer}: Rodrigo Meneses · …`
- `src/components/shell/Sidebar.tsx` — `{t.treasurer}: Rodrigo M.`

`t.treasurer` is just the i18n label ("Tesorero" / "Treasurer"); the name itself is typed
directly into the JSX. To change the treasurer, edit those two strings. (A future
`treasurer_id` pointer or `is_treasurer` flag on `profiles` would make it data-driven —
see the discussion in the session; not needed yet.)

## Key files map

| File | Role |
|---|---|
| `src/store/useGuataca.ts` | Main store/view-model — device/layout detection, all derived VMs |
| `src/store/store.tsx` | State + `GuatacaProvider` (incl. `toast` / `dismissToast`) |
| `src/store/vm.ts` | View-model builders (`songVm`, `txVm`, `memberVm`, …) + color tokens |
| `src/styles.css` | Theme token system (`--g-*` palette → `@theme` → `--color-*`) |
| `src/lib/data.tsx` | `DataProvider` + central `run()` mutation wrapper (silent reload, offline guard) |
| `src/lib/api.ts` | Supabase read/write layer |
| `src/lib/auth.tsx` | Auth (`useAuth`) |
| `src/lib/supabase.ts` | Supabase client singleton |
| `src/lib/format.ts` | Money/date formatting helpers |
| `src/lib/prefs.ts` | Theme/lang `localStorage` persistence |
| `src/lib/useMediaQuery.ts` | Media-query hook |
| `src/data/` | Demo-mode mock data (`songs.ts`, `events.ts`, `members.ts`, `ledger.ts`, …) |
| `src/i18n.ts` | ES/EN dictionary (`T`) |
| `src/components/shell/Shell.tsx` | Root layout — picks phone vs desktop shell + overlays |
| `src/components/shell/TopProgress.tsx` | Thin indeterminate "saving" bar while `mutating` |
| `src/components/mobile/MobileShell.tsx` | Mobile shell (fixed-position, tab bar) |
| `src/components/pwa/` | `OfflineBanner`, `UpdatePrompt` |
| `src/components/auth/` | `LoginPage`, `SignInForm` |
| `src/components/ui/index.tsx` | Primitives (`Modal`, `Badge`, `Pill`, `Segment`, …) |
| `db/migrations/` | Flyway migrations (currently `V1__baseline.sql` only) |
| `scripts/gen-icons.mjs`, `scripts/vendor-fonts.mjs` | Regenerate PWA icons / fonts |

## Useful commands

```sh
npm run build          # tsc -b && vite build (the CI gate)
npm run typecheck      # tsc -b only
npm run dev            # local dev (service worker disabled by design)
npm run preview        # serve the production build locally
npm run assets:fonts   # re-vendor fonts into public/fonts/
npm run assets:icons   # regenerate the icon set into public/
```

## Suggested next steps

1. Apply the 2-line `--g-pink`/`--g-teal` fix above (or ask Sergio to).
2. Optionally verify the PWA install flow on a real phone (add-to-home-screen, offline
   reload, update prompt).
3. If the mobile shell still shows desktop on a phone after `a06b018`, check for
   "Request Desktop Website" in the browser (reports >1024px, intentionally left on desktop).
