# GUATACA — implementation notes

How the Phase 1 UI in this repo was built from the Claude Design prototype, the conventions it follows, how it was
verified, and what to know before Phase 2. Read [design.md](./design.md) first for *what* the UI is.

## 1. Stack and layout

| Concern | Choice | Why |
| --- | --- | --- |
| Build | Vite 6 | fastest path to a single-page React app; `npm run build` = `tsc -b && vite build` |
| UI | React 18 + TypeScript strict | matches the spec's Phase 1 target; strict TS so Phase 2 can reuse the types |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | the design's tokens map 1:1 to slate/emerald/violet/amber; `@theme` in `src/styles.css` |
| Icons | `lucide-react` | the design's inline SVGs are lucide paths; one custom `SpotifyIcon` |
| Fonts | Google Fonts (Space Grotesk, IBM Plex Sans, IBM Plex Mono) | loaded from `index.html` |
| State | React context + one state object | mirrors the prototype's single class-component state; no store library needed for a prototype |
| Persistence | none | Phase 1 is in-memory by design |

```
src/
  App.tsx                 reads URL knobs → <GuatacaProvider><Shell/>
  types.ts                domain types; field names anticipate the Phase 2 tables
  i18n.ts                 T.es / T.en dictionaries (every UI string, incl. toasts)
  lib/format.ts           TODAY (fixed), d(), days(), fmt(), rel(), money(), money0(), slug()
  data/                   mock records copied verbatim from the design (+ design-system tokens, handoff notes, tour)
  store/
    store.tsx             State interface, initialState(props), provider, set(), toast(), ⌘K / Esc listener
    vm.ts                 pure view-model builders: songVm, eventVm, txVm, gearVm, threadVm, memberVm, feedbackVm, igCaption
    useGuataca.ts        THE hook: state + all derived collections/numbers + all actions (typed renderVals())
  components/
    ui/index.tsx          Badge, Eyebrow, Card, Button, Avatar, IconLink, CloseButton, Field/Input/Select/Textarea,
                          Modal, SpotifyIcon, BrandMark, Segment, Pill, cx
    shell/                Shell (layout + overlay switch), DesktopShell (sidebar + header + view switch), Sidebar, TopBar
    views/                Dashboard, CalendarView, Repertoire, Ledger, Brainstorm, Members, DesignSystem
    mobile/               MobileShell + MobileAgenda / MobileRepertoire / MobileFund / MobileProfile
    modals/               EventModal, FormModals (NewEvent/NewTx/NewSong), ThreadModal, MemberModal, ShareSheet,
                          CustodyDialog, CommandPalette, HandoffPanel, TourOverlay, Toasts
```

## 2. Porting conventions (design → code)

The design is a `.dc.html` template (`{{ bindings }}`, `<sc-if>`, `<sc-for>`, `style-hover`) driven by a
`renderVals()` method. The port keeps a 1:1 correspondence so future design changes are easy to carry over:

- **Bindings → `useGuataca()` fields.** `balanceStr`, `dashUpcoming`, `staleTop → staleSongs`, `songs → filteredSongs`,
  `transactions → tx`, `ev`, `fb`, `th`, `mb`, `sheet`, `custody`, `tour`, `toasts`, `form`, `paletteResults`, …
- **Closures → actions.** The design attached `onOpen`/`onShare`/`onToggle`/`fSet.title` to each row; the port exposes
  `openEvent(id)`, `openShare(id)`, `toggleSong(id)`, `setForm('title', v)`, `voteThread(id)`, `pickPoll(i)`,
  `setRating(k, n)`, `transferCustody(memberId)`, etc.
- **Inline styles → Tailwind utilities with arbitrary values**, preserving the exact px values
  (`text-[13.5px]`, `rounded-[14px]`, `tracking-[.12em]`).
- **Colour is never a raw hex** (post-theming rule that supersedes the original "preserve exact hex"):
  use a token class (`bg-surface`, `text-ink-muted`, `border-line`) or `var(--color-*)` in an
  arbitrary value / inline style. Alpha tints are `color-mix(in srgb, var(--color-x) N%, transparent)`
  or a `--color-tint-*` token, never `hex + '1c'`. View-models in `src/store/vm.ts` return
  `var(--color-*)` strings, so `style={{ color: e.typeColor }}` stays theme-aware with no call-site change.
- **`font:` shorthand → `font-display|sans|mono font-<weight> text-[px]`.**
- **`<sc-if>` → `{cond && …}`, `<sc-for>` → `.map()` with stable keys, `style-hover` → `hover:` classes.**
- **Copy → `t.*` keys**, including a handful of strings that were hard-coded Spanish in the design
  (`genresHint`, `incomeHint`, `expenseHint`, form labels, `proofHint`, `reference`, `streaming`).
- Shared recipes (`.card`, `.badge`, `.eyebrow`, `.btn-*`, `.icon-box`, `.input`, `.overlay`, `.modal-card`) live in
  `src/styles.css` under `@layer components`; keyframes are Tailwind `--animate-*` tokens.

## 3. How it was built

1. **Foundation first, by hand:** types, i18n, formatting, data, store, view-models, UI primitives, shell, styles —
   the contract every screen depends on.
2. **Parallel port of the screens:** 13 implementation agents, one per view / modal group, each given the exact line
   range of the design template plus the relevant `renderVals()` bindings and a written contract of the foundation.
3. **Adversarial fidelity review:** a separate reviewer per output file walked the design markup element by element
   (px, colors incl. alpha tints, fonts, copy, conditionals, hover states, actions, list sources, role gating, grid
   templates, z-index/animation, React correctness) and fixed deviations in place. 20 review passes, all files typecheck clean.
