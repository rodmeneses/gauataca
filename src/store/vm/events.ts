/** Event, RSVP, feedback and share-caption view-models. */
import type { Dict } from '../../i18n';
import { GENRES } from '../../data';
import { d, days, durationSeconds, fmt, money0, monthShort, rel } from '../../lib/format';
import type { BandEvent, EventFeedback, Lang, RatingKey, RsvpStatus, Song } from '../../types';
import { L, RSVP_COLOR, RSVP_PENDING_COLOR, STATE_COLOR, TYPE_COLOR, tint } from './common';
import type { Ctx } from './common';
import { takeVm } from './songs';
import type { TakeVm } from './songs';

/* ----------------------------------------------------------------- events */
export interface SetlistRow {
  id: string;
  n: string;
  title: string;
  key: string;
  dur: string;
  genreColor: string;
}

export interface RsvpPerson {
  id: string;
  initial: string;
  name: string;
}

export function rsvpLabel(s: RsvpStatus, t: Dict): string {
  return s === 'going' ? t.going : s === 'maybe' ? t.maybe : t.notGoing;
}

export interface EventVm {
  id: string;
  type: BandEvent['type'];
  typeLabel: string;
  typeColor: string;
  typeBg: string;
  isGig: boolean;
  /** true for studio / garage (practice) events. */
  isPractice: boolean;
  state: BandEvent['state'];
  stateLabel: string;
  stateColor: string;
  stateBg: string;
  /** true when state !== active (chip is shown). */
  showState: boolean;
  title: string;
  venue: string;
  note: string;
  /** Raw ISO date / "HH:mm" / duration in hours, for .ics export. */
  date: string;
  time: string;
  hours: number | undefined;
  dateStr: string;
  timeStr: string;
  /** "2.5h" or null when no duration is set. */
  hoursStr: string | null;
  rel: string;
  past: boolean;
  /** "12" zero-padded day of month. */
  dayNum: string;
  /** "sep" / "Sep" */
  monStr: string;
  /** "$600" or null when there is no expected income. */
  feeStr: string | null;
  /** "$50" or null when there is no expected cost. */
  costStr: string | null;
  /** true once the event's income/expense have been confirmed into the ledger. */
  settled: boolean;
  /** true when the signed-in admin may settle this event. */
  canSettle: boolean;
  /** Confirmed headcount — count of 'going' when the event tracks attendance, else the historical number. */
  attend: string;
  /** Band size, for "N / total". */
  total: string;
  /** true when the event tracks RSVPs (upcoming events). */
  hasAttendance: boolean;
  /** true when the signed-in member may answer (tracked, upcoming, not cancelled). */
  canRsvp: boolean;
  /** Signed-in member's answer, null = pending. */
  rsvp: RsvpStatus | null;
  rsvpLabel: string | null;
  rsvpColor: string;
  rsvpBg: string;
  going: RsvpPerson[];
  maybe: RsvpPerson[];
  notGoing: RsvpPerson[];
  pending: RsvpPerson[];
  goingCount: number;
  pendingCount: number;
  setlist: SetlistRow[];
  setlistCount: string;
  /** "32 min" */
  runtime: string;
  hasSetlist: boolean;
  /** "Setlist" for gigs, "Canciones ensayadas" for practices. */
  setlistLabel: string;
  /** Uploaded photos (thumbnail grid). */
  photos: { id: number; url: string }[];
  /** Video links (Google Drive). */
  videos: { id: number; label: string; url: string }[];
  hasMedia: boolean;
  /** Recordings ("takes") made during this practice event. */
  takes: TakeVm[];
  hasTakes: boolean;
  hasFeedback: boolean;
  cancelled: boolean;
  /** "Movido del sáb 27 sep 2026" or null. */
  movedFrom: string | null;
  flyer: string | null;
  /** Admin-pinned; sorts to the top of the upcoming/history list. */
  pinned: boolean;
}

