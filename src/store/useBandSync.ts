/**
 * The one hook every view/modal uses. Returns the current state, all derived
 * view-models and every action — the typed equivalent of the design's renderVals().
 */
import { useMemo } from 'react';
import { T, type Dict } from '../i18n';
import {
  COLOR_TOKENS, EVENTS, GEAR, GENRES, GENRE_IDS, HANDOFF_NOTES, MEMBERS, SONGS, THREADS, TOUR_STEPS, TRANSACTIONS, TYPE_SCALE, memberById,
} from '../data';
import { d, days, money, money0 } from '../lib/format';
import type {
  AppProps, BandEvent, CustodyDialog, FormState, GenreId, Lang, Member, MobileTab, Modal, RatingKey, RsvpStatus, ShareSheet, Song, Toast, Transaction, View,
} from '../types';
import { useStore, type State } from './store';
import { useAuth } from '../lib/auth';
import {
  L, eventVm, feedbackVm, gearVm, igCaption, memberVm, songVm, threadVm, txVm,
  type Ctx, type EventVm, type FeedbackVm, type GearVm, type MemberVm, type SongVm, type ThreadVm, type TxVm,
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
  money: string;
  note: string;
  type: NonNullable<FormState['type']>;
  desc: string;
  amt: string;
  proof: string;
  kind: NonNullable<FormState['kind']>;
  key: string;
  bpm: string;
  dur: string;
  genre: GenreId;
  chart: string;
}

export interface BandSync {
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
  bandName: string;
  view: View;
  viewTitle: string;
  viewSub: string;
  isDesktop: boolean;
  isMobile: boolean;
  staleDays: number;

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
  gear: GearVm[];
  gearValue: string;
  threads: ThreadVm[];
  members: MemberVm[];

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
  sheet: ShareSheet | null;
  custody: CustodyDialog | null;
  custodyTargets: Member[];
  form: FormVm;
  paletteResults: PaletteItem[];
  tour: TourVm;
  toasts: ToastVm[];
  tokens: { name: string; hex: string; tw: string; use: string }[];
  typeScale: typeof TYPE_SCALE;
  handoffNotes: { h: string; items: string[] }[];

  // ---- actions
  go: (v: View) => void;
  setLang: (l: Lang) => void;
  toggleRole: () => void;
  setDevice: (dv: State['device']) => void;
  setCalTab: (tab: State['calTab']) => void;
  setMobileTab: (tab: MobileTab) => void;
  toggleSong: (id: string) => void;
  setQ: (q: string) => void;
  setGenre: (g: GenreId | 'all') => void;
  toggleStale: () => void;
  openEvent: (id: string) => void;
  openThread: (id: string) => void;
  openMember: (id: string) => void;
  openNewEvent: () => void;
  openNewSong: () => void;
  openNewTx: () => void;
  openSignIn: () => void;
  closeModal: () => void;
  /** Instagram flow: builds caption and opens the bottom sheet. */
  openShare: (eventId: string) => void;
  closeSheet: () => void;
  copyCaption: () => void;
  shareNow: () => void;
  openFlyer: () => void;
  openCustody: (gearId: string) => void;
  closeCustody: () => void;
  transferCustody: (memberId: string) => void;
  /** Set the signed-in member's RSVP; choosing the current answer again withdraws it (back to pending). */
  setRsvp: (eventId: string, status: RsvpStatus) => Promise<void>;
  voteThread: (id: string) => void;
  setCommentDraft: (s: string) => void;
  sendComment: () => void;
  convertThread: (id: string) => void;
  pickPoll: (i: number) => void;
  setRating: (k: RatingKey, n: number) => void;
  toggleAnon: () => void;
  setFbWell: (s: string) => void;
  setFbImprove: (s: string) => void;
  submitFb: () => void;
  setForm: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  saveEvent: () => void;
  saveTx: () => void;
  saveSong: () => void;
  openPalette: () => void;
  closePalette: () => void;
  setPq: (s: string) => void;
  tourNext: () => void;
  tourEnd: () => void;
  toggleHandoff: () => void;
  closeHandoff: () => void;
  toast: (msg: string, tone?: Toast['tone']) => void;
}

