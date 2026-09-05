/**
 * The one hook every view/modal uses. Returns the current state, all derived
 * view-models and every action — the typed equivalent of the design's renderVals().
 */
import { useMemo } from 'react';
import { T, type Dict } from '../i18n';
import {
  COLOR_TOKENS, GENRES, GENRE_IDS, HANDOFF_NOTES, TOUR_STEPS, TYPE_SCALE,
} from '../data';
import { d, days, money, money0, sameMonth } from '../lib/format';
import type {
  AppProps, BandEvent, CustodyDialog, FormState, GearCondition, GenreId, Instrument, Lang, LinkKind, Member, MobileTab, Modal, Profile, Proficiency, ProofKind, RatingKey, RsvpStatus, SettleDialog, ShareSheet, Song, SongSort, Toast, Transaction, TxCategory, TxDate, TxFilter, View, VocalFlag,
} from '../types';
import { useStore, type State } from './store';
import { writeLangPref, writeThemePref, type ThemePref } from '../lib/prefs';
import { useAuth } from '../lib/auth';
import { useData } from '../lib/data';
import { useMediaQuery } from '../lib/useMediaQuery';
import {
  L, contributionVm, eventVm, feedbackVm, gearVm, igCaption, memberById, memberVm, songVm, threadVm, txVm,
  type ContributionVm, type Ctx, type EventVm, type FeedbackVm, type GearVm, type MemberVm, type SongVm, type ThreadVm, type TxVm,
} from './vm';

export interface GenreChip {
  id: GenreId | 'all';
  label: string;
  color: string;
  active: boolean;
}

export interface PaletteItem {
  group: string;
  label: string;
  sub: string;
  /** "1".."9" */
  idx: string;
  run: () => void;
}

export interface TourVm {
  on: boolean;
  title: string;
  body: string;
  num: string;
  total: string;
  isLast: boolean;
}

export interface ToastVm extends Toast {
  color: string;
  border: string;
  bg: string;
}

export interface FormVm {
  title: string;
  venue: string;
  date: string;
  time: string;
  hours: string;
  fee: string;
  cost: string;
  note: string;
  type: NonNullable<FormState['type']>;
  desc: string;
  amt: string;
  proof: string;
  proofKind: ProofKind;
  kind: NonNullable<FormState['kind']>;
  category: TxCategory;
  contributor: string;
  event: string;
  gear: string;
  key: string;
  bpm: string;
  dur: string;
  genre: GenreId;
  songLinks: { kind: LinkKind; label: string; url: string }[];
  setlist: string[];
  name: string;
  custodian: string;
  cond: GearCondition;
  boughtBy: string;
  songInstruments: string[];
}

export interface Guataca {
  // ---- raw state & props
  state: State;
  props: AppProps;
  t: Dict;
  lang: Lang;
  /** Localize a {es,en} record with the current language. */
  L: (v: { es: string; en: string } | string | null | undefined) => string;
  isAdmin: boolean;
  isMember: boolean;
  role: State['role'];
  roleLabel: string;
  /** The signed-in member for the current role (admin → Rodrigo, member → Caro). */
  me: Member;
  /** true when a real Supabase user is signed in (false in demo mode). */
  signedIn: boolean;
  bandName: string;
  view: View;
  viewTitle: string;
  viewSub: string;
  isDesktop: boolean;
  isMobile: boolean;
  /** Resolved layout tier (viewport or the dev `device` override). */
  layout: 'phone' | 'tablet' | 'desktop';
  isPhone: boolean;
  isTablet: boolean;
  /** true on touch devices (phones, tablets, touch laptops) — drives 44px/16px touch minimums. */
  isCoarsePointer: boolean;
  /** true when the viewport is phone-sized (drives the full-screen mobile shell). */
  isMobileViewport: boolean;
  staleDays: number;
  /** true while the data layer is fetching (live mode). */
  loading: boolean;
  /** Non-null when a live fetch failed (e.g. schema not applied yet). */
  error: string | null;

  // ---- collections (view-models)
  songs: SongVm[];
  /** Songs after search / genre / stale filters. */
  filteredSongs: SongVm[];
  staleSongs: SongVm[];
  genreChips: GenreChip[];
  events: EventVm[];
  upcoming: EventVm[];
  history: EventVm[];
  /** Upcoming or history depending on calTab. */
  calList: EventVm[];
  /** Next active upcoming event (for dashboard / share). */
  nextEvent: EventVm | null;
  /** Up to 3 non-cancelled upcoming events for the dashboard. */
  dashUpcoming: EventVm[];
  tx: TxVm[];
  recentTx: TxVm[];
  txFilter: TxFilter;
  txDate: TxDate;
  /** Per-member voluntary contribution summary. */
  contributions: ContributionVm[];
  gear: GearVm[];
  gearValue: string;
  threads: ThreadVm[];
  members: MemberVm[];
  /** Instrument catalog (basic + custom), for the picker and name resolution. */
  instruments: Instrument[];

