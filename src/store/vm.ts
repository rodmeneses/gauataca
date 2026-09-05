/**
 * Pure view-model builders. They turn raw domain records into the exact strings,
 * colors and flags the UI renders — the same shapes the design's renderVals()
 * produced, minus the closures (actions live in useGuataca).
 */
import type { Dict } from '../i18n';
import { GENRES } from '../data';
import { d, days, durationSeconds, fmt, money, money0, monthShort, rel } from '../lib/format';
import type {
  BandEvent, EventFeedback, Gear, GenreId, Instrument, Lang, LinkKind, LocalComment, Localized, Member, Proficiency, RatingKey, RsvpStatus, Song, Take, Thread, Transaction,
} from '../types';

export interface Ctx {
  lang: Lang;
  t: Dict;
  staleDays: number;
  /** Signed-in member (admin → m1, member → m2 in the prototype). */
  meId: string;
  /** true when the signed-in user is an admin (drives write affordances). */
  isAdmin: boolean;
  /** All members, for resolving ids to names/initials. */
  members: Member[];
  /** All events, for resolving a transaction's linked event id. */
  events: BandEvent[];
  /** All gear, for resolving a transaction's linked gear id. */
  gear: Gear[];
  /** Instrument catalog, for resolving instrument ids to names. */
  instruments: Instrument[];
  /** Song recordings ("takes"), for resolving per-event / per-song links. */
  takes: Take[];
}

/** Resolve a member id to a Member (falls back to the first member). */
const FALLBACK_MEMBER: Member = {
  id: '', name: '', short: '', initial: '', role: 'member',
  title: { es: '', en: '' }, email: '', joined: '', instruments: [], vocals: [],
};

export function memberById(members: Member[], id: string): Member {
  return members.find((m) => m.id === id) ?? members[0] ?? FALLBACK_MEMBER;
}

export const L = (lang: Lang, v: Localized | string | null | undefined): string =>
  v && typeof v === 'object' ? (v[lang] ?? v.es) : (v ?? '');

/* ---------------------------------------------------------------- colors */
export const STATE_COLOR = { active: '#34d399', cancelled: '#f43f5e', rescheduled: '#fbbf24' } as const;
export const TYPE_COLOR = { gig: '#a78bfa', studio: '#38bdf8', garage: '#94a3b8' } as const;
export const LEVEL_COLOR: Record<Proficiency, string> = { expert: '#34d399', inter: '#38bdf8', beg: '#64748b' };
export const LEVEL_PCT: Record<Proficiency, string> = { expert: '100%', inter: '62%', beg: '30%' };
export const RSVP_COLOR: Record<RsvpStatus, string> = { going: '#34d399', maybe: '#fbbf24', no: '#f43f5e' };
export const RSVP_PENDING_COLOR = '#64748b';
export const RSVP_ORDER: RsvpStatus[] = ['going', 'maybe', 'no'];
/** Hex + 1c = ~11% alpha tint used for badge backgrounds. */
export const tint = (hex: string) => hex + '1c';

/* ------------------------------------------------------------------ songs */
export interface RehearsalLog {
  id: string;
  title: string;
  date: string;
  typeLabel: string;
}

/** A song link with its label already localized. */
export interface SongLinkVm {
  kind: LinkKind;
  label: string;
  url: string;
}

/** Stable display order for streaming links (chart links keep their position). */
const KIND_ORDER: Record<LinkKind, number> = { youtube: 0, apple: 1, spotify: 2, chart: 3 };