4. **Integration:** `tsc -b` + `vite build`, then a manual browser pass (below).
5. **First code-first increment:** attendance / RSVP (`docs/design.md` §5.4) — types + mock `attendance` maps,
   `rsvpOverrides` state, `eventVm` fields, `setRsvp` action, and four touched components; verified the same way.

## 4. Verification

- **Visual:** the original `Guataca.dc.html` renders standalone (serve its folder; `support.js` loads React from a CDN),
  so every view was screenshotted at 1440 × 900 next to the app: dashboard, calendar, repertoire, ledger, ideas,
  musicians, design system, and the mobile preview — structurally identical.
- **Functional (Chrome, no console errors):** role toggle removes write controls for members; ES/EN re-renders
  dates, captions and notes; mobile tabs; Instagram sheet → *Leyenda copiada* toast; history event → poll vote,
  star ratings, submit → toasts and response count +1; ⌘K → *Nuevo evento* → saved event appears in the calendar and
  the sidebar count increments; thread comment; member modal; genre filter + song expansion; tour walk-through;
  custody transfer updates the custodian + toast; handoff drawer.
- **Static:** `npm run build` passes with strict TypeScript (`noUnusedLocals`, `noUnusedParameters`).

## 5. Known deviations

Intentional, small, and listed so nobody "fixes" them back by accident:

| Deviation | Reason |
| --- | --- |
| **Custody transfer updates the custodian** (design only toasted) | the toast claims it happened; making it real costs nothing and demos the flow |
| Modals close on scrim click; navigation scrolls to top | expected SPA ergonomics; Esc still works as in the design |
| Genre `<select>` options are localized via `GENRES` instead of hard-coded Spanish | consistency with the ES/EN switch |
| `font:` shorthand in the design resets line-height to `normal`; the port inherits `1.5` on some small labels | sub-pixel to ~2 px; invisible in side-by-side screenshots. Add `leading-[normal]` where it matters |
| `CloseButton` has a hover state everywhere (design: only on the event modal) | shared primitive |
| **Attendance / RSVP exists in code but not in `design/Guataca.dc.html`** (event modal section, card chips, dashboard counts, derived "Confirmados") | added code-first after the port (see `docs/iterating.md`); built from the documented vocabulary — tiles, badges, poll-style option buttons, avatars |
| **Light theme + `Light/Dark/System` toggle** (design is dark-only) | added code-first; token architecture in `src/styles.css`, state in `src/store`, bootstrap in `index.html`, control in `MobileProfile` + `TopBar`. The `design/Guataca.dc.html` snapshot lags on all of the below. |
| **Responsive overhaul, 3 tiers** — phone (`<768px`, full-screen `position:fixed` shell), tablet (`768–1024px`, desktop shell + 64px icon-rail sidebar), desktop (`≥1024px`) | the design's "mobile view" was a 392px preview inside the desktop page; it is now a real breakpoint layout. `useGuataca` exposes `layout`/`isPhone`/`isTablet`/`isCoarsePointer`; `Device` gains `'auto'`/`'tablet'`. |
| **Mobile type + touch scale**: no font below 12px (design used 9–11.5), all inputs 16px (design 14px — avoids iOS focus-zoom), tap targets ≥ 44px, `.badge` → 10.5–12px, `Pill` gains a `size` prop | WCAG AA + platform touch minimums; `@media (pointer: coarse)` enforces 44/16px on touch tablets too |
| **Modals are bottom sheets on phone / coarse-pointer**, and the centred-card overlay now scrolls (was `overflow:hidden` with no `max-height` — tall forms were unusable). Body scroll-lock + focus-trap added. | `Modal` in `src/components/ui/index.tsx`, once, so no call-site changes |
| **Bottom nav**: phone shell is `position:fixed; inset:0` with `<html>` scroll locked | the old `min-h-screen`(100vh) wrapper vs `h-dvh` shell let the iOS toolbar scroll the document and drift the tab bar |
| **Mobile repertoire is no longer capped at 14 songs** (`slice(0,14)` removed) | the visible count contradicted the list |
| `.input` has a focus ring; global `:focus-visible` ring added | the design suppressed outlines app-wide (`.input { outline: none }`) |

Everything the design mocks is still mocked: placeholder Drive/iCloud/Docs/YouTube/Spotify links,
`navigator.share` with a desktop toast fallback, in-memory forms/votes/comments/ratings, no auth.

## 6. Running and tooling

```sh
npm install
npm run dev      # http://localhost:5173  (add ?tour=0 to skip the tour)
npm run build    # typecheck + production bundle → dist/
npm run preview
```

Node ≥ 20 (`.nvmrc` pins 24). The dev server hot-reloads; editing `src/store/*` resets in-memory state.

## 7. Toward Phase 2

The app's **Notas de entrega** (Design system view, or ⌘K → *Notas de entrega*) list the suggested Supabase tables,
derived-vs-stored rules and RLS policies. The code is arranged so that swap is mechanical:

- Replace the `data/*.ts` arrays with queries and keep `vm.ts` untouched — the view-models are pure functions over
  domain records whose field names already match the proposed tables.
- Replace `extraEvents / extraTx / extraSongs / extraComments / votes / custodyOverrides` in `store.tsx` with mutations;
  the actions in `useGuataca.ts` are the only writers.
- Replace the role toggle with the authenticated profile's role; the `isAdmin` gating is already centralized.
- Turn the mobile preview into real responsive layouts (`MobileShell` already isolates the four tab bodies).