  // ---- headline numbers (pre-formatted)
  balanceStr: string;
  incomeStr: string;
  expenseStr: string;
  txCount: string;
  statSongs: string;
  statUpcoming: string;
  statStale: string;
  staleHint: string;

  // ---- selection (modals)
  modal: Modal | null;
  ev: EventVm | null;
  fb: FeedbackVm | null;
  th: ThreadVm | null;
  mb: MemberVm | null;
  /** Raw member for the open member modal (for pre-filling the instrument editor). */
  mbRaw: Member | null;
  sheet: ShareSheet | null;
  custody: CustodyDialog | null;
  custodyTargets: Member[];
  settle: SettleDialog | null;
  form: FormVm;
  paletteResults: PaletteItem[];
  tour: TourVm;
  toasts: ToastVm[];
  tokens: { name: string; varName: string; tw: string; use: string }[];
  typeScale: typeof TYPE_SCALE;
  handoffNotes: { h: string; items: string[] }[];

  // ---- actions
  go: (v: View) => void;
  setLang: (l: Lang) => void;
  /** Current appearance preference ('light' | 'dark' | 'system'). */
  theme: ThemePref;
  setTheme: (t: ThemePref) => void;
  toggleRole: () => void;
  setDevice: (dv: State['device']) => void;
  setCalTab: (tab: State['calTab']) => void;
  setMobileTab: (tab: MobileTab) => void;
  toggleSong: (id: string) => void;
  /** Navigate to the repertoire and open a specific song (from a setlist, etc.). */
  goToSong: (id: string) => void;
  /** Clear the pending scroll-to-song request (called by the repertoire views after scrolling). */
  clearScrollToSong: () => void;
  setQ: (q: string) => void;
  setGenre: (g: GenreId | 'all') => void;
  toggleStale: () => void;
  setSongSort: (s: SongSort) => void;
  openEvent: (id: string) => void;
  openThread: (id: string) => void;
  openMember: (id: string, edit?: boolean) => void;
  openNewEvent: () => void;
  openNewSong: () => void;
  openEditSong: (id: string) => void;
  openNewTx: () => void;
  openNewGear: () => void;
  /** Complete sign-up onboarding (instruments + vocals). */
  onboard: (instruments: { id: string; lv: Proficiency }[], vocals: VocalFlag[]) => Promise<void>;
  /** Replace a member's instruments + vocals (admin, or the member editing themselves). */
  saveMemberInstruments: (profileId: string, instruments: { id: string; lv: Proficiency }[], vocals: VocalFlag[]) => Promise<void>;
  /** Open the sign-up onboarding modal. */
  openOnboard: () => void;
  /** Dismiss onboarding without saving (won't re-open this session). */
  skipOnboard: () => void;
  /** Create a custom instrument; resolves to its id. */
  createInstrument: (name: string) => Promise<string>;
  setTxFilter: (f: TxFilter) => void;
  setTxDate: (d: TxDate) => void;
  openSignIn: () => void;
  signOut: () => Promise<void>;
  closeModal: () => void;
  /** Instagram flow: builds caption and opens the bottom sheet. */
  openShare: (eventId: string) => void;
  closeSheet: () => void;
  copyCaption: () => void;
  shareNow: () => void;
  openFlyer: () => void;
  openCustody: (gearId: string) => void;
  closeCustody: () => void;
  transferCustody: (memberId: string) => Promise<void>;
  openSettle: (eventId: string) => void;
  closeSettle: () => void;
  settleEvent: (eventId: string, input: { happened: boolean; fee: number; cost: number }) => Promise<void>;
  /** Upload a receipt/invoice file; resolves to its public URL, or null on failure. */
  uploadProof: (file: File) => Promise<string | null>;
  /** Set the signed-in member's RSVP; choosing the current answer again withdraws it (back to pending). */
  setRsvp: (eventId: string, status: RsvpStatus) => Promise<void>;
  /** Replace an event's setlist (ordered song ids). */
  setEventSetlist: (eventId: string, songIds: string[]) => Promise<void>;
  /** Add a recording ("take") of a song during a practice event. */
  addTake: (eventId: string, songId: string, url: string) => Promise<void>;
  /** Remove a recording ("take"). */
  deleteTake: (id: string) => Promise<void>;
  voteThread: (id: string) => Promise<void>;
  setCommentDraft: (s: string) => void;
  sendComment: () => Promise<void>;
  convertThread: (id: string) => void;
  pickPoll: (i: number) => Promise<void>;
  setRating: (k: RatingKey, n: number) => void;
  toggleAnon: () => void;
  setFbWell: (s: string) => void;
  setFbImprove: (s: string) => void;
  submitFb: () => Promise<void>;
  setForm: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  saveEvent: () => Promise<void>;
  saveTx: () => Promise<void>;
  saveSong: () => Promise<void>;
  saveGear: () => Promise<void>;
  openPalette: () => void;
  closePalette: () => void;
  setPq: (s: string) => void;
  tourNext: () => void;
  tourEnd: () => void;
  toggleHandoff: () => void;
  closeHandoff: () => void;
  toast: (msg: string, tone?: Toast['tone']) => void;
}