export interface SongVm {
  id: string;
  title: string;
  genre: GenreId;
  genreLabel: string;
  genreShort: string;
  genreColor: string;
  genreBg: string;
  key: string;
  bpm: string;
  dur: string;
  /** "Hace 10 días" / "Never rehearsed" */
  lastLabel: string;
  /** "sáb 15 ago 2026" or "—" */
  lastDate: string;
  staleColor: string;
  staleBg: string;
  isStale: boolean;
  open: boolean;
  /** Streaming links (YouTube / Apple Music / Spotify), synthesized when a kind is missing. */
  streaming: SongLinkVm[];
  hasStreaming: boolean;
  /** Tabs / sheet-music links (several possible). */
  charts: SongLinkVm[];
  hasCharts: boolean;
  logs: RehearsalLog[];
  logCount: number;
  /** Localized names of the instruments this song requires. */
  instruments: string[];
  hasInstruments: boolean;
  /** Recordings ("takes") of this song, oldest first. */
  takes: TakeVm[];
  hasTakes: boolean;
  /** Number of takes (drives the repertoire sort). */
  takeCount: number;
}

export function songVm(s: Song, allEvents: BandEvent[], openSong: string | null, ctx: Ctx): SongVm {
  const { lang, t } = ctx;
  const gap = s.last ? -days(s.last) : 9999;
  const stale = gap > ctx.staleDays;
  const veryStale = gap > 90;
  const g = GENRES[s.genre];
  const logs = allEvents
    .filter((e) => (e.setlist || []).includes(s.id) && days(e.date) <= 0)
    .sort((a, b) => d(b.date).getTime() - d(a.date).getTime())
    .map((e) => ({ id: e.id, title: L(lang, e.title), date: fmt(e.date, lang, true), typeLabel: t[e.type] }));
  const songInstruments = (s.instruments || []).map((id) => {
    const inst = ctx.instruments.find((x) => x.id === id);
    return inst ? L(lang, inst.name) : id;
  });
  const takes = (ctx.takes ?? [])
    .filter((tk) => tk.songId === s.id)
    .sort((a, b) => a.n - b.n)
    .map((tk) => {
      const ev = allEvents.find((x) => x.id === tk.eventId);
      return takeVm(tk, s.title, ev ? fmt(ev.date, lang, true) : '', ctx);
    });
  const links: SongLinkVm[] = (s.links ?? []).map((l) => ({ kind: l.kind, label: L(lang, l.label), url: l.url }));
  const streaming = links.filter((l) => l.kind !== 'chart').sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
  const charts = links.filter((l) => l.kind === 'chart');
  return {
    id: s.id,
    title: s.title,
    genre: s.genre,
    genreLabel: L(lang, g.label),
    genreShort: g.short,
    genreColor: g.color,
    genreBg: tint(g.color),
    key: s.key,
    bpm: String(s.bpm),
    dur: s.dur,
    lastLabel: s.last ? rel(s.last, lang) : t.neverRehearsed,
    lastDate: s.last ? fmt(s.last, lang, true) : '—',
    staleColor: veryStale ? '#f43f5e' : stale ? '#fbbf24' : '#34d399',
    staleBg: veryStale ? '#f43f5e1c' : stale ? '#fbbf241c' : '#34d3991c',
    isStale: stale,
    open: openSong === s.id,
    streaming,
    hasStreaming: streaming.length > 0,
    charts,
    hasCharts: charts.length > 0,
    logs,
    logCount: logs.length,
    instruments: songInstruments,
    hasInstruments: songInstruments.length > 0,
    takes,
    hasTakes: takes.length > 0,
    takeCount: takes.length,
  };
}

/* ------------------------------------------------------------------- takes */
export interface TakeVm {
  id: string;
  songId: string;
  songTitle: string;
  url: string;
  /** "Toma 1" / "Take 1" */
  label: string;
  /** Date of the practice event the take came from. */
  dateStr: string;
}

