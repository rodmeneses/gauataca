# BandSync — Dulce Tricolor Venezolano

Phase 1 prototype of the cooperative band admin dashboard described in [SPEC.MD](./SPEC.MD): a bilingual (ES/EN),
dark-mode React app over realistic mock data covering the repertoire, calendar + history, transparent ledger + gear
inventory, brainstorm threads, member profiles, post-event retrospectives and the semi-automated Instagram share flow.

The UI is a faithful port of the Claude Design prototype `BandSync.dc.html`
([design project](https://claude.ai/design/p/d7a06c72-dd08-48b8-a34d-cc51a3ff6930?file=BandSync.dc.html);
snapshot in [`design/`](./design/README.md)).

## Quick start (play with the mock locally)

Prerequisites: **Node.js 20 or newer** and npm. With nvm: `nvm use` (an `.nvmrc` pins 24). Internet is needed once for
`npm install` and, while running, for the Google Fonts.

```sh
git clone https://github.com/rodmeneses/gauataca.git
cd gauataca
npm install
npm run dev
```

Open **http://localhost:5173/** — the welcome tour explains the controls; **http://localhost:5173/?tour=0** skips it.
Everything is in memory: what you create, vote or rate stays until you reload, then the mock data resets.

Things to try:

1. **Panel** — stat cards (incl. confirmed / pending for the next event), next events, songs not rehearsed, latest ledger movements.
2. **Calendario → Ver detalles** on an upcoming event → **Asistencia**: answer *Voy / Quizás / No voy* — the roster,
   "Confirmados", the card chip and the dashboard counts update (tap your answer again to withdraw it).
3. **Calendario → Historial → "Cierre del Festival de Verano" → Ver detalles** — setlist, gallery links and the
   *Retrospectiva*: vote in the poll, rate with stars, write feedback, toggle anonymous, submit (toasts + response count).
4. **Preparar para Instagram** on any gig (card, modal, or mobile) — caption preview, *Copiar leyenda* (clipboard),
   *Abrir el flyer*, *Compartir* (`navigator.share`; a toast on desktop).
5. **Repertorio** — search, genre chips, *⚠ Solo sin ensayar*, click a row to expand resources + rehearsal log; **+ Nueva canción**.
6. **Fondo y equipos** — ledger with proof links, **Registrar movimiento**, gear cards → **Transferir custodia**.
7. **Ideas** — upvote, open a thread, comment, **Convertir en evento** (pre-fills the event form).
8. **Top bar** — **ES/EN**, **Admin ↔ Músico** (write controls disappear for members; RSVP is answered as Caro), **desktop ↔ phone** preview
   (Agenda / Repertorio / Fondo / Perfil tabs), **⌘K** command palette, the **book icon** opens the Phase 2 handoff notes.
9. **Sistema de diseño** — live tokens, type scale, component samples, handoff notes.

Other commands:

```sh
npm run build      # strict typecheck + production build → dist/
npm run preview    # serve the production build on http://localhost:4173
```

Troubleshooting: `node: command not found` → install Node 20+ (or `nvm install 24 && nvm use`). Port 5173 busy → `npm run dev -- --port 5174`.
To compare with the original design side by side: `python3 -m http.server 5177 --directory design` → http://localhost:5177/BandSync.dc.html.

## Documentation

| Doc | What it covers |
| --- | --- |
| [HANDOFF.md](./HANDOFF.md) | **Start here if you are continuing the work:** what exists, what is mocked, gaps vs. the spec (RSVP, setlist builder, editing…), and the Phase 2 (Supabase) plan |
| [docs/design.md](./docs/design.md) | The UI itself: design language (tokens, type, spacing), information architecture, every view and overlay, the Instagram and retrospective flows, roles, bilingual behaviour, mobile preview, data model, prototype knobs |
| [docs/implementation.md](./docs/implementation.md) | How the port is built: stack, folder layout, design→code conventions, how it was produced and verified, known deviations, and the path to Phase 2 |
| [docs/iterating.md](./docs/iterating.md) | How to add features incrementally with Claude Design + Claude Code (delta workflow and ready-to-paste prompts; RSVP as the worked example) |
| [design/README.md](./design/README.md) | The committed design source (`BandSync.dc.html` + runtime), how to view and diff it |
| [SPEC.MD](./SPEC.MD) | Product specification |
| [prompt-ui-design.md](./prompt-ui-design.md) | The prompt that produced the design prototype |

## Stack

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS v4 — design tokens live in [`src/styles.css`](./src/styles.css) (`@theme`) and map 1:1 to Tailwind's slate / emerald / violet / amber scale
- `lucide-react` icons
- No backend: everything is in-memory (Phase 2 target is Supabase — see the *Handoff notes* inside the app, `Sistema de diseño` view or ⌘K → "Notas de entrega")

## Database migrations (Flyway)

Schema changes are versioned SQL files under [`db/migrations/`](./db/migrations/) and applied with
[Flyway](https://flywaydb.org) — no more pasting SQL into the Supabase editor by hand.

- `V<n>__description.sql` — versioned migration, applied once in order. `V1__baseline.sql` is the
  single consolidated schema (the whole final schema in one file).
- [`db/demo_data.sql`](./db/demo_data.sql) — optional demo dataset (NOT a migration); run it manually
  only when you want fake sample data.
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
| `band`  | band name shown in the sidebar                                              | `Dulce Tricolor Venezolano` |

Example: `http://localhost:5173/?lang=en&role=member&view=ledger&tour=0`

## Layout

```
design/                 committed Claude Design source (BandSync.dc.html + support.js)
docs/                   design reference, implementation notes, iteration workflow
src/
  App.tsx                 reads the knobs, mounts the store
  types.ts                domain types (mirror the suggested Phase 2 tables)
  i18n.ts                 ES / EN dictionary
  lib/format.ts           dates (fixed TODAY = 2026-08-25), money, slug
  data/                   mock members, songs, events, ledger, gear, threads, design-system notes
  store/
    store.tsx             single state object + provider (⌘K / Esc)
    vm.ts                 pure view-model builders (song / event / tx / gear / thread / member / feedback)
    useBandSync.ts        the one hook: state + derived view-models + actions
  components/
    ui/                   Badge, Card, Button, Avatar, IconLink, Modal, Field/Input/Select/Textarea, Segment/Pill…
    shell/                desktop shell (sidebar, top bar)
    views/                Dashboard, CalendarView, Repertoire, Ledger, Brainstorm, Members, DesignSystem
    mobile/               phone-frame preview with Agenda / Repertorio / Fondo / Perfil tabs
    modals/               event detail (+ retrospective), forms, thread, member, share sheet, custody, ⌘K palette, handoff, tour, toasts
```

## Mocked on purpose

- Drive / iCloud / Docs / YouTube / Spotify links are placeholders.
- `navigator.share` and the `instagram://camera` deep link are attempted for real on mobile; on desktop they fall back to a toast.
- New event / song / movement forms, votes, comments, poll picks, ratings, RSVP answers and custody transfers update local state only.
- No auth (Phase 2); other spec gaps are listed in [HANDOFF.md](./HANDOFF.md) §3.
