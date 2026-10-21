/** View-model builders for the overlays and forms `useGuataca` exposes: palette, search, tour, toasts, form drafts. */
import type { Dict } from '../i18n';
import { TOUR_STEPS } from '../data';
import { searchAll } from '../lib/search';
import type { Toast } from '../types';
import { filterPalette } from './derive';
import { memberById, threadVm, txVm } from './vm';
import type { FormVm, PaletteItem, SearchResult, TourVm, ToastVm } from './guataca.types';
import type { ActionCtx } from './slices/ctx';
import type { NavActions } from './slices/nav';

/** ⌘K command palette: navigation, quick actions and the first 40 songs, filtered by the query. */
export function paletteResults(ctx: ActionCtx, go: NavActions['go']): PaletteItem[] {
  const { st, set, t, Lx, d, auth, openShare } = ctx;
  const { nextRaw, songs } = d;
  const base: Omit<PaletteItem, 'idx'>[] = [
    { group: t.navigate, label: t.dashboard, sub: '', run: () => go('dashboard') },
    { group: t.navigate, label: t.calendar, sub: '', run: () => go('calendar') },
    { group: t.navigate, label: t.repertoire, sub: '', run: () => go('repertoire') },
    { group: t.navigate, label: t.ledger, sub: '', run: () => go('ledger') },
    { group: t.navigate, label: t.brainstorm, sub: '', run: () => go('brainstorm') },
    { group: t.navigate, label: t.links, sub: '', run: () => go('links') },
    { group: t.navigate, label: t.members, sub: '', run: () => go('members') },
    ...(import.meta.env.DEV ? [{ group: t.navigate, label: t.system, sub: '', run: () => go('system') }] : []),
    { group: t.actions, label: t.newEvent, sub: '', run: () => set({ palette: false, view: 'calendar', modal: { kind: 'newEvent' }, form: {} }) },
    { group: t.actions, label: t.newSong, sub: '', run: () => set({ palette: false, view: 'repertoire', modal: { kind: 'newSong' }, form: {} }) },
    { group: t.actions, label: t.newTx, sub: '', run: () => set({ palette: false, view: 'ledger', modal: { kind: 'newTx' }, form: {} }) },
    { group: t.actions, label: t.prepIg + ' — ' + (nextRaw ? Lx(nextRaw.title) : ''), sub: '', run: () => { if (nextRaw) openShare(nextRaw.id); set({ palette: false }); } },
    { group: t.actions, label: t.handoff, sub: '', run: () => set({ palette: false, handoff: true }) },
    { group: t.actions, label: t.switchLang, sub: '', run: () => set((s) => ({ lang: s.lang === 'es' ? 'en' : 'es', palette: false })) },
    { group: t.actions, label: t.roleHint, sub: '', run: () => set((s) => ({ role: s.role === 'admin' ? 'member' : 'admin', palette: false })) },
    { group: t.actions, label: auth.user ? t.signOut : t.signIn, sub: '', run: () => { set({ palette: false }); if (!auth.user) set({ modal: { kind: 'signin' } }); } },
    ...songs.slice(0, 40).map((s) => ({
      group: t.repertoire,
      label: s.title,
      sub: s.genreLabel + ' · ' + s.key,
      run: () => set({ palette: false, view: 'repertoire', openSong: s.id, q: '', genre: 'all' as const, staleOnly: false }),
    })),
  ];
  return filterPalette(base, st.pq);
}

