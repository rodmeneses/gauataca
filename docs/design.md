# BandSync — UI design reference

This document describes the Phase 1 user interface of BandSync, the cooperative admin dashboard for
**Dulce Tricolor Venezolano** specified in [`SPEC.MD`](../SPEC.MD). It is the written counterpart of the Claude Design
prototype the app is ported from:

> **Design source of truth:** Claude Design project *Guataca UX/UI Prototype*, file `BandSync.dc.html`
> — https://claude.ai/design/p/d7a06c72-dd08-48b8-a34d-cc51a3ff6930?file=BandSync.dc.html

When the design and the code disagree, the design wins unless the deviation is listed in
[implementation.md → Known deviations](./implementation.md#known-deviations).

---

## 1. Product framing

- **Who:** a five-piece Venezuelan folk band in the Bay Area. Two roles — `Admin` (director, treasurer) and `Band member`.
- **What:** one place for the repertoire, the calendar (gigs + rehearsals + history), a transparent cooperative ledger with
  gear inventory, an ideas board, member profiles, post-event retrospectives, and a semi-automated Instagram share flow.
- **Constraint that shapes the UI:** 100 % free stack. Nothing is uploaded — every piece of media is an **external link**
  (Google Docs charts, Drive/iCloud folders, Zelle screenshots). Money never moves inside the app; the ledger records
  what happened elsewhere and links the proof.
- **Phase 1 scope:** a high-fidelity, fully interactive prototype over realistic mock data (24 songs, 11 events,
  13 ledger movements, 6 gear items, 4 threads, 5 members). No auth, no persistence.

## 2. Design language

### 2.1 Theme

Dark mode only. Deep slate surfaces with neon accents; one accent per semantic meaning so color alone is readable:

| Token            | Hex       | Tailwind name | Used for                                   |
| ---------------- | --------- | ------------- | ------------------------------------------ |
| bg / base        | `#020617` | slate-950     | App background, inputs, modal scrims       |
| bg / raised      | `#0b1220` | slate-950+    | Sidebar, inner rows, phone frame, modals   |
| surface          | `#0f172a` | slate-900     | Cards and panels                           |
| border           | `#1e293b` | slate-800     | 1 px borders (`#172033` for subtle inner)  |
| text / primary   | `#f1f5f9` | slate-100     | Headings                                   |
| text / body      | `#cbd5e1` | slate-300     | Reading text                               |
| text / muted     | `#64748b` | slate-500     | Labels, metadata (`#475569` dimmer)        |
| accent / active  | `#34d399` | emerald-400   | Active state, income, balance, primary CTA |
| accent / brand   | `#8b5cf6` | violet-500    | Brand mark, active nav, gigs, Instagram    |
| accent / warn    | `#fbbf24` | amber-400     | Rescheduled, "needs attention", stale      |
| accent / danger  | `#f43f5e` | rose-500      | Cancelled, very stale (`#f87171` expenses) |
| accent / info    | `#38bdf8` | sky-400       | Studio practice                            |

Tints are the accent with an alpha suffix: `1c` (~11 %) for badge backgrounds, `18`/`1a` for button fills,
`55`/`66` for button borders. Genre colors: joropo emerald, llanera sky, gaita violet, tambores orange `#fb923c`,
calipso amber.

### 2.2 Typography

Three Google Fonts, each with one job:

| Role      | Face                | Sizes                                                          |
| --------- | ------------------- | -------------------------------------------------------------- |
| Display   | **Space Grotesk** 600 | Page title 19 px, card titles 15–16 px, modal titles 20–23 px; eyebrows 10–10.5 px uppercase `.11–.14em` |
| Body / UI | **IBM Plex Sans** 400/500/600 | Body 14 px, meta 12.5 px, buttons 13 px, chips 11–11.5 px |
| Numeric   | **IBM Plex Mono** 500/600 | Money 22–38 px, dates/keys/BPM 11–12 px, counters and "hace N días" pills |

### 2.3 Shape & spacing

| Element         | Radius   | Notes                                    |
| --------------- | -------- | ---------------------------------------- |
| Chip / badge    | 5–8 px   | 9.5 px uppercase Space Grotesk           |
| Button / input  | 9–12 px  | 44 px hit targets on mobile / icon links |
| Card            | 14 px    | padding 17–19 px, grid gap 14 px         |
| Modal / hero    | 16–18 px | share sheet 24 px top corners            |
| Page padding    | 24 / 28 px | sidebar 252 px, header sticky with blur |

Motion: `bsFade` (.14–.25 s) for view/overlay entrance, `bsRise` (.24 s, 14 px lift + .985 scale) for cards/modals,
`bsSlide` for the handoff drawer, `bsSheet` for the bottom sheet.

### 2.4 Component vocabulary

- **Stat card** — eyebrow + big mono number + one-line meta.
- **Badge** — type (`Presentación` violet, `Ensayo de estudio` sky, `Ensayo en garaje` grey), state (`Activo` emerald,
  `Reagendado` amber, `Cancelado` rose — only shown when not active), relative date (grey).
- **Date tile** — zero-padded day + 3-letter month, mono.
- **Icon link box** — 44 px square, colored per destination: chart (blue), YouTube (red), Spotify (emerald), band recording (violet).
- **Pill segment** — ES/EN, Próximos/Historial, desktop/mobile; active = 18 % tint of the accent.
- **Buttons** — primary (emerald tint), brand (violet tint), ghost (raised bg), gradient (Instagram, violet→fuchsia).
- **Toast** — bottom-right, emerald for confirmations, violet for informational.

## 3. Information architecture

```
Sidebar (Operación)        Sidebar (El grupo)
├─ Panel      (dashboard)  ├─ Músicos           (members)
├─ Calendario (calendar)   └─ Sistema de diseño (system)
├─ Repertorio (repertoire)
├─ Fondo y equipos (ledger)
└─ Ideas      (brainstorm)
```

Top bar (every view): page title + subtitle, **⌘K** command palette trigger, **ES / EN**, **role toggle**
(Admin ↔ Músico), **desktop / mobile** preview switch, **handoff notes** drawer.
Sidebar footer: pool balance card (→ ledger) and the signed-in member.

## 4. Views

### 4.1 Panel (dashboard)
Four stat cards — pool balance with ↑income/↓expenses, next active event with relative date and
`N confirmados · M por responder`, songs in repertoire,
songs **not rehearsed** (amber card). Below: the next 3 non-cancelled events (with an inline Instagram button on gigs),
the top 5 stale songs (amber/rose dots by staleness), and the 4 most recent ledger movements with proof links.

### 4.2 Calendario
`Próximos` / `Historial` tabs. Events sort ascending in upcoming, descending in history — history is simply
`date < today`, nothing is "archived". Cards: colored top rule per type, date tile, badges, venue, date · time,
"Movido del …" line when rescheduled, a **✓ Voy / Quizás / No voy** chip once you have answered (§5.4),
setlist chip (`count · runtime`), fee/cost chip, **Ver detalles**, and **Instagram** for gigs. Admins get **+ Nuevo evento**; members see an "Solo administradores" lock.

### 4.3 Repertorio
Search box (title, genre, exact key), genre chips, **⚠ Solo sin ensayar** filter, `shown / total` counter.
Each row: genre color bar, title, `Genre · Key · BPM · duration`, a "last rehearsed" pill (emerald ≤ threshold,
amber > threshold, rose > 90 days), and four icon links. Clicking a row expands **Recursos** (the four links with
provenance labels) and **Historial de ensayos** (past events whose setlist included the song). Admins get **+ Nueva canción**.

### 4.4 Fondo y equipos (ledger + gear)
Hero: pool balance = Σ income − Σ expenses (never stored), plus income and expense totals.
Movements table (date · description with ↑/↓ tile · logged-by · **proof link** typed Zelle/Invoice/Photo/Receipt · amount).
Every member can read every movement — transparency is the point. Admins get **Registrar movimiento**.
Gear inventory grid: name, cost · purchase date, condition badge, note, **custodian** (who physically has it) and
**Transferir custodia** (admin) which opens a member picker.

### 4.5 Ideas (brainstorm)
Thread cards with an upvote toggle, title, body, author, date, comment count, and (admin) **Convertir en evento**,
which opens the new-event form pre-filled with the thread's title and body. Opening a thread shows the comments and a composer.

### 4.6 Músicos
Profile cards: initials, name, title, role badge, instruments with proficiency bars (Experto 100 %, Intermedio 62 %,
Principiante 30 %), vocal flags (Voz principal / Coros / Sin voz), member-since, **Ver detalles** → profile modal with email.

### 4.7 Sistema de diseño
Live rendering of the tokens, type scale, component samples (buttons, badges, input + icon boxes, radius/spacing table)
and the Phase 2 **handoff notes** (stack, suggested tables, derived logic, RLS permissions, what is mocked).

## 5. Overlays and flows

| Overlay | Trigger | Content |
| --- | --- | --- |
| **Event detail** | any event card | header badges + note; date / venue / fee / **Confirmados N / 5** tiles (derived from RSVPs); **Asistencia** section on upcoming events (§5.4); setlist (gig) or songs rehearsed (practice) with runtime; media gallery links (past events); **Retrospectiva** for past events with feedback |
| **Retrospective** (inside event detail) | past gig with feedback | aggregated 1–5 ratings (sound, performance, logistics, energy) as bars; "¿Qué salió bien?" / "¿Qué mejoramos?" quotes (named or Anónimo); admin poll with live percentages and one-tap vote; your own star ratings, two text fields, **anonymous toggle**, submit |
| **Nuevo evento / Nueva canción / Registrar movimiento** | admin buttons, ⌘K, convert-thread | small centered forms; the movement form highlights the **proof link** field |
| **Thread** | idea title / comment count | body, comments, composer, convert (admin) |
| **Member** | Ver detalles | instruments, vocals, email, since |
| **Instagram share sheet** | "Preparar para Instagram" | bottom sheet: localized caption preview, the 3-step explanation, **Copiar leyenda** (clipboard + toast), **Abrir el flyer** (if attached), **Compartir en Instagram** (`navigator.share`, toast fallback on desktop) |
| **Transferir custodia** | gear card (admin) | member picker → updates custodian + toast |
| **Command palette** | ⌘K / search box | navigate to any view, run actions (new event/song/movement, prepare next gig for Instagram, handoff, switch language/role), jump to a song |
| **Handoff drawer** | book icon | the Phase 2 notes, slide-in from the right |
| **Tour** | first load | 4 steps: welcome, role switching, bilingual, mobile + ⌘K |

### 5.1 Instagram flow (spec §4.1)
1. Caption is generated from the event (venue, localized date, time, hashtags) in the current language.
2. **Copy** writes it to the clipboard.
3. **Open flyer** opens the attached image link in a new tab so it can be saved to the camera roll.
4. **Share** calls `navigator.share({ text })`; where unsupported (desktop) it shows the `instagram://camera` intent as a toast.

### 5.2 Roles
`Admin` sees every write control (new event/song/movement, transfer custody, convert idea, poll authoring implied).
`Band member` keeps global read access to calendar and ledger, can vote, comment, submit feedback and share.
The role toggle is a prototype affordance — Phase 2 replaces it with Supabase auth + RLS.

> **Decision (2026-09-04):** every new sign-up is created as `admin` by default — the DB trigger
> (`handle_new_user()` in `db/migrations/V1__baseline.sql`) and the client fallback (`src/lib/auth.tsx`)
> both write `role = 'admin'`. In practice this means everyone has full write access and nobody is
> restricted. The `admin`/`member` distinction is slated for removal ("everyone can do admin stuff");
> until then the role column stays but is always `'admin'`. If we later want to restrict a specific
> member, demote that one profile to `'member'`.

### 5.3 Bilingual
Every string, date format (`vie 12 sep 2026` / `Fri Sep 12 2026`), relative label, caption and mock note exists in
Spanish (default) and English. Song titles, venues and names are not translated.

### 5.4 Attendance / RSVP (added code-first — not in the Claude Design file)
Upcoming, non-cancelled events track who is coming. In the event detail modal, under the stat tiles, an
**Asistencia** section shows `N confirmados · M por responder`, the question *¿Vas a este evento?* with three
one-tap answers — **Voy** (emerald), **Quizás** (amber), **No voy** (rose) — and four tiles listing everyone by
initials (hover for the name): Voy · Quizás · No voy · Sin responder (muted). Tapping your current answer again
withdraws it (back to *Sin responder*). Every change toasts *Asistencia guardada*.
Both roles can answer. Past events and cancelled events show no control and keep their historical headcount.
The same answer appears as a `✓ Voy` chip on the calendar card and the mobile Agenda card, and the dashboard's
*Próximo evento* card shows the confirmed / pending counts. "Confirmados" is never stored — it is the count of
*going* answers; pending = band members without an answer.

## 6. Mobile preview

The desktop header's phone icon swaps the layout for a 392 × 812 phone frame (status bar, brand header with balance
pill, scrollable body, 4-tab bar): **Agenda** (upcoming events with your RSVP chip and a full-width gradient Instagram button on gigs),
**Repertorio** (search + song cards with four 48 px link boxes), **Fondo** (balance hero + movement cards with
"Ver comprobante"), **Perfil** (you + the roster). This is a preview of the Phase 2 responsive layout, rendered inside
the desktop page rather than via media queries.

