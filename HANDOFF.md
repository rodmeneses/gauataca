# HANDOFF — BandSync, from Phase 1 (UI) to Phase 2 (backend)

Written 2026-08-25 for the next agent/engineer. Read this first, then the docs it points to. It says what exists,
what is deliberately fake, what the spec asks for that the UI still lacks, and a concrete plan for Phase 2.

## 0. TL;DR

- **Done:** the complete Phase 1 UI — a fully interactive React app over in-memory mock data, ported 1:1 from the
  Claude Design prototype. Every screen, modal and flow in the design works (bilingual, role-gated, mobile preview).
  PR: https://github.com/rodmeneses/gauataca/pull/1
- **Not done:** everything server-side. No auth, no database, no persistence — a page reload resets all edits.
- **Next:** Phase 2 = Supabase free tier (Postgres + Auth + RLS). **No file storage by design** — media, charts,
  flyers and payment proofs stay *links* to Google Drive / iCloud / Docs (SPEC §1, §3, §6). Then close the
  functional gaps in §3 below, most of which need a backend anyway.

## 1. Read in this order

| Where | Why |
| --- | --- |
| [`SPEC.MD`](./SPEC.MD) | the product contract; Phase 2 stack is stated there (Supabase free tier, Google/Apple auth) |
| [`docs/design.md`](./docs/design.md) | what every view/overlay is and how it behaves; data model as rendered; the six URL knobs |
| [`docs/implementation.md`](./docs/implementation.md) | code layout, design→code conventions, how it was verified, known deviations, Phase 2 seams |
| In-app **Notas de entrega** (view *Sistema de diseño*, or ⌘K → "Notas de entrega") | the suggested tables, derived-vs-stored rules and RLS policies, written by the designer |
| `src/data/system.ts` → `HANDOFF_NOTES` | same notes as data, so you can grep them |
| Design source | Claude Design project `d7a06c72-dd08-48b8-a34d-cc51a3ff6930`, file `BandSync.dc.html` (readable through the DesignSync MCP `get_file`). Ground truth for any UI change |

Run it: `npm install && npm run dev` → http://localhost:5173/?tour=0 (Node ≥ 20; `.nvmrc` pins 24).

## 2. What the UI does today (all mock, all in memory)

Everything below is exercised and works in the browser; see `docs/implementation.md` §4 for the exact checklist.

- Navigation: Panel · Calendario (próximos/historial) · Repertorio · Fondo y equipos · Ideas · Músicos · Sistema de diseño.
- Create: new event, new song, new ledger movement (admin). They insert into local state and show in lists/counters.
- Interact: upvote ideas, comment on a thread, convert an idea into a pre-filled event form, vote in an event poll,
  rate a past event (4 × 1–5 stars) and submit a retrospective (with anonymous toggle), transfer gear custody.
- Instagram flow: caption generation (ES/EN) → clipboard → open flyer link → `navigator.share` (toast fallback on desktop).
- Role toggle Admin ↔ Músico (write controls disappear for members), ES/EN, desktop ↔ phone-frame preview, ⌘K palette, tour.

Where the writes live: **`src/store/useBandSync.ts` is the only place that mutates state**; `src/store/vm.ts` is pure
(records → strings/colors). That separation is the seam for Phase 2.

## 3. Gaps against the SPEC (not in the design, therefore not in the UI)

Answering "is X already there?" honestly. None of these exist as UI today; the ES/EN strings for some of them
(`t.edit`, `t.addMedia`, `t.newThread`) are already in `src/i18n.ts` but unused.

| SPEC | Missing | Notes |
| --- | --- | --- |
| §4 events | **RSVP / confirm attendance ("reserve a spot")** | The "Confirmados N / 5" tile in the event modal is a static number from mock data. There is no button for a member to confirm/decline. Needs `event_attendance(event_id, profile_id, status)` |
| §4 events | Edit / cancel / reschedule an existing event | Only *create* exists. States `cancelled` / `rescheduled` (+ `prevDate`) are rendered but only set in mock data |
| §4 setlists | **Setlist builder** for gigs; tagging songs rehearsed at a practice | Setlists are displayed (order, key, runtime) but there is no editor. "Last rehearsed" is derived from `setlist` of past events, so this editor is what makes the rehearsal analytics real |
| §4 media | "Add gallery link" on past events | Galleries render (`event.media[]`) but members cannot submit a link |
| §5 feedback | Admin **poll authoring** | One poll exists in mock data; there is no "add poll" UI. Aggregated view exists |
| §3 songs | Edit song / edit its four resource links | Create only; links are generated placeholder URLs (`chart`, `yt`, `sp`, `rec` in `vm.ts`) |
| §6 gear | Add / edit gear, condition notes | Inventory is read-only except custody transfer |
| §6 ledger | Filter by type/date; link a movement to an event or gear from the form | `ledgerFilter` state exists but no control; mock data already carries `event`/`gear` ids |
| §7 brainstorm | **Create a new thread** | Threads are read/vote/comment only |
| §2 profiles | Edit own profile (instruments, proficiency, vocals) | Profile modal is read-only |
| §2 auth | Email/password + Google/Apple sign-in, multi-role profiles | Role is a prototype toggle; "me" is Rodrigo (admin) or Caro (member) |

