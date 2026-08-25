/**
 * Pure view-model builders. They turn raw domain records into the exact strings,
 * colors and flags the UI renders — the same shapes the design's renderVals()
 * produced, minus the closures (actions live in useBandSync).
 */
import type { Dict } from '../i18n';
import { GENRES, memberById } from '../data';
import { d, days, durationSeconds, fmt, money, money0, monthShort, rel, slug } from '../lib/format';
import type {
  BandEvent, EventFeedback, Gear, GenreId, Lang, LocalComment, Localized, Member, Proficiency, RatingKey, Song, Thread, Transaction,
} from '../types';

export interface Ctx {
  lang: Lang;
  t: Dict;
  staleDays: number;
}

export const L = (lang: Lang, v: Localized | string | null | undefined): string =>
  v && typeof v === 'object' ? (v[lang] ?? v.es) : (v ?? '');

/* ---------------------------------------------------------------- colors */
export const STATE_COLOR = { active: '#34d399', cancelled: '#f43f5e', rescheduled: '#fbbf24' } as const;
export const TYPE_COLOR = { gig: '#a78bfa', studio: '#38bdf8', garage: '#94a3b8' } as const;
export const LEVEL_COLOR: Record<Proficiency, string> = { expert: '#34d399', inter: '#38bdf8', beg: '#64748b' };
export const LEVEL_PCT: Record<Proficiency, string> = { expert: '100%', inter: '62%', beg: '30%' };
/** Hex + 1c = ~11% alpha tint used for badge backgrounds. */
export const tint = (hex: string) => hex + '1c';

/* ------------------------------------------------------------------ songs */
export interface RehearsalLog {
  id: string;
  title: string;
  date: string;
  typeLabel: string;
}

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
  chart: string;
  yt: string;
  sp: string;
  rec: string;
  logs: RehearsalLog[];
  logCount: number;
}

export function songVm(s: Song, allEvents: BandEvent[], openSong: string | null, ctx: Ctx): SongVm {
  const { lang, t } = ctx;
  const sl = slug(s.title);
  const gap = s.last ? -days(s.last) : 9999;
  const stale = gap > ctx.staleDays;
  const veryStale = gap > 90;
  const g = GENRES[s.genre];
  const logs = allEvents
    .filter((e) => (e.setlist || []).includes(s.id) && days(e.date) <= 0)
    .sort((a, b) => d(b.date).getTime() - d(a.date).getTime())
    .map((e) => ({ id: e.id, title: L(lang, e.title), date: fmt(e.date, lang, true), typeLabel: t[e.type] }));
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
    chart: 'https://docs.google.com/document/d/dtv-' + sl,
    yt: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(s.title + ' venezuela'),
    sp: 'https://open.spotify.com/search/' + encodeURIComponent(s.title),
    rec: 'https://drive.google.com/drive/folders/dtv-rec-' + sl,
    logs,
    logCount: logs.length,
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

export interface EventVm {
  id: string;
  type: BandEvent['type'];
  typeLabel: string;
  typeColor: string;
  typeBg: string;
  isGig: boolean;
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
  rel: string;
  past: boolean;
  /** "12" zero-padded day of month. */
  dayNum: string;
  /** "sep" / "Sep" */
  monStr: string;
  /** "$600" or null when money is 0. */
  moneyStr: string | null;
  moneyLabel: string;
  moneyColor: string;
  attend: string;
  setlist: SetlistRow[];
  setlistCount: string;
  /** "32 min" */
  runtime: string;
  hasSetlist: boolean;
  /** "Setlist" for gigs, "Canciones ensayadas" for practices. */
  setlistLabel: string;
  media: { label: string; url: string }[];
  hasMedia: boolean;
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
  return {
    id: e.id,
    type: e.type,
    typeLabel: t[e.type],
    typeColor,
    typeBg: tint(typeColor),
    isGig: e.type === 'gig',
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
    rel: rel(e.date, lang),
    past,
    dayNum: String(d(e.date).getDate()).padStart(2, '0'),
    monStr: monthShort(e.date, lang),
    moneyStr: e.money ? money0(e.money) : null,
    moneyLabel: e.money > 0 ? t.fee : t.costLabel,
    moneyColor: e.money > 0 ? '#34d399' : '#fbbf24',
    attend: String(e.attend || 0),
    setlist,
    setlistCount: String(setlist.length),
    runtime: Math.floor(sec / 60) + ' min',
    hasSetlist: setlist.length > 0,
    setlistLabel: e.type === 'gig' ? t.setlist : t.rehearsed,
    media: (e.media || []).map((m) => ({ label: L(lang, m.label), url: m.url })),
    hasMedia: (e.media || []).length > 0,
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
  /** "Zelle" | "Invoice" | "Photo" | "Receipt" */
  proofKind: string;
}

export function txVm(x: Transaction, ctx: Ctx): TxVm {
  const { lang, t } = ctx;
  const inc = x.kind === 'in';
  const by = memberById(x.by);
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
    proofKind: x.proofKind === 'zelle' ? 'Zelle' : x.proofKind === 'invoice' ? 'Invoice' : x.proofKind === 'photo' ? 'Photo' : 'Receipt',
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
}

export function gearVm(g: Gear, holderId: string, ctx: Ctx): GearVm {
  const { lang, t } = ctx;
  const h = memberById(holderId);
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

export function threadVm(b: Thread, myVote: 0 | 1 | undefined, extra: LocalComment[], ctx: Ctx): ThreadVm {
  const { lang } = ctx;
  const a = memberById(b.by);
  const comments: LocalComment[] = b.comments
    .map((c) => {
      const m = memberById(c.by);
      return { by: m.short, initial: m.initial, text: L(lang, c.text) };
    })
    .concat(extra);
  return {
    id: b.id,
    title: L(lang, b.title),
    body: L(lang, b.body),
    author: a.short,
    initial: a.initial,
    dateStr: fmt(b.date, lang, true),
    votes: String(b.votes + (myVote || 0)),
    voted: !!myVote,
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
    instruments: m.instruments.map((i) => ({ name: L(lang, i.n), level: t[i.lv], pct: LEVEL_PCT[i.lv], color: LEVEL_COLOR[i.lv] })),
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

export function feedbackVm(f: EventFeedback, pollPick: number | null, fbSent: boolean, ctx: Ctx): FeedbackVm {
  const { lang, t } = ctx;
  const anonLabel = t.anonymous;
  const base = f.poll.options.map((o, i) => ({ i, label: L(lang, o.label), v: o.v + (pollPick === i ? 1 : 0) }));
  const total = base.reduce((a, b) => a + b.v, 0) || 1;
  return {
    responses: String(f.responses + (fbSent ? 1 : 0)),
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
    ? '🎵 ¡Música en vivo! Nos presentamos en ' + e.venue + ' el ' + date + ' a las ' + e.time + '. ¡Los esperamos!\n\n#DulceTricolorVenezolano #MúsicaVenezolana #Joropo #BayArea'
    : '🎵 Live music alert! Catch us at ' + e.venue + ' on ' + date + ' at ' + e.time + '. See you there!\n\n#DulceTricolorVenezolano #VenezuelanMusic #Joropo #BayArea';
}