export function takeVm(tk: Take, songTitle: string, dateStr: string, ctx: Ctx): TakeVm {
  const { t } = ctx;
  return {
    id: tk.id,
    songId: tk.songId,
    songTitle,
    url: tk.url,
    label: t.takeN.replace('%d', String(tk.n)),
    dateStr,
  };
}

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
  /** true when the event tracks RSVPs (upcoming events in the mock). */
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
  media: { label: string; url: string }[];
  hasMedia: boolean;
  /** Recordings ("takes") made during this practice event. */
  takes: TakeVm[];
  hasTakes: boolean;
  hasFeedback: boolean;
  cancelled: boolean;
  /** "Movido del sáb 27 sep 2026" or null. */
  movedFrom: string | null;
  flyer: string | null;
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
    media: (e.media || []).map((m) => ({ label: L(lang, m.label), url: m.url })),
    hasMedia: (e.media || []).length > 0,
    takes,
    hasTakes: takes.length > 0,
    hasFeedback: !!e.feedback,
    cancelled: e.state === 'cancelled',
    movedFrom: e.prevDate ? t.movedFrom + ' ' + fmt(e.prevDate, lang, true) : null,
    flyer: e.flyer ?? null,
  };
}

/* ----------------------------------------------------------- transactions */
export interface TxVm {
  id: string;
  dateStr: string;
  desc: string;
  /** "+$450.00" / "−$47.30" */
  amountStr: string;
  color: string;
  bg: string;
  kindLabel: string;
  isIn: boolean;
  arrow: '↑' | '↓';
  by: string;
  byInitial: string;
  proof: string | null;
  hasProof: boolean;
  /** true when the proof URL points at an image (render a thumbnail). */
  proofIsImage: boolean;
  /** "Zelle" | "Invoice" | "Photo" | "Receipt" */
  proofKind: string;
  /** Localized title of the linked event, or null. */
  eventLabel: string | null;
  /** Localized name of the linked gear, or null. */
  gearLabel: string | null;
  /** Localized income category (fee/tip/donation/contribution), or null. */
  categoryLabel: string | null;
}

export function txVm(x: Transaction, ctx: Ctx): TxVm {
  const { lang, t } = ctx;
  const inc = x.kind === 'in';
  const by = memberById(ctx.members, x.by);
  const ev = x.event ? ctx.events.find((e) => e.id === x.event) : undefined;
  const g = x.gear ? ctx.gear.find((g) => g.id === x.gear) : undefined;
  return {
    id: x.id,
    dateStr: fmt(x.date, lang, true),
    desc: L(lang, x.desc),
    amountStr: (inc ? '+' : '−') + money(x.amt).replace('-', ''),
    color: inc ? '#34d399' : '#f87171',
    bg: inc ? '#34d3991c' : '#f871711c',
    kindLabel: inc ? t.income : t.expense,
    isIn: inc,
    arrow: inc ? '↑' : '↓',
    by: by.short,
    byInitial: by.initial,
    proof: x.proof || null,
    hasProof: !!x.proof,
    proofIsImage: /\.(png|jpe?g|webp|gif|heic)(\?|$)/i.test(x.proof || ''),
    proofKind: x.proofKind === 'zelle' ? t.zelle : x.proofKind === 'invoice' ? t.invoice : x.proofKind === 'photo' ? t.photo : t.receipt,
    eventLabel: ev ? L(lang, ev.title) : null,
    gearLabel: g ? L(lang, g.name) : null,
    categoryLabel: x.category === 'fee' ? t.fee : x.category === 'tip' ? t.tip : x.category === 'donation' ? t.donation : x.category === 'contribution' ? t.contribution : null,
  };
}

/* ------------------------------------------------------------ contributions */
export interface ContributionVm {
  memberId: string;
  name: string;
  initial: string;
  /** All-time contributions, formatted. */
  totalStr: string;
  /** This month's contributions, formatted. */
  monthStr: string;
}

export function contributionVm(member: Member, totalCents: number, monthCents: number): ContributionVm {
  return {
    memberId: member.id,
    name: member.short,
    initial: member.initial,
    totalStr: money(totalCents / 100),
    monthStr: money(monthCents / 100),
  };
}