export function eventVm(e: BandEvent, allSongs: Song[], ctx: Ctx): EventVm {
  const { lang, t } = ctx;
  const past = days(e.date) < 0;
  const setlist: SetlistRow[] = (e.setlist || [])
    .map((id, i) => {
      const s = allSongs.find((x) => x.id === id);
      return s ? { id: s.id, n: String(i + 1).padStart(2, '0'), title: s.title, key: s.key, dur: s.dur, genreColor: GENRES[s.genre].color } : null;
    })
    .filter((x): x is SetlistRow => x !== null);
  const sec = setlist.reduce((a, s) => a + durationSeconds(s.dur), 0);
  const stateColor = STATE_COLOR[e.state];
  const typeColor = TYPE_COLOR[e.type];

  /* ---- attendance: upcoming events always track RSVPs (a fresh event has no rows yet) */
  const hasAttendance = !past && e.state !== 'cancelled';
  const statusOf = (id: string): RsvpStatus | null => e.attendance?.[id] ?? null;
  const groups: Record<RsvpStatus | 'pending', RsvpPerson[]> = { going: [], maybe: [], no: [], pending: [] };
  if (hasAttendance) {
    for (const m of ctx.members) groups[statusOf(m.id) ?? 'pending'].push({ id: m.id, initial: m.initial, name: m.short });
  }
  const myRsvp = hasAttendance ? statusOf(ctx.meId) : null;
  const canRsvp = hasAttendance && !past && e.state !== 'cancelled';
  const rsvpColor = myRsvp ? RSVP_COLOR[myRsvp] : RSVP_PENDING_COLOR;

  const takes = (ctx.takes ?? [])
    .filter((tk) => tk.eventId === e.id)
    .sort((a, b) => a.n - b.n)
    .map((tk) => {
      const song = allSongs.find((s) => s.id === tk.songId);
      return takeVm(tk, song ? song.title : tk.songId, fmt(e.date, lang, true), ctx);
    });

  return {
    id: e.id,
    type: e.type,
    typeLabel: t[e.type],
    typeColor,
    typeBg: tint(typeColor),
    isGig: e.type === 'gig',
    isPractice: e.type !== 'gig',
    state: e.state,
    stateLabel: t[e.state],
    stateColor,
    stateBg: tint(stateColor),
    showState: e.state !== 'active',
    title: L(lang, e.title),
    venue: e.venue,
    note: L(lang, e.note),
    date: e.date,
    time: e.time,
    hours: e.hours,
    dateStr: fmt(e.date, lang, true),
    timeStr: e.time,
    hoursStr: e.hours != null ? String(e.hours) + 'h' : null,
    rel: rel(e.date, lang),
    past,
    dayNum: String(d(e.date).getDate()).padStart(2, '0'),
    monStr: monthShort(e.date, lang),
    feeStr: e.fee ? money0(e.fee) : null,
    costStr: e.cost ? money0(e.cost) : null,
    settled: e.settled,
    canSettle: ctx.isAdmin && !e.settled && (e.fee > 0 || e.cost > 0),
    attend: String(hasAttendance ? groups.going.length : e.attend || 0),
    total: String(ctx.members.length),
    hasAttendance,
    canRsvp,
    rsvp: myRsvp,
    rsvpLabel: myRsvp ? rsvpLabel(myRsvp, t) : null,
    rsvpColor,
    rsvpBg: tint(rsvpColor),
    going: groups.going,
    maybe: groups.maybe,
    notGoing: groups.no,
    pending: groups.pending,
    goingCount: groups.going.length,
    pendingCount: groups.pending.length,
    setlist,
    setlistCount: String(setlist.length),
    runtime: Math.floor(sec / 60) + ' min',
    hasSetlist: setlist.length > 0,
    setlistLabel: e.type === 'gig' ? t.setlist : t.rehearsed,
    photos: (e.media || []).filter((m) => m.kind === 'photo').map((m) => ({ id: m.id, url: m.url })),
    videos: (e.media || []).filter((m) => m.kind === 'video').map((m) => ({ id: m.id, label: L(lang, m.label), url: m.url })),
    hasMedia: (e.media || []).length > 0,
    takes,
    hasTakes: takes.length > 0,
    hasFeedback: !!e.feedback,
    cancelled: e.state === 'cancelled',
    movedFrom: e.prevDate ? t.movedFrom + ' ' + fmt(e.prevDate, lang, true) : null,
    flyer: e.flyer ?? null,
    pinned: e.pinned,
  };
}

/* --------------------------------------------------------------- feedback */
export interface RatingRow {
  key: RatingKey;
  label: string;
  /** "4.2" */
  val: string;
  /** "84%" */
  pct: string;
  color: string;
}
export interface PollOptVm {
  i: number;
  label: string;
  v: string;
  pct: string;
  picked: boolean;
}
export interface FeedbackVm {
  responses: string;
  rows: RatingRow[];
  well: { text: string; by: string; anon: boolean }[];
  improve: { text: string; by: string; anon: boolean }[];
  pollQ: string;
  pollOpts: PollOptVm[];
  pollTotal: string;
}

function ratingRow(key: RatingKey, label: string, val: number): RatingRow {
  const pct = Math.round((val / 5) * 100);
  return { key, label, val: val.toFixed(1), pct: pct + '%', color: val >= 4.2 ? 'var(--color-emerald)' : val >= 3.5 ? 'var(--color-amber)' : 'var(--color-red)' };
}

export function feedbackVm(f: EventFeedback, pollPick: number | null, ctx: Ctx): FeedbackVm {
  const { lang, t } = ctx;
  const anonLabel = t.anonymous;
  const base = f.poll.options.map((o, i) => ({ i, label: L(lang, o.label), v: o.v }));
  const total = base.reduce((a, b) => a + b.v, 0) || 1;
  return {
    responses: String(f.responses),
    rows: [ratingRow('sound', t.sound, f.sound), ratingRow('perf', t.perf, f.perf), ratingRow('log', t.logistics, f.log), ratingRow('energy', t.energy, f.energy)],
    well: f.well.map((w) => ({ text: L(lang, w.text), by: w.anon ? anonLabel : (w.by ?? anonLabel), anon: w.anon })),
    improve: f.improve.map((w) => ({ text: L(lang, w.text), by: w.anon ? anonLabel : (w.by ?? anonLabel), anon: w.anon })),
    pollQ: L(lang, f.poll.q),
    pollOpts: base.map((o) => ({ i: o.i, label: o.label, v: String(o.v), pct: Math.round((o.v / total) * 100) + '%', picked: pollPick === o.i })),
    pollTotal: String(total),
  };
}

/* ------------------------------------------------------------ share sheet */
export function igCaption(e: BandEvent, lang: Lang): string {
  const date = fmt(e.date, lang, true);
  return lang === 'es'
    ? '🎵 ¡Música en vivo! Nos presentamos en ' + e.venue + ' el ' + date + ' a las ' + e.time + '. ¡Los esperamos!\n\n#GUATACA #MúsicaVenezolana #Joropo #BayArea'
    : '🎵 Live music alert! Catch us at ' + e.venue + ' on ' + date + ' at ' + e.time + '. See you there!\n\n#GUATACA #VenezuelanMusic #Joropo #BayArea';
}