function profileToMember(p: Profile): Member {
  return {
    id: p.id,
    name: p.name,
    short: p.name.split(/\s+/)[0],
    initial: p.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase(),
    role: p.role,
    title: { es: '', en: '' },
    email: p.email,
    joined: (p.joined_at ?? '').slice(0, 10),
    instruments: [],
    vocals: [],
  };
}

export function useGuataca(): Guataca {
  const { state: st, props, set, toast } = useStore();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const {
    songs: dbSongs, events: dbEvents, transactions: dbTx, gear: dbGear, threads: dbThreads, members: dbMembers,
    instruments: dbInstruments, takes: dbTakes, myThreadVotes, myPollPicks, loading, error,
    createEvent, createSong, updateSong, setSongLinks: persistSongLinks, createTransaction, createGear: persistGear, createInstrument: persistInstrument,
    onboard: persistOnboard, updateMemberInstruments: persistMemberInstruments, setSongInstruments: persistSongInstruments,
    addTake: persistTake, deleteTake: persistDeleteTake,
    setRsvp: persistRsvp, voteThread: persistVote,
    addComment: persistComment, submitFeedback: persistFeedback, pickPoll: persistPoll, transferCustody: persistCustody,
    setEventSetlist: persistSetlist, settleEvent: persistSettle, uploadProof: persistUpload,
  } = useData();
  const isPhoneViewport = useMediaQuery('(max-width: 767.98px)');
  const isTabletViewport = useMediaQuery('(min-width: 768px) and (max-width: 1023.98px)');
  const isCoarsePointer = useMediaQuery('(pointer: coarse)');
  const isMobileViewport = isPhoneViewport;

  return useMemo<Guataca>(() => {
    const lang = st.lang;
    const t = T[lang];
    const isAdmin = profile?.role === 'admin' || (!user && st.role === 'admin');
    // Layout tier. `device` is the dev preview override; 'auto' follows the viewport.
    const forced = st.device === 'mobile' ? 'phone' : st.device === 'tablet' ? 'tablet' : st.device === 'desktop' ? 'desktop' : null;
    const viewportLayout: 'phone' | 'tablet' | 'desktop' = isPhoneViewport ? 'phone' : isTabletViewport ? 'tablet' : 'desktop';
    const layout = forced ?? viewportLayout;
    const isPhone = layout === 'phone';
    const isTablet = layout === 'tablet';
    const isMobile = isPhone; // back-compat alias
    const isDesktop = layout === 'desktop';
    const staleDays = props.staleDays || 30;
    const me = user && profile ? profileToMember(profile) : memberById(dbMembers, isAdmin ? 'm1' : 'm2');
    const instruments: Instrument[] = (() => {
      const seen = new Set(dbInstruments.map((i) => i.id));
      return [...dbInstruments, ...st.customInstruments.filter((c) => !seen.has(c.id)).map((c) => ({ ...c, isBasic: false }))];
    })();
    const ctx: Ctx = { lang, t, staleDays, meId: me.id, isAdmin, members: dbMembers, events: dbEvents, gear: dbGear, instruments, takes: dbTakes };
    const Lx = (v: { es: string; en: string } | string | null | undefined) => L(lang, v);

    /* ---- raw collections (from the data layer) */
    const allSongs: Song[] = dbSongs;
    const allEvents: BandEvent[] = dbEvents;
    const allTx: Transaction[] = [...dbTx].sort((a, b) => (a.date < b.date ? 1 : -1));

    const income = allTx.filter((x) => x.kind === 'in').reduce((a, b) => a + b.amt, 0);
    const expense = allTx.filter((x) => x.kind === 'out').reduce((a, b) => a + b.amt, 0);
    const balance = income - expense;

    const upcomingRaw = allEvents.filter((e) => days(e.date) >= 0).sort((a, b) => d(a.date).getTime() - d(b.date).getTime());
    const historyRaw = allEvents.filter((e) => days(e.date) < 0).sort((a, b) => d(b.date).getTime() - d(a.date).getTime());
    const nextRaw = upcomingRaw.find((e) => e.state === 'active') ?? null;

    const songs = allSongs.map((s) => songVm(s, allEvents, st.openSong, ctx));
    const staleSongs = songs.filter((s) => s.isStale).sort((a, b) => (a.lastDate < b.lastDate ? -1 : 1));
    const q = st.q.trim().toLowerCase();
    const filteredSongs = songs
      .filter(
        (s) =>
          (st.genre === 'all' || s.genre === st.genre) &&
          (!st.staleOnly || s.isStale) &&
          (!q || s.title.toLowerCase().includes(q) || s.genreLabel.toLowerCase().includes(q) || s.key.toLowerCase() === q),
      )
      .sort((a, b) => {
        if (st.songSort === 'name') return a.title.localeCompare(b.title);
        if (st.songSort === 'takes') return a.takeCount - b.takeCount || a.title.localeCompare(b.title);
        return b.takeCount - a.takeCount || a.title.localeCompare(b.title); // 'recorded' (most takes first)
      });
    const genreChips: GenreChip[] = [
      { id: 'all', label: t.allGenres, color: 'var(--color-violet-light)', active: st.genre === 'all' },
      ...GENRE_IDS.map((k): GenreChip => ({ id: k, label: Lx(GENRES[k].label), color: GENRES[k].color, active: st.genre === k })),
    ];

    const evm = (e: BandEvent) => eventVm(e, allSongs, ctx);
    const upcoming = upcomingRaw.map(evm);
    const history = historyRaw.map(evm);
    const events = [...upcoming, ...history];
    const nextEvent = nextRaw ? evm(nextRaw) : null;
    const dashUpcoming = upcomingRaw.filter((e) => e.state !== 'cancelled').slice(0, 3).map(evm);

    const txFiltered = allTx.filter((x) => {
      if (st.txFilter !== 'all' && x.kind !== st.txFilter) return false;
      if (st.txDate !== 'all' && days(x.date) < -Number(st.txDate)) return false;
      return true;
    });
    const tx = txFiltered.map((x) => txVm(x, ctx));
    const recentTx = allTx.slice(0, 4).map((x) => txVm(x, ctx));

    const contribTx = allTx.filter((x) => x.category === 'contribution' && x.contributor);
    const contribByMember = new Map<string, { total: number; month: number }>();
    for (const x of contribTx) {
      const key = x.contributor!;
      const cur = contribByMember.get(key) ?? { total: 0, month: 0 };
      cur.total += x.amt * 100;
      if (sameMonth(x.date)) cur.month += x.amt * 100;
      contribByMember.set(key, cur);
    }
    const contributions = dbMembers
      .map((m) => {
        const c = contribByMember.get(m.id) ?? { total: 0, month: 0 };
        return contributionVm(m, c.total, c.month);
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const gear = dbGear.map((g) => gearVm(g, g.holder, ctx));
    const threads = dbThreads.map((b) => threadVm(b, myThreadVotes.includes(b.id), ctx));
    const members = dbMembers.map((m) => memberVm(m, ctx));

    /* ---- modal selections */
    const modal = st.modal;
    const evSel = modal?.kind === 'event' ? allEvents.find((e) => e.id === modal.id) ?? null : null;
    const ev = evSel ? evm(evSel) : null;
    const fb = evSel?.feedback ? feedbackVm(evSel.feedback, myPollPicks[evSel.id] ?? null, ctx) : null;
    const thSel = modal?.kind === 'thread' ? dbThreads.find((x) => x.id === modal.id) ?? null : null;
    const th = thSel ? threadVm(thSel, myThreadVotes.includes(thSel.id), ctx) : null;
    const mbSel = modal?.kind === 'member' ? dbMembers.find((x) => x.id === modal.id) ?? null : null;
    const mb = mbSel ? memberVm(mbSel, ctx) : null;

    /* ---- actions */
    const go = (v: View) => {
      set({ view: v, palette: false, openSong: null });
      window.scrollTo({ top: 0 });
    };
    const openShare = (eventId: string) => {
      const e = allEvents.find((x) => x.id === eventId);
      if (!e) return;
      set({ sheet: { title: Lx(e.title), caption: igCaption(e, lang), flyer: e.flyer || null }, modal: null });
    };
    const convertThread = (id: string) => {
      const b = dbThreads.find((x) => x.id === id);
      if (!b) return;
      set({ modal: { kind: 'newEvent' }, view: 'calendar', form: { title: Lx(b.title), note: Lx(b.body), type: 'gig' } });
      toast(t.ideaLoaded, 'violet');
    };

    /* ---- command palette */
    const paletteBase: Omit<PaletteItem, 'idx'>[] = [
      { group: t.navigate, label: t.dashboard, sub: '', run: () => go('dashboard') },
      { group: t.navigate, label: t.calendar, sub: '', run: () => go('calendar') },
      { group: t.navigate, label: t.repertoire, sub: '', run: () => go('repertoire') },
      { group: t.navigate, label: t.ledger, sub: '', run: () => go('ledger') },
      { group: t.navigate, label: t.brainstorm, sub: '', run: () => go('brainstorm') },
      { group: t.navigate, label: t.members, sub: '', run: () => go('members') },
      { group: t.navigate, label: t.system, sub: '', run: () => go('system') },
      { group: t.actions, label: t.newEvent, sub: '', run: () => set({ palette: false, view: 'calendar', modal: { kind: 'newEvent' }, form: {} }) },
      { group: t.actions, label: t.newSong, sub: '', run: () => set({ palette: false, view: 'repertoire', modal: { kind: 'newSong' }, form: {} }) },
      { group: t.actions, label: t.newTx, sub: '', run: () => set({ palette: false, view: 'ledger', modal: { kind: 'newTx' }, form: {} }) },
      { group: t.actions, label: t.prepIg + ' — ' + (nextRaw ? Lx(nextRaw.title) : ''), sub: '', run: () => { if (nextRaw) openShare(nextRaw.id); set({ palette: false }); } },
      { group: t.actions, label: t.handoff, sub: '', run: () => set({ palette: false, handoff: true }) },
      { group: t.actions, label: t.switchLang, sub: '', run: () => set((s) => ({ lang: s.lang === 'es' ? 'en' : 'es', palette: false })) },
      { group: t.actions, label: t.roleHint, sub: '', run: () => set((s) => ({ role: s.role === 'admin' ? 'member' : 'admin', palette: false })) },
      { group: t.actions, label: user ? t.signOut : t.signIn, sub: '', run: () => { set({ palette: false }); if (!user) set({ modal: { kind: 'signin' } }); } },
      ...songs.slice(0, 40).map((s) => ({
        group: t.repertoire,
        label: s.title,
        sub: s.genreLabel + ' · ' + s.key,
        run: () => set({ palette: false, view: 'repertoire', openSong: s.id, q: '', genre: 'all', staleOnly: false }),
      })),
    ];
    const pq = st.pq.trim().toLowerCase();
    const paletteResults: PaletteItem[] = (pq
      ? paletteBase.filter((i) => i.label.toLowerCase().includes(pq) || i.group.toLowerCase().includes(pq) || i.sub.toLowerCase().includes(pq))
      : paletteBase
    )
      .slice(0, 9)
      .map((i, n) => ({ ...i, idx: String(n + 1) }));

    /* ---- tour */
    const step = TOUR_STEPS[st.tour] ?? TOUR_STEPS[0];
    const tour: TourVm = {
      on: st.tour >= 0 && st.tour < TOUR_STEPS.length,
      title: Lx(step.title),
      body: Lx(step.body),
      num: String((st.tour < 0 ? 0 : st.tour) + 1),
      total: String(TOUR_STEPS.length),
      isLast: st.tour === TOUR_STEPS.length - 1,
    };

    /* ---- forms */
    const f = st.form;
    const form: FormVm = {
      title: f.title || '', venue: f.venue || '', date: f.date || '', time: f.time || '', hours: f.hours || '', fee: f.fee || '', cost: f.cost || '', note: f.note || '',
      type: f.type || 'gig', desc: f.desc || '', amt: f.amt || '', proof: f.proof || '', proofKind: f.proofKind || 'receipt', kind: f.kind || 'in',
      event: f.event || '', gear: f.gear || '', category: f.category || 'fee', contributor: f.contributor || '',
      key: f.key || '', bpm: f.bpm || '', dur: f.dur || '', genre: f.genre || 'joropo', songLinks: f.songLinks || [],
      setlist: f.setlist || [],
      name: f.name || '', custodian: f.custodian || '', cond: f.cond || 'good', boughtBy: f.boughtBy || '',
      songInstruments: f.songInstruments || [],
    };

    const viewSubKey = ('sub' + st.view.charAt(0).toUpperCase() + st.view.slice(1)) as keyof Dict;

    return {
      state: st, props, t, lang, L: Lx, isAdmin, isMember: !isAdmin, role: st.role,
      roleLabel: isAdmin ? t.admin : t.member, me, signedIn: !!user,
      bandName: props.bandName || 'GUATACA',
      view: st.view, viewTitle: t[st.view] || t.dashboard, viewSub: t[viewSubKey] || '',
      isDesktop, isMobile, layout, isPhone, isTablet, isCoarsePointer, isMobileViewport, staleDays, loading, error,

      songs, filteredSongs, staleSongs, genreChips,
      events, upcoming, history, calList: st.calTab === 'upcoming' ? upcoming : history, nextEvent, dashUpcoming,
      tx, recentTx, txFilter: st.txFilter, txDate: st.txDate,
      contributions,
      gear, gearValue: money0(dbGear.reduce((a, b) => a + b.cost, 0)),
      threads, members, instruments,

      balanceStr: money(balance), incomeStr: money(income), expenseStr: money(expense),
      txCount: String(allTx.length), statSongs: String(allSongs.length),
      statUpcoming: String(upcomingRaw.filter((e) => e.state === 'active').length),
      statStale: String(staleSongs.length), staleHint: t.staleHint.replace('%d', String(staleDays)),

      modal, ev, fb, th, mb, mbRaw: mbSel,
      sheet: st.sheet, custody: st.custody, custodyTargets: dbMembers, settle: st.settle, form, paletteResults, tour,
      toasts: st.toasts.map((x) => ({
        ...x,
        color: x.tone === 'violet' ? 'var(--color-violet-light)' : x.tone === 'err' ? 'var(--color-rose)' : 'var(--color-emerald)',
        border: x.tone === 'violet' ? 'color-mix(in srgb, var(--color-violet) 40%, transparent)' : x.tone === 'err' ? 'color-mix(in srgb, var(--color-rose) 40%, transparent)' : 'color-mix(in srgb, var(--color-emerald) 40%, transparent)',
        bg: x.tone === 'violet' ? 'var(--color-tint-violet)' : x.tone === 'err' ? 'var(--color-tint-rose)' : 'var(--color-tint-emerald)',
      })),
      tokens: COLOR_TOKENS.map((k) => ({ name: k.name, varName: k.varName, tw: k.tw, use: Lx(k.use) })),
      typeScale: TYPE_SCALE,
      handoffNotes: HANDOFF_NOTES.map((s) => ({ h: Lx(s.h), items: s.items.map((i) => Lx(i).replace('%STALE%', String(staleDays))) })),

      go,
      setLang: (l) => { writeLangPref(l); set({ lang: l }); },
      theme: st.theme,
      setTheme: (tp) => { writeThemePref(tp); set({ theme: tp }); },
      toggleRole: () => {
        const nx = isAdmin ? 'member' : 'admin';
        set({ role: nx, modal: null });
        toast(nx === 'admin' ? t.admin : t.memberView, nx === 'admin' ? 'ok' : 'violet');
      },
      setDevice: (dv) => set({ device: dv }),
      setCalTab: (tab) => set({ calTab: tab }),
      setMobileTab: (tab) => set({ mobileTab: tab }),
      toggleSong: (id) => set((s) => ({ openSong: s.openSong === id ? null : id })),
      goToSong: (id) => set({ view: 'repertoire', mobileTab: 'repertoire', openSong: id, scrollToSong: id, q: '', genre: 'all', staleOnly: false, modal: null, palette: false }),
      clearScrollToSong: () => set({ scrollToSong: null }),
      setQ: (v) => set({ q: v }),
      setGenre: (g) => set({ genre: g }),
      toggleStale: () => set((s) => ({ staleOnly: !s.staleOnly })),
      setSongSort: (s) => set({ songSort: s }),
      openEvent: (id) => set({ modal: { kind: 'event', id } }),
      openThread: (id) => set({ modal: { kind: 'thread', id } }),
      openMember: (id, edit) => set({ modal: { kind: 'member', id, edit } }),
      openNewEvent: () => set({ modal: { kind: 'newEvent' }, form: {} }),
      openNewSong: () => set({ modal: { kind: 'newSong' }, form: {} }),
      openEditSong: (id) => {
        const s = dbSongs.find((x) => x.id === id);
        if (!s) return;
        set({
          modal: { kind: 'newSong', id },
          form: {
            title: s.title, genre: s.genre, key: s.key, bpm: String(s.bpm), dur: s.dur,
            songInstruments: s.instruments || [],
            songLinks: (s.links || []).map((l) => ({ kind: l.kind, label: Lx(l.label), url: l.url })),
          },
        });
      },
      openNewTx: () => set({ modal: { kind: 'newTx' }, form: {} }),
      openNewGear: () => set({ modal: { kind: 'newGear' }, form: { custodian: me.id, boughtBy: me.id } }),
      onboard: async (instruments, vocals) => {
        await persistOnboard(instruments, vocals);
        await refreshProfile();
        set({ modal: null, onboardDismissed: true });
        toast(t.onboarded);
      },
      openOnboard: () => set({ modal: { kind: 'onboard' } }),
      skipOnboard: () => set({ modal: null, onboardDismissed: true }),
      saveMemberInstruments: async (profileId, instruments, vocals) => {
        await persistMemberInstruments(profileId, instruments, vocals);
        toast(t.instrumentsSaved);
      },
      createInstrument: async (name) => {
        const id = (await persistInstrument(name)) ?? 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        set((s) => ({ customInstruments: [...s.customInstruments, { id, name: { es: name, en: name } }] }));
        return id;
      },
      setTxFilter: (f) => set({ txFilter: f }),
      setTxDate: (d) => set({ txDate: d }),
      openSignIn: () => set({ modal: { kind: 'signin' } }),
      signOut,
      closeModal: () => set({ modal: null }),
      openShare,
      closeSheet: () => set({ sheet: null }),
      copyCaption: () => {
        const c = st.sheet?.caption;
        if (!c) return;
        if (navigator.clipboard) navigator.clipboard.writeText(c).catch(() => {});
        toast(t.copied);
      },
      shareNow: () => {
        const s = st.sheet;
        if (!s) return;
        if (typeof navigator.share === 'function') navigator.share({ text: s.caption }).catch(() => {});
        else toast(t.shareIntent, 'violet');
      },
      openFlyer: () => {
        const s = st.sheet;
        if (s?.flyer) window.open(s.flyer, '_blank', 'noopener');
        toast(t.openingFlyer, 'violet');
      },
      openCustody: (gearId) => {
        const g = gear.find((x) => x.id === gearId);
        if (!g) return;
        set({ custody: { id: g.id, name: g.name, holder: g.holder } });
      },
      closeCustody: () => set({ custody: null }),
      transferCustody: async (memberId) => {
        const c = st.custody;
        if (!c) return;
        set({ custody: null });
        await persistCustody(c.id, memberId);
        toast(t.custodyTo + memberById(dbMembers, memberId).short);
      },
      openSettle: (eventId) => {
        const e = allEvents.find((x) => x.id === eventId);
        if (!e) return;
        set({ settle: { id: e.id, title: Lx(e.title), fee: e.fee, cost: e.cost } });
      },
      closeSettle: () => set({ settle: null }),
      settleEvent: async (eventId, input) => {
        set({ settle: null });
        await persistSettle(eventId, input);
        toast(t.eventSettled);
      },
      setRsvp: async (eventId, status) => {
        const current = events.find((e) => e.id === eventId)?.rsvp ?? null;
        const next: RsvpStatus | null = current === status ? null : status;
        await persistRsvp(eventId, next);
        toast(t.rsvpSaved);
      },
      setEventSetlist: async (eventId, songIds) => {
        await persistSetlist(eventId, songIds);
        toast(t.setlistSaved);
      },
      addTake: async (eventId, songId, url) => {
        await persistTake(eventId, songId, url);
        toast(t.recordingAdded);
      },
      deleteTake: async (id) => {
        await persistDeleteTake(id);
        toast(t.recordingDeleted);
      },
      voteThread: async (id) => {
        await persistVote(id);
        toast(t.voted);
      },
      setCommentDraft: (v) => set({ commentDraft: v }),
      sendComment: async () => {
        const txt = st.commentDraft.trim();
        if (!txt || !thSel) return;
        set({ commentDraft: '' });
        await persistComment(thSel.id, txt);
        toast(t.commentPosted);
      },
      convertThread,
      pickPoll: async (i) => {
        if (!evSel) return;
        await persistPoll(evSel.id, i);
        toast(t.voted);
      },
      setRating: (k, n) => set((s) => ({ myRatings: { ...s.myRatings, [k]: n } })),
      toggleAnon: () => set((s) => ({ anon: !s.anon })),
      setFbWell: (v) => set({ fbWell: v }),
      setFbImprove: (v) => set({ fbImprove: v }),
      submitFb: async () => {
        if (!evSel) return;
        await persistFeedback(evSel.id, {
          sound: st.myRatings.sound, perf: st.myRatings.perf, log: st.myRatings.log, energy: st.myRatings.energy,
          well: st.fbWell, improve: st.fbImprove, anon: st.anon,
        });
        toast(t.fbSubmitted);
      },
      setForm: (k, v) => set((s) => ({ form: { ...s.form, [k]: v } })),
      uploadProof: async (file) => {
        try {
          const url = await persistUpload(file);
          return url ?? null;
        } catch {
          toast(t.uploadFailed, 'err');
          return null;
        }
      },
      saveEvent: async () => {
        const dte = f.date || '2026-11-07';
        const songIds = f.setlist || [];
        set({ modal: null, form: {} });
        const id = await createEvent({
          title: f.title || 'Evento nuevo', venue: f.venue || 'Bay Area, CA', date: dte, time: f.time || '19:00', hours: +(f.hours || 0),
          fee: +(f.fee || 0), cost: +(f.cost || 0), note: f.note || '', type: f.type || 'gig',
        });
        if (id && songIds.length) await persistSetlist(id, songIds);
        toast(t.eventCreated);
      },
      saveTx: async () => {
        set({ modal: null, form: {} });
        await createTransaction({
          kind: f.kind || 'in', amt: +(f.amt || 0), date: f.date || '2026-08-25', desc: f.desc || 'Movimiento', proof: f.proof || null,
          proofKind: f.proofKind || 'receipt', event: f.event || undefined, gear: f.gear || undefined,
          category: f.category || undefined, contributor: f.contributor || undefined,
        });
        toast(t.txLogged);
      },
      saveSong: async () => {
        const editingId = st.modal?.kind === 'newSong' ? st.modal.id : undefined;
        const songInstruments = f.songInstruments || [];
        const songLinks = f.songLinks || [];
        set({ modal: null, form: {} });
        const input = { title: f.title || 'Canción nueva', genre: f.genre || 'joropo', key: f.key || 'Am', bpm: +(f.bpm || 120), dur: f.dur || '3:30' };
        if (editingId) {
          await updateSong(editingId, input);
          await persistSongLinks(editingId, songLinks);
          await persistSongInstruments(editingId, songInstruments);
        } else {
          const id = await createSong(input);
          if (id) {
            if (songLinks.length) await persistSongLinks(id, songLinks);
            if (songInstruments.length) await persistSongInstruments(id, songInstruments);
          }
        }
        toast(editingId ? t.songSaved : t.songAdded);
      },
      saveGear: async () => {
        set({ modal: null, form: {} });
        await persistGear({
          name: f.name || 'Equipo nuevo', cost: +(f.cost || 0), date: f.date || '2026-08-25', custodian: f.custodian || me.id,
          cond: f.cond || 'good', note: f.note || '', boughtBy: f.boughtBy || me.id, proof: f.proof || null, proofKind: f.proofKind || 'receipt',
        });
        toast(t.gearCreated);
      },
      openPalette: () => set({ palette: true, pq: '' }),
      closePalette: () => set({ palette: false }),
      setPq: (v) => set({ pq: v }),
      tourNext: () => set((s) => ({ tour: s.tour + 1 })),
      tourEnd: () => set({ tour: -1 }),
      toggleHandoff: () => set((s) => ({ handoff: !s.handoff })),
      closeHandoff: () => set({ handoff: false }),
      toast,
    };
  }, [st, props, set, toast, user, profile, signOut, refreshProfile, dbSongs, dbEvents, dbTx, dbGear, dbThreads, dbMembers, dbInstruments, dbTakes, myThreadVotes, myPollPicks, loading, error, isPhoneViewport, isTabletViewport, isCoarsePointer, createEvent, createSong, updateSong, persistSongLinks, createTransaction, persistGear, persistInstrument, persistOnboard, persistMemberInstruments, persistSongInstruments, persistTake, persistDeleteTake, persistRsvp, persistVote, persistComment, persistFeedback, persistPoll, persistCustody, persistSetlist, persistSettle, persistUpload]);
}