Recommended order: auth → persistence of what already exists → RSVP + setlist builder + new thread (highest user value
for the band) → the remaining editors.

## 4. Phase 2 plan (proposed)

### 4.1 Supabase project
1. Create the project (free tier). Enable **Auth** providers: email/password, Google, Apple (SPEC §2).
2. Schema — start from the in-app *Tablas sugeridas* (also in `src/data/system.ts`) and add the two tables the gaps need:
   ```
   profiles, profile_instruments, profile_vocals
   songs
   events, event_songs(event_id, song_id, position)
   event_media, feedback, polls, poll_options, poll_votes
   event_attendance(event_id, profile_id, status)          -- RSVP (new)
   transactions, gear, gear_custody_log
   threads, thread_votes, thread_comments
   ```
   Money in cents. All "media" columns are `text` URLs — **do not add Storage buckets** (SPEC §1).
3. Derived, never stored (put them in SQL views or compute client-side as `vm.ts` does today):
   pool balance = Σ income − Σ expenses; history = `starts_at < now()`; `last_rehearsed_at` = max `starts_at` of past
   events that include the song; "stale" = `today − last > stale_days` (setting, default 30; rose > 90).
4. **RLS** (from the in-app notes): admins write events/songs/transactions/gear/polls and can convert ideas;
   members read everything (ledger transparency is intentional) and write their own profile, feedback, media links,
   threads, comments, votes, attendance.
5. Seed from `src/data/*.ts` — the records are already shaped like the tables (ids `m1…`, `s1…`, `e1…/h1…`, `t0…`, `g1…`, `b1…`).
   Note the mock "today" is hard-coded to 2026-08-25 in `src/lib/format.ts`; switch `TODAY` to `new Date()` when real data lands.

### 4.2 Wiring the app
- Add `@supabase/supabase-js`, a client in `src/lib/supabase.ts`, `.env` with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (gitignore already covers `*.local`).
- Replace the arrays in `src/data/` with queries; keep `src/store/vm.ts` untouched (pure functions over the same shapes).
- In `src/store/store.tsx`, the session-only fields `extraEvents / extraTx / extraSongs / extraComments / votes /
  pollPick / myRatings / fbSent / custodyOverrides` become mutations + refetch (or optimistic updates). Everything else
  in `State` is genuine UI state and stays.
- Replace the role toggle with the authenticated profile's role; `isAdmin` gating is already centralized in `useBandSync`.
  Keep the toggle behind a dev flag if useful for demos.
- Keep every user-visible string in `src/i18n.ts` (ES default, EN complete).
- Mobile: today's phone-frame preview (`src/components/mobile/`) is a demo inside the desktop page. For real phones,
  turn its four tab bodies into the small-screen layout with media queries and drop the frame.

### 4.3 Ship
- Deploy the Vite build (Vercel/Netlify free tier); add the Supabase env vars there. `npm run build` must stay green
  (strict TS, `noUnusedLocals`).
- Suggested acceptance: a member can sign in with Google, see the calendar and ledger, RSVP to a gig, submit a
  retrospective; an admin can create/edit an event, build its setlist, log a movement with a proof link, transfer custody.

## 5. Guardrails / conventions to keep

- The Claude Design file is the visual source of truth; deviations are listed in `docs/implementation.md` §5 — add to
  that table rather than silently diverging.
- Values from the design are exact (px, hex incl. alpha tints); use Tailwind arbitrary values, tokens in `src/styles.css`.
- Actions only in `useBandSync.ts`; view-models only in `vm.ts`; components never compute domain logic.
- Mock data is the seed — extend it rather than replacing it, so screenshots stay comparable with the design.
- Tooling quirk on the original machine: Node lives under nvm and may not be on the tool's PATH; `.nvmrc` = 24.

## 6. Open questions for the product owner

1. Should members be able to **create events** (e.g. propose a garage practice) or only admins (current)?
2. RSVP semantics: yes/no/maybe, and does a gig need a minimum headcount before it counts as "Activo"?
3. Who can add a poll to an event — any admin, or only the event creator?
4. Should the cooperative ledger allow **members** to log a movement (with proof) for treasurer approval, or admins only (current)?
