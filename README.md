# BandSync — Dulce Tricolor Venezolano

Phase 1 prototype of the cooperative band admin dashboard described in [SPEC.MD](./SPEC.MD): a bilingual (ES/EN),
dark-mode React app over realistic mock data covering the repertoire, calendar + history, transparent ledger + gear
inventory, brainstorm threads, member profiles, post-event retrospectives and the semi-automated Instagram share flow.

The UI is a faithful port of the Claude Design prototype `BandSync.dc.html`
([design project](https://claude.ai/design/p/d7a06c72-dd08-48b8-a34d-cc51a3ff6930?file=BandSync.dc.html)).

## Documentation

| Doc | What it covers |
| --- | --- |
| [HANDOFF.md](./HANDOFF.md) | **Start here if you are continuing the work:** what exists, what is mocked, gaps vs. the spec (RSVP, setlist builder, editing…), and the Phase 2 (Supabase) plan |
| [docs/design.md](./docs/design.md) | The UI itself: design language (tokens, type, spacing), information architecture, every view and overlay, the Instagram and retrospective flows, roles, bilingual behaviour, mobile preview, data model, prototype knobs |
| [docs/implementation.md](./docs/implementation.md) | How the port is built: stack, folder layout, design→code conventions, how it was produced and verified, known deviations, and the path to Phase 2 |
| [SPEC.MD](./SPEC.MD) | Product specification |
| [prompt-ui-design.md](./prompt-ui-design.md) | The prompt that produced the design prototype |

## Run

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build → dist/
npm run preview
```

Node 20+ (an `.nvmrc` pins 24).

## Stack

- Vite + React 18 + TypeScript (strict)
- Tailwind CSS v4 — design tokens live in [`src/styles.css`](./src/styles.css) (`@theme`) and map 1:1 to Tailwind's slate / emerald / violet / amber scale
- `lucide-react` icons
- No backend: everything is in-memory (Phase 2 target is Supabase — see the *Handoff notes* inside the app, `Sistema de diseño` view or ⌘K → "Notas de entrega")

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

In-app: ES/EN switch, Admin ↔ Músico role toggle, desktop ↔ mobile preview, ⌘K command palette, `Esc` closes overlays.

## Layout

```
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
- New event / song / movement forms, votes, comments, poll picks, ratings and custody transfers update local state only.
- No auth (Phase 2).