## 7. Data model (as rendered)

```
Member      id, name, short, initial, role, title{es,en}, email, joined, instruments[{n{es,en}, lv}], vocals[]
Song        id, title, genre, key, bpm, dur "m:ss", last (ISO | null)
BandEvent   id, type gig|studio|garage, state active|cancelled|rescheduled, date, time, title{}, venue,
            money (>0 fee, <0 cost), setlist[songId], attend, note{}, flyer?, prevDate?, media[]?, feedback?,
            attendance?{memberId: going|maybe|no}   (upcoming events; absent member = pending)
Feedback    sound, perf, log, energy (avg 1–5), responses, well[], improve[], poll{q, options[{label, v}]}
Transaction id, kind in|out, amt, date, by (memberId), desc{}, proof url|null, proofKind, event?, gear?
Gear        id, name{}, cost, date, holder (memberId), tx?, cond good|attention, note{}
Thread      id, by, date, votes, title{}, body{}, comments[{by, text{}}]
```

**Derived, never stored:** pool balance, upcoming vs history, each song's "last rehearsed" (latest past event whose
setlist contains it), stale flag (`today − last > staleDays`, default 30; rose beyond 90), setlist runtime,
confirmed headcount (count of *going* RSVPs) and pending count.

## 8. Prototype knobs

The design exposes six "tweaks"; the app reads them from the URL:

| Knob | Param | Default |
| --- | --- | --- |
| Band name | `band` | Dulce Tricolor Venezolano |
| Initial language | `lang=es\|en` | es |
| Initial role | `role=admin\|member` | admin |
| Start view | `view=dashboard\|calendar\|repertoire\|ledger\|brainstorm\|members\|system` | dashboard |
| Show tour | `tour=0` to skip | shown |
| Stale threshold (days) | `stale=14…120` | 30 |

Mock "today" is fixed at **2026-08-25** so relative dates in the sample data stay meaningful.