/** Global search (mobile): events, songs, fund movements, ideas, polls and links, each with a navigate action. */
export function searchResults(ctx: ActionCtx): SearchResult[] {
  const { st, set, t, Lx, d, data } = ctx;
  if (!st.search) return [];
  const { allEvents, allTx, songs, evm } = d;
  return searchAll(st.sq, {
    events: allEvents.map((e) => ({ ...evm(e), date: e.date })),
    songs,
    tx: allTx.map((x) => ({ ...txVm(x, d.ctx), date: x.date })),
    threads: data.threads.map((b) => ({
      ...threadVm(b, d.ctx),
      date: b.date,
      comments: b.comments.flatMap((c) => [c, ...c.replies]).map((c) => ({
        text: Lx(c.text),
        author: memberById(data.members, c.by).short,
        date: c.createdAt.slice(0, 10),
      })),
    })),
    polls: data.threads.flatMap((b) =>
      b.poll
        ? [{
            id: b.id,
            date: b.date,
            question: Lx(b.poll.question),
            options: b.poll.options.map((o) => Lx(o.label)),
            threadTitle: Lx(b.title),
            author: memberById(data.members, b.by).short,
          }]
        : [],
    ),
    links: data.links.map((l) => ({
      id: l.id,
      title: l.title,
      url: l.url,
      categoryLabel: { docs: t.catDocs, music: t.catMusic, social: t.catSocial, logistics: t.catLogistics, other: t.catOther }[l.category],
      by: memberById(data.members, l.createdBy).short,
    })),
  }, { kind: st.searchKind }).map((h) => ({
    ...h,
    run:
      h.kind === 'event' ? () => set({ search: false, modal: { kind: 'event', id: h.id } })
      : h.kind === 'idea' || h.kind === 'poll' ? () => set({ search: false, mobileTab: 'brainstorm', view: 'brainstorm', modal: { kind: 'thread', id: h.id } })
      : h.kind === 'link' ? () => set({ search: false, modal: null, view: 'links', mobileTab: 'links' })
      : h.kind === 'song' ? () => set({ search: false, modal: null, view: 'repertoire', mobileTab: 'repertoire', openSong: h.id, scrollToSong: h.id, q: '', genre: 'all', staleOnly: false })
      : () => set({ search: false, modal: null, view: 'ledger', mobileTab: 'fund', scrollToTx: h.id, txFilter: 'all', txDate: 'all' }),
  }));
}

export function tourVm({ st, Lx }: Pick<ActionCtx, 'st' | 'Lx'>): TourVm {
  const step = TOUR_STEPS[st.tour] ?? TOUR_STEPS[0];
  return {
    on: st.tour >= 0 && st.tour < TOUR_STEPS.length,
    title: Lx(step.title),
    body: Lx(step.body),
    num: String((st.tour < 0 ? 0 : st.tour) + 1),
    total: String(TOUR_STEPS.length),
    isLast: st.tour === TOUR_STEPS.length - 1,
  };
}

export function toastVms(toasts: Toast[]): ToastVm[] {
  return toasts.map((x) => ({
    ...x,
    color: x.tone === 'violet' ? 'var(--color-violet-light)' : x.tone === 'err' ? 'var(--color-rose)' : 'var(--color-emerald)',
    border: x.tone === 'violet' ? 'color-mix(in srgb, var(--color-violet) 40%, transparent)' : x.tone === 'err' ? 'color-mix(in srgb, var(--color-rose) 40%, transparent)' : 'color-mix(in srgb, var(--color-emerald) 40%, transparent)',
    bg: x.tone === 'violet' ? 'var(--color-tint-violet)' : x.tone === 'err' ? 'var(--color-tint-rose)' : 'var(--color-tint-emerald)',
  }));
}

/** Form drafts with every field defaulted, so inputs are always controlled. */
export function formVm(f: ActionCtx['st']['form']): FormVm {
  return {
    title: f.title || '', venue: f.venue || '', date: f.date || '', time: f.time || '', hours: f.hours || '', fee: f.fee || '', cost: f.cost || '', note: f.note || '',
    type: f.type || 'gig', desc: f.desc || '', amt: f.amt || '', proof: f.proof || '', proofKind: f.proofKind || 'receipt', kind: f.kind || 'in',
    event: f.event || '', gear: f.gear || '', category: f.category || 'fee', contributor: f.contributor || '',
    key: f.key || '', bpm: f.bpm || '', dur: f.dur || '', genre: f.genre || 'joropo', songLinks: f.songLinks || [],
    eventLinks: f.eventLinks || [],
    setlist: f.setlist || [],
    name: f.name || '', custodian: f.custodian || '', cond: f.cond || 'good', boughtBy: f.boughtBy || '',
    songInstruments: f.songInstruments || [],
    threadTitle: f.threadTitle || '', threadBody: f.threadBody || '', threadRefs: f.threadRefs || [],
  };
}

/** Header strings for the current view (kept here so `useGuataca` stays a thin composition). */
export const viewSubKey = (view: string) => ('sub' + view.charAt(0).toUpperCase() + view.slice(1)) as keyof Dict;
