# GUATACA — GUATACA

Cooperative band admin app described in [SPEC.MD](./SPEC.MD): a bilingual (ES/EN) React + Supabase PWA
(auth, Postgres/RLS, storage, web push; live at https://gauataca.vercel.app). See [CLAUDE.md](./CLAUDE.md) for the current architecture and conventions.
It covers the repertoire, calendar + history, transparent ledger + gear
inventory, brainstorm threads, member profiles, post-event retrospectives and the semi-automated Instagram share flow.

The UI is a faithful port of the Claude Design prototype `Guataca.dc.html`
([design project](https://claude.ai/design/p/d7a06c72-dd08-48b8-a34d-cc51a3ff6930?file=Guataca.dc.html);
snapshot in [`design/`](./design/README.md)).

## Quick start

Prerequisites: **Node.js 24** (`nvm use` reads `.nvmrc`) and npm. Internet is needed only for `npm install` — the fonts are
self-hosted in `public/fonts/`, so the running app makes no third-party requests.

```sh
git clone https://github.com/rodmeneses/gauataca.git
cd gauataca
npm install
cp .env.example .env.local   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Open **http://localhost:5173/**. The app needs a Supabase project (schema from `db/migrations/`, see below); without the env
keys the data fetch fails and the app shows empty data and an error banner — it never shows fake data.

Commands:

```sh
npm run dev            # local dev (the service worker is disabled by design)
npm run build          # strict typecheck + production build → dist/ (CI gate)
npm run lint           # ESLint (CI gate)
npm test               # unit + component tests (vitest)
npm run coverage       # tests + the 95% coverage threshold (CI gate)
npm run size           # gzip JS budget check, run after build (CI gate)
npm run assets:fonts   # re-vendor the self-hosted Google Fonts into public/fonts/
npm run assets:icons   # regenerate the PWA icon set into public/
```

> Node 25+ ships an experimental `localStorage` global that breaks jsdom; if tests fail with
> "Cannot read properties of undefined (reading 'clear')", run them with `NODE_OPTIONS=--no-experimental-webstorage`
> (or just use Node 24 as pinned).

### PWA

The app is an installable PWA (`vite-plugin-pwa`): a web manifest, self-hosted fonts and a service worker that precaches
the app shell so it opens offline. Reads fall back to the last cached response when offline (a thin top bar shows the offline
state); writes made offline are queued in memory and replayed when the connection returns (keep the app open — closing the tab
drops the queue). A new deploy is fetched in the background and applied only when the user accepts the *"Nueva versión
disponible"* prompt — the running session is never swapped mid-action.

Troubleshooting: `node: command not found` → install Node 24 (`nvm install 24 && nvm use`). Port 5173 busy → `npm run dev -- --port 5174`.
To compare with the original design side by side: `python3 -m http.server 5177 --directory design` → http://localhost:5177/Guataca.dc.html.

## Documentation

| Doc | What it covers |
| --- | --- |
| [CLAUDE.md](./CLAUDE.md) | **Start here:** current architecture, conventions, CI gates and gotchas |
| [SPEC.MD](./SPEC.MD) | Product specification |
| [docs/design.md](./docs/design.md) | The UI itself: design language (tokens, type, spacing), information architecture, every view and overlay, roles, bilingual behaviour, data model |
| [docs/implementation.md](./docs/implementation.md) | How the port from the design prototype was built: folder layout, design→code conventions, known deviations |
| [docs/iterating.md](./docs/iterating.md) | How to add features incrementally with Claude Design + Claude Code |
| [design/README.md](./design/README.md) | The committed design source (`Guataca.dc.html` + runtime), how to view and diff it |
| [docs/history/](./docs/history/) | Historical snapshots: the Phase 1 → Phase 2 handoff, an early session summary and the original design prompt |

## Stack

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS v4 — design tokens live in [`src/styles.css`](./src/styles.css) (`@theme`) and map 1:1 to Tailwind's slate / emerald / violet / amber scale
- `lucide-react` icons
- Supabase (Postgres + Auth + RLS + Storage) via `@supabase/supabase-js`; Vercel serverless functions in [`api/`](./api/) for push notifications and the calendar feed
- Deployed on Vercel from `main`

## Database migrations (Flyway)

Schema changes are versioned SQL files under [`db/migrations/`](./db/migrations/) and applied with
[Flyway](https://flywaydb.org) — no more pasting SQL into the Supabase editor by hand.

- `V<n>__description.sql` — versioned migration, applied once in order. `V1__baseline.sql` is the
  single consolidated schema (the whole final schema in one file).
- [`db/wipe.sql`](./db/wipe.sql) — drops everything for a fresh start (NOT a migration).

**Setup (once):**

```sh
brew install flyway
export FLYWAY_URL='jdbc:postgresql://db.<ref>.supabase.co:5432/postgres'   # from Supabase → Settings → Database → Connection string
export FLYWAY_USER='postgres'
export FLYWAY_PASSWORD='<database password>'
```

**Run:**

```sh
flyway info      # see pending/applied migrations
flyway migrate   # apply them
```

A fresh (empty) database runs `V1__baseline.sql` and nothing else — no demo data. To add a change,
create `db/migrations/V2__…sql` and run `flyway migrate`. To start over from scratch, run
[`db/wipe.sql`](./db/wipe.sql) in the Supabase SQL editor, then `flyway migrate` again.

## Prototype knobs

The design's "tweaks" are exposed as URL query params:

| Param   | Values                                                                      | Default                     |
| ------- | --------------------------------------------------------------------------- | --------------------------- |
| `lang`  | `es` \| `en`                                                                | `es`                        |
| `role`  | `admin` \| `member`                                                         | `admin`                     |
| `view`  | `dashboard` `calendar` `repertoire` `ledger` `brainstorm` `members` `system` | `dashboard`                 |
| `tour`  | `0` to skip the welcome tour                                                | shown                       |
| `stale` | 14–120 — days before a song counts as "not rehearsed"                       | `30`                        |
| `band`  | band name shown in the sidebar                                              | `GUATACA` |

Example: `http://localhost:5173/?lang=en&role=member&view=ledger&tour=0`

## Layout

```
api/                    Vercel serverless functions (push notify, ICS calendar feed)
db/migrations/          Flyway-style SQL migrations (V__ versioned, R__ repeatable)
design/                 committed Claude Design source (Guataca.dc.html + support.js)
docs/                   design reference, implementation notes, iteration workflow, history/
src/
  App.tsx                 reads the URL knobs, mounts the providers (auth → push → data → store)
  types.ts                domain types
  i18n.ts                 ES / EN dictionary
  lib/                    Supabase data layer (api/), auth, data provider, formatting, search, offline queue, notify…
  data/                   changelog ("What's new"), song/genre catalogue, design-system notes
  store/
    store.tsx             single UI-state object + provider (⌘K / Esc)
    vm.ts, derive.ts      pure view-model builders and list/aggregate logic (unit-tested)
    useGuataca.ts         the one hook: state + derived view-models + actions
  components/
    ui/                   Badge, Card, Button, Avatar, Modal, ConfirmDialog, Field/Input/Select, Segment/Pill…
    shell/, views/        desktop shell and views (Dashboard, Calendar, Repertoire, Ledger, Brainstorm, Links, Members, DesignSystem)
    mobile/               phone layout with Agenda / Repertorio / Fondo / Ideas / Enlaces / Perfil tabs
    modals/               event detail, forms, thread, member, share sheet, custody, ⌘K palette, search, tour, toasts
```
