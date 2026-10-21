/**
 * The one hook every view/modal uses. Returns the current state, all derived
 * view-models and every action — the typed equivalent of the design's renderVals().
 * Actions live in `./slices` (one file per domain); overlay/form view-models in `./builders`.
 */
import { useMemo } from 'react';
import { COLOR_TOKENS, HANDOFF_NOTES, TYPE_SCALE } from '../data';
import { money, money0 } from '../lib/format';
import { useStore } from './store';
import { useAuth } from '../lib/auth';
import { useData } from '../lib/data';
import { useMediaQuery } from '../lib/useMediaQuery';
import { layoutTier } from './derive';
import { feedbackVm, memberVm, threadVm } from './vm';
import { useDerived } from './useDerived';
import { formVm, paletteResults, searchResults, toastVms, tourVm, viewSubKey } from './builders';
import type { ActionCtx } from './slices/ctx';
import { navActions } from './slices/nav';
import { songActions } from './slices/songs';
import { eventActions } from './slices/events';
import { ledgerActions } from './slices/ledger';
import { forumActions } from './slices/forum';
import { memberActions } from './slices/members';
import { makeOpenShare, uiActions } from './slices/ui';

import type { Guataca } from './guataca.types';
export type * from './guataca.types';

export function useGuataca(): Guataca {
  const { state: st, props, set, toast, dismissToast } = useStore();
  const { user, signOut, refreshProfile } = useAuth();
  const data = useData();
  const isPhoneViewport = useMediaQuery('(max-width: 767.98px)');
  const isTabletViewport = useMediaQuery('(min-width: 768px) and (max-width: 1023.98px)');
  const isCoarsePointer = useMediaQuery('(pointer: coarse)');
  // Touch devices up to tablet width get the phone layout: landscape phones,
  // tablets, and "Request Desktop Site" all report > 768px but are still touch-first.
  const isMobileViewport = isPhoneViewport || (isCoarsePointer && isTabletViewport);

  const d = useDerived();

  return useMemo<Guataca>(() => {
    const { t, lang, Lx, isAdmin, staleDays, me, allSongs, allEvents, allTx, income, expense, balance, upcomingRaw, evm, staleSongs } = d;
    const { threads: dbThreads, members: dbMembers } = data;

    // Layout tier. `device` is the dev preview override; 'auto' follows the viewport.
    const layout = layoutTier(st.device, isMobileViewport, isTabletViewport);

    /* ---- modal selections */
    const modal = st.modal;
    const evSel = modal?.kind === 'event' ? allEvents.find((e) => e.id === modal.id) ?? null : null;
    const thSel = modal?.kind === 'thread' ? dbThreads.find((x) => x.id === modal.id) ?? null : null;
    const mbSel = modal?.kind === 'member' ? dbMembers.find((x) => x.id === modal.id) ?? null : null;

    /** Copy to the clipboard and toast the outcome — "copied" only if it really was. */
    const copyText = (text: string, okMsg: string) => {
      const fail = () => toast(t.copyFailed, 'err');
      if (!navigator.clipboard) return fail();
      navigator.clipboard.writeText(text).then(() => toast(okMsg), fail);
    };

    const ctx: ActionCtx = {
      st, set, toast, t, lang, Lx, data, d, me, isAdmin, isMobileViewport,
      auth: { user, signOut, refreshProfile }, evSel, thSel, copyText,
      openShare: () => {},
    };
    ctx.openShare = makeOpenShare(ctx);
    const nav = navActions(ctx);

    const viewSub = t[viewSubKey(st.view)];

    return {
      state: st, props, t, lang, L: Lx, isAdmin, isMember: !isAdmin, role: st.role,
      roleLabel: isAdmin ? t.admin : t.member, me, signedIn: !!user,
      bandName: props.bandName || 'GUATACA',
      view: st.view, viewTitle: t[st.view] || t.dashboard, viewSub: viewSub || '',
      isDesktop: layout === 'desktop', isMobile: layout === 'phone', layout, isPhone: layout === 'phone', isTablet: layout === 'tablet',
      isCoarsePointer, isMobileViewport, staleDays, loading: data.loading, mutating: data.mutating, error: data.error,

      songs: d.songs, filteredSongs: d.filteredSongs, staleSongs, genreChips: d.genreChips,
      events: d.events, upcoming: d.upcoming, history: d.history, calList: d.calList, nextEvent: d.nextEvent, dashUpcoming: d.dashUpcoming,
      tx: d.tx, recentTx: d.recentTx, txFilter: st.txFilter, txDate: st.txDate,
      contributions: d.contributions,
      gear: d.gear, gearValue: money0(data.gear.reduce((a, b) => a + b.cost, 0)),
      threads: d.threads, forumList: d.forumList, members: d.members, instruments: d.instruments,

      balanceStr: money(balance), balanceNeg: balance < 0, incomeStr: money(income), expenseStr: money(expense),
      txCount: String(allTx.length), statSongs: String(allSongs.length),
      statUpcoming: String(upcomingRaw.filter((e) => e.state === 'active').length),
      statStale: String(staleSongs.length), staleHint: t.staleHint.replace('%d', String(staleDays)),

      modal,
      ev: evSel ? evm(evSel) : null,
      fb: evSel?.feedback ? feedbackVm(evSel.feedback, data.myPollPicks[evSel.id] ?? null, d.ctx) : null,
      th: thSel ? threadVm(thSel, d.ctx) : null,
      mb: mbSel ? memberVm(mbSel, d.ctx) : null,
      mbRaw: mbSel,
      sheet: st.sheet, custody: st.custody, custodyTargets: dbMembers, settle: st.settle,
      form: formVm(st.form),
      paletteResults: paletteResults(ctx, nav.go),
      searchResults: searchResults(ctx),
      tour: tourVm(ctx),
      toasts: toastVms(st.toasts),
      tokens: COLOR_TOKENS.map((k) => ({ name: k.name, varName: k.varName, tw: k.tw, use: Lx(k.use) })),
      typeScale: TYPE_SCALE,
      handoffNotes: HANDOFF_NOTES.map((s) => ({ h: Lx(s.h), items: s.items.map((i) => Lx(i).replace('%STALE%', String(staleDays))) })),

      ...nav,
      ...songActions(ctx),
      ...eventActions(ctx),
      ...ledgerActions(ctx),
      ...forumActions(ctx),
      ...memberActions(ctx),
      ...uiActions({ ...ctx, dismissToast }),
    };
  }, [d, data, st, props, set, toast, dismissToast, user, signOut, refreshProfile, isTabletViewport, isCoarsePointer, isMobileViewport]);
}