/* ------------------------------------------------------------------- gear */
export interface GearVm {
  id: string;
  name: string;
  costStr: string;
  dateStr: string;
  holderId: string;
  holder: string;
  holderInitial: string;
  note: string;
  condLabel: string;
  condColor: string;
  condBg: string;
  hasTx: boolean;
  /** Short name of the member who bought it, or null. */
  boughtBy: string | null;
  boughtByInitial: string;
}

export function gearVm(g: Gear, holderId: string, ctx: Ctx): GearVm {
  const { lang, t } = ctx;
  const h = memberById(ctx.members, holderId);
  const buyer = g.boughtBy ? memberById(ctx.members, g.boughtBy) : null;
  const good = g.cond === 'good';
  return {
    id: g.id,
    name: L(lang, g.name),
    costStr: money0(g.cost),
    dateStr: fmt(g.date, lang, true),
    holderId,
    holder: h.short,
    holderInitial: h.initial,
    note: L(lang, g.note),
    condLabel: good ? t.good : t.attention,
    condColor: good ? '#34d399' : '#fbbf24',
    condBg: good ? '#34d3991c' : '#fbbf241c',
    hasTx: !!g.tx,
    boughtBy: buyer ? buyer.short : null,
    boughtByInitial: buyer ? buyer.initial : '',
  };
}

/* ---------------------------------------------------------------- threads */
export interface ThreadVm {
  id: string;
  title: string;
  body: string;
  author: string;
  initial: string;
  dateStr: string;
  /** total votes as string (base + mine). */
  votes: string;
  voted: boolean;
  commentCount: string;
  comments: LocalComment[];
}

export function threadVm(b: Thread, voted: boolean, ctx: Ctx): ThreadVm {
  const { lang } = ctx;
  const a = memberById(ctx.members, b.by);
  const comments: LocalComment[] = b.comments.map((c) => {
    const m = memberById(ctx.members, c.by);
    return { by: m.short, initial: m.initial, text: L(lang, c.text) };
  });
  return {
    id: b.id,
    title: L(lang, b.title),
    body: L(lang, b.body),
    author: a.short,
    initial: a.initial,
    dateStr: fmt(b.date, lang, true),
    votes: String(b.votes),
    voted,
    commentCount: String(comments.length),
    comments,
  };
}

/* ---------------------------------------------------------------- members */
export interface InstrumentVm {
  name: string;
  level: string;
  pct: string;
  color: string;
}
export interface MemberVm {
  id: string;
  name: string;
  short: string;
  initial: string;
  email: string;
  title: string;
  isAdminRole: boolean;
  roleLabel: string;
  roleColor: string;
  roleBg: string;
  /** "Desde mar 11 abr 2023" */
  since: string;
  instruments: InstrumentVm[];
  vocals: { label: string; isNone: boolean }[];
}

export function memberVm(m: Member, ctx: Ctx): MemberVm {
  const { lang, t } = ctx;
  const admin = m.role === 'admin';
  return {
    id: m.id,
    name: m.name,
    short: m.short,
    initial: m.initial,
    email: m.email,
    title: L(lang, m.title),
    isAdminRole: admin,
    roleLabel: admin ? t.admin : t.member,
    roleColor: admin ? '#34d399' : '#94a3b8',
    roleBg: admin ? '#34d3991c' : '#94a3b81c',
    since: t.since + ' ' + fmt(m.joined, lang, true),
    instruments: m.instruments.map((i) => {
      const inst = ctx.instruments.find((x) => x.id === i.id);
      return { name: inst ? L(lang, inst.name) : i.id, level: t[i.lv], pct: LEVEL_PCT[i.lv], color: LEVEL_COLOR[i.lv] };
    }),
    vocals: m.vocals.map((v) => ({ label: t[v], isNone: v === 'none' })),
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
  return { key, label, val: val.toFixed(1), pct: pct + '%', color: val >= 4.2 ? '#34d399' : val >= 3.5 ? '#fbbf24' : '#f87171' };
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