export function useBandSync(): BandSync {
  const { state: st, props, set, toast } = useStore();
  const { user, profile } = useAuth();

  return useMemo<BandSync>(() => {
    const lang = st.lang;
    const t = T[lang];
    const isAdmin = profile?.role === 'admin' || (!user && st.role === 'admin');
    const staleDays = props.staleDays || 30;
    const me = memberById(isAdmin ? 'm1' : 'm2');
    const ctx: Ctx = { lang, t, staleDays, meId: me.id, rsvpOverrides: st.rsvpOverrides };
    const Lx = (v: { es: string; en: string } | string | null | undefined) => L(lang, v);

    /* ---- raw collections (session additions first, like the design) */
    const allSongs: Song[] = [...st.extraSongs, ...SONGS];
    const allEvents: BandEvent[] = [...st.extraEvents, ...EVENTS];
    const allTx: Transaction[] = [...st.extraTx, ...TRANSACTIONS];

    const income = allTx.filter((x) => x.kind === 'in').reduce((a, b) => a + b.amt, 0);
    const expense = allTx.filter((x) => x.kind === 'out').reduce((a, b) => a + b.amt, 0);
    const balance = income - expense;

    const upcomingRaw = allEvents.filter((e) => days(e.date) >= 0).sort((a, b) => d(a.date).getTime() - d(b.date).getTime());
    const historyRaw = allEvents.filter((e) => days(e.date) < 0).sort((a, b) => d(b.date).getTime() - d(a.date).getTime());
    const nextRaw = upcomingRaw.find((e) => e.state === 'active') ?? null;

    const songs = allSongs.map((s) => songVm(s, allEvents, st.openSong, ctx));
    const staleSongs = songs.filter((s) => s.isStale).sort((a, b) => (a.lastDate < b.lastDate ? -1 : 1));
    const q = st.q.trim().toLowerCase();
    const filteredSongs = songs.filter(
      (s) =>
        (st.genre === 'all' || s.genre === st.genre) &&
        (!st.staleOnly || s.isStale) &&
        (!q || s.title.toLowerCase().includes(q) || s.genreLabel.toLowerCase().includes(q) || s.key.toLowerCase() === q),
    );
    const genreChips: GenreChip[] = [
      { id: 'all', label: t.allGenres, color: '#a78bfa', active: st.genre === 'all' },
      ...GENRE_IDS.map((k): GenreChip => ({ id: k, label: Lx(GENRES[k].label), color: GENRES[k].color, active: st.genre === k })),
    ];

    const evm = (e: BandEvent) => eventVm(e, allSongs, ctx);
    const upcoming = upcomingRaw.map(evm);
    const history = historyRaw.map(evm);
    const events = [...upcoming, ...history];
    const nextEvent = nextRaw ? evm(nextRaw) : null;
    const dashUpcoming = upcomingRaw.filter((e) => e.state !== 'cancelled').slice(0, 3).map(evm);

    const tx = allTx.map((x) => txVm(x, ctx));
    const gear = GEAR.map((g) => gearVm(g, st.custodyOverrides[g.id] ?? g.holder, ctx));
    const threads = THREADS.map((b) => threadVm(b, st.votes[b.id], st.extraComments[b.id] || [], ctx));
    const members = MEMBERS.map((m) => memberVm(m, ctx));

    /* ---- modal selections */
    const modal = st.modal;
    const evSel = modal?.kind === 'event' ? allEvents.find((e) => e.id === modal.id) ?? null : null;
    const ev = evSel ? evm(evSel) : null;
    const fb = evSel?.feedback ? feedbackVm(evSel.feedback, st.pollPick, st.fbSent, ctx) : null;
    const thSel = modal?.kind === 'thread' ? THREADS.find((x) => x.id === modal.id) ?? null : null;
    const th = thSel ? threadVm(thSel, st.votes[thSel.id], st.extraComments[thSel.id] || [], ctx) : null;
    const mbSel = modal?.kind === 'member' ? MEMBERS.find((x) => x.id === modal.id) ?? null : null;
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
      const b = THREADS.find((x) => x.id === id);
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
      title: f.title || '', venue: f.venue || '', date: f.date || '', time: f.time || '', money: f.money || '', note: f.note || '',
      type: f.type || 'gig', desc: f.desc || '', amt: f.amt || '', proof: f.proof || '', kind: f.kind || 'in',
      key: f.key || '', bpm: f.bpm || '', dur: f.dur || '', genre: f.genre || 'joropo', chart: f.chart || '',
    };

    const viewSubKey = ('sub' + st.view.charAt(0).toUpperCase() + st.view.slice(1)) as keyof Dict;

    return {
      state: st, props, t, lang, L: Lx, isAdmin, isMember: !isAdmin, role: st.role,
      roleLabel: isAdmin ? t.admin : t.member, me,
      bandName: props.bandName || 'Dulce Tricolor Venezolano',
      view: st.view, viewTitle: t[st.view] || t.dashboard, viewSub: t[viewSubKey] || '',
      isDesktop: st.device === 'desktop', isMobile: st.device === 'mobile', staleDays,

      songs, filteredSongs, staleSongs, genreChips,
      events, upcoming, history, calList: st.calTab === 'upcoming' ? upcoming : history, nextEvent, dashUpcoming,
      tx, recentTx: tx.slice(0, 4),
      gear, gearValue: money0(GEAR.reduce((a, b) => a + b.cost, 0)),
      threads, members,

      balanceStr: money(balance), incomeStr: money(income), expenseStr: money(expense),
      txCount: String(allTx.length), statSongs: String(allSongs.length),
      statUpcoming: String(upcomingRaw.filter((e) => e.state === 'active').length),
      statStale: String(staleSongs.length), staleHint: t.staleHint.replace('%d', String(staleDays)),

      modal, ev, fb, th, mb,
      sheet: st.sheet, custody: st.custody, custodyTargets: MEMBERS, form, paletteResults, tour,
      toasts: st.toasts.map((x) => ({
        ...x,
        color: x.tone === 'violet' ? '#a78bfa' : '#6ee7b7',
        border: x.tone === 'violet' ? '#7c3aed66' : '#34d39966',
        bg: x.tone === 'violet' ? '#7c3aed1f' : '#34d3991f',
      })),
      tokens: COLOR_TOKENS.map((k) => ({ name: k.name, hex: k.hex, tw: k.tw, use: Lx(k.use) })),
      typeScale: TYPE_SCALE,
      handoffNotes: HANDOFF_NOTES.map((s) => ({ h: Lx(s.h), items: s.items.map((i) => Lx(i).replace('%STALE%', String(staleDays))) })),

      go,
      setLang: (l) => set({ lang: l }),
      toggleRole: () => {
        const nx = isAdmin ? 'member' : 'admin';
        set({ role: nx, modal: null });
        toast(nx === 'admin' ? t.admin : t.memberView, nx === 'admin' ? 'ok' : 'violet');
      },
      setDevice: (dv) => set({ device: dv }),
      setCalTab: (tab) => set({ calTab: tab }),
      setMobileTab: (tab) => set({ mobileTab: tab }),
      toggleSong: (id) => set((s) => ({ openSong: s.openSong === id ? null : id })),
      setQ: (v) => set({ q: v }),
      setGenre: (g) => set({ genre: g }),
      toggleStale: () => set((s) => ({ staleOnly: !s.staleOnly })),
      openEvent: (id) => set({ modal: { kind: 'event', id } }),
      openThread: (id) => set({ modal: { kind: 'thread', id } }),
      openMember: (id) => set({ modal: { kind: 'member', id } }),
      openNewEvent: () => set({ modal: { kind: 'newEvent' }, form: {} }),
      openNewSong: () => set({ modal: { kind: 'newSong' }, form: {} }),
      openNewTx: () => set({ modal: { kind: 'newTx' }, form: {} }),
      openSignIn: () => set({ modal: { kind: 'signin' } }),
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
      transferCustody: (memberId) => {
        const c = st.custody;
        if (!c) return;
        set((s) => ({ custody: null, custodyOverrides: { ...s.custodyOverrides, [c.id]: memberId } }));
        toast(t.custodyTo + memberById(memberId).short);
      },
      setRsvp: async (eventId, status) => {
        const current = events.find((e) => e.id === eventId)?.rsvp ?? null;
        const next: RsvpStatus | null = current === status ? null : status;
        const uid = user?.id ?? me.id;
    
        // Optimistic update
        set((s) => ({ rsvpOverrides: { ...s.rsvpOverrides, [eventId]: { ...(s.rsvpOverrides[eventId] ?? {}), [uid]: next } } }));
        toast(t.rsvpSaved);

        // Persist to Supabase
        try {
          if (!user) return;

          if (next === null) {
            // Withdraw RSVP
            await supabase
              .from('event_attendance')
              .delete()
              .eq('event_id', eventId)
              .eq('profile_id', user.id);
          } else {
            // Upsert RSVP
            await supabase
              .from('event_attendance')
              .upsert({
                event_id: eventId,
                profile_id: user.id,
                status: next,
                updated_at: new Date().toISOString(),
              });
          }
        } catch (err) {
          console.error('Failed to persist RSVP:', err);
          // Rollback on error
          set((s) => ({ rsvpOverrides: { ...s.rsvpOverrides, [eventId]: { ...(s.rsvpOverrides[eventId] ?? {}), [uid]: current } } }));
          toast('Failed to save RSVP', 'violet');
        }
      },
      voteThread: (id) => set((s) => ({ votes: { ...s.votes, [id]: s.votes[id] ? 0 : 1 } })),
      setCommentDraft: (v) => set({ commentDraft: v }),
      sendComment: () => {
        const txt = st.commentDraft.trim();
        if (!txt || !thSel) return;
        set((s) => ({
          extraComments: { ...s.extraComments, [thSel.id]: [...(s.extraComments[thSel.id] || []), { by: me.short, initial: me.initial, text: txt }] },
          commentDraft: '',
        }));
        toast(t.commentPosted);
      },
      convertThread,
      pickPoll: (i) => { set({ pollPick: i }); toast(t.voted); },
      setRating: (k, n) => set((s) => ({ myRatings: { ...s.myRatings, [k]: n } })),
      toggleAnon: () => set((s) => ({ anon: !s.anon })),
      setFbWell: (v) => set({ fbWell: v }),
      setFbImprove: (v) => set({ fbImprove: v }),
      submitFb: () => { set({ fbSent: true }); toast(t.fbSubmitted); },
      setForm: (k, v) => set((s) => ({ form: { ...s.form, [k]: v } })),
      saveEvent: () => {
        const dte = f.date || '2026-11-07';
        set((s) => ({
          modal: null,
          extraEvents: [{
            id: 'x' + s.seq, type: f.type || 'gig', state: 'active', date: dte, time: f.time || '19:00',
            title: { es: f.title || 'Evento nuevo', en: f.title || 'New event' }, venue: f.venue || 'Bay Area, CA',
            money: +(f.money || 0), setlist: [], attend: 0, note: { es: f.note || '', en: f.note || '' },
          }, ...s.extraEvents],
          seq: s.seq + 1, form: {},
        }));
        toast(t.eventCreated);
      },
      saveTx: () => {
        set((s) => ({
          modal: null,
          extraTx: [{
            id: 'y' + s.seq, kind: f.kind || 'in', amt: +(f.amt || 0), date: f.date || '2026-08-25', by: isAdmin ? 'm3' : 'm2',
            desc: { es: f.desc || 'Movimiento', en: f.desc || 'Movement' }, proof: f.proof || null, proofKind: 'receipt',
          }, ...s.extraTx],
          seq: s.seq + 1, form: {},
        }));
        toast(t.txLogged);
      },
      saveSong: () => {
        set((s) => ({
          modal: null,
          extraSongs: [{
            id: 'z' + s.seq, title: f.title || 'Canción nueva', genre: f.genre || 'joropo', key: f.key || 'Am',
            bpm: +(f.bpm || 120), dur: f.dur || '3:30', last: null,
          }, ...s.extraSongs],
          seq: s.seq + 1, form: {},
        }));
        toast(t.songAdded);
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
  }, [st, props, set, toast]);
}
