# Iterating on the UI with Claude Design + Claude Code

How to add or change a feature without re-porting the whole prototype. **RSVP / attendance** is the worked example
below; it was in fact implemented **code-first** in PR #1 (`docs/design.md` §5.4), so the prompts here stay as
templates — swap in the next feature (e.g. the setlist builder or "new idea" from `HANDOFF.md` §3).

## 1. Pick the path

| Change | Path | Why |
| --- | --- | --- |
| Uses existing components and fits an existing screen (a button, a chip, a small section — e.g. RSVP on the event card/modal) | **Code-first:** prompt Claude Code directly, referencing `docs/design.md` for the vocabulary | Faster; the design system is documented and the primitives exist; the design file then lags by a small, well-described delta |
| New layout or new screen (setlist builder, poll authoring, profile editor) | **Design-first:** iterate in Claude Design, re-export, implement the diff | Layout exploration is what the design tool is good at; the exported diff is the handoff |

Either way keep `design/BandSync.dc.html` current, so `git diff` stays the source of truth for what changed.

## 2. Design-first workflow (delta, not everything)

1. In the Claude Design project, send the prompt in §3. It edits the existing `BandSync.dc.html` in place and appends a
   **"Delta for Claude Code"** section to the in-app handoff notes.
2. Re-export the file over `design/BandSync.dc.html` (through the DesignSync MCP `get_file`, or download) and commit it
   on a branch. `git diff` now shows exactly which template regions and `renderVals()` bindings changed.
3. Prompt Claude Code with §4. It reads the diff + the delta notes and changes only the affected components, store
   fields, view-models and i18n keys.
4. Verify with both running side by side: `python3 -m http.server 5177 --directory design` and `npm run dev`.

Why in-place matters: Claude Design regenerates the whole file; if it also renames bindings or restructures the
template, the diff becomes noise and the port turns into a re-port. The prompt below pins names and asks for minimal edits.

## 3. Prompt for Claude Design (RSVP / attendance)

Paste into the *Guataca UX/UI Prototype* project, with `BandSync.dc.html` open:

```
Update BandSync.dc.html IN PLACE to add event attendance (RSVP). This file has already been ported to code,
so make the smallest possible edit and keep every existing binding, state field, id, string key and template
structure unchanged — only add. Do not restructure or re-style existing markup.

Functionality
- On every UPCOMING event that is not cancelled, the signed-in member can set their attendance:
  "Voy" (going) / "No voy" (not going) / "Quizás" (maybe), one-tap, toggleable, like the poll options.
- Show it in three places, reusing existing components: (a) the event detail modal — a segmented control under the
  stat tiles; (b) the calendar event card — a small chip with the current status next to the type/state badges;
  (c) the mobile Agenda card — the same chip.
- "Confirmados" becomes derived: count of "going" responses. In the event modal, list who is going / maybe / not
  going as initials avatars with a tooltip name (admins and members both see it).
- Dashboard "Próximo evento" card: add one line "N confirmados · M por responder".
- Both roles can RSVP. Cancelled and past events show no control (past events keep the historical count).

Data / state (use exactly these names)
- Mock data: add `attendance: { m1: 'going', m2: 'going', m3: 'maybe', m4: 'going', m5: 'no' }` style maps to the
  existing EVENTS entries (vary them realistically; derive `attend` from them instead of the hard-coded number).
- State: `myRsvp: {}` (eventId → 'going' | 'no' | 'maybe').
- Bindings: `ev.rsvp` = current user's status or null; `ev.going`, `ev.maybe`, `ev.notGoing` (arrays of
  {initial, name}); `ev.goingCount`, `ev.pendingCount`; `ev.canRsvp`; actions `ev.onRsvp('going'|'no'|'maybe')`;
  on calendar cards `e.rsvpLabel`, `e.rsvpColor`, `e.rsvpBg`.
- Strings (ES and EN): rsvp: 'Asistencia'/'Attendance', going: 'Voy'/'Going', notGoing: 'No voy'/'Not going',
  maybe: 'Quizás'/'Maybe', pending: 'por responder'/'pending', rsvpSaved: 'Asistencia guardada'/'Attendance saved'.
- Colors: going emerald (#34d399), maybe amber (#fbbf24), not going rose (#f43f5e), pending muted (#64748b).
- Toast on change using the existing toast().

Handoff
- Append to the handoff notes (the handoffNotes array shown in the Sistema de diseño view and the drawer) a new group
  "Delta — asistencia (RSVP)" with: the new table `event_attendance(event_id, profile_id, status, updated_at)` with
  a unique (event_id, profile_id); RLS: members insert/update their own row, everyone reads; `attend` is derived
  as count(status='going').
- At the very end of renderVals() add a comment block "// DELTA <date>: RSVP — touched: <list every template
  region you edited by its nearest heading/section and every new binding>" so the diff is self-describing.
- Keep all six tweaks working and keep ES/EN and admin/member complete.
```

## 4. Prompt for Claude Code after the re-export

```
The design in design/BandSync.dc.html was updated in Claude Design (commit <sha> vs the previous snapshot).
Implement ONLY the delta:
1. Run `git diff <previous-sha> -- design/BandSync.dc.html` and read the "DELTA" comment at the end of
   renderVals() plus the new handoff group.
2. Map the changes onto the existing code by the conventions in docs/implementation.md §2: new mock fields →
   src/data + src/types, new state → src/store/store.tsx, new bindings → src/store/vm.ts / useBandSync.ts, new
   strings → src/i18n.ts (both languages), template changes → the matching component under src/components.
3. Do not touch components whose design region did not change. Keep px/colors exact.
4. Typecheck + build, then verify in the browser against the served design (python3 -m http.server 5177
   --directory design) for every touched screen in ES and EN, admin and member, desktop and mobile.
5. Update docs/design.md (the affected view/overlay rows and the data model), HANDOFF.md §3 (remove the closed gap),
   and add any deliberate deviation to docs/implementation.md §5.
```

## 5. Code-first prompt (if you skip the design step)

```
Add RSVP / attendance confirmation to the BandSync prototype following docs/design.md and the existing primitives
(Badge, Pill/Segment, Avatar, toast). Requirements: <paste the "Functionality" and "Data / state" blocks from §3>.
Keep design/BandSync.dc.html untouched but document the delta in docs/design.md §5 and note in
docs/implementation.md §5 that the design file lags on this feature. Verify ES/EN, admin/member, desktop/mobile.
```
