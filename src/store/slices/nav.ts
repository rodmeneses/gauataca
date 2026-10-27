/** Navigation: views, tabs, theme/lang/role and cross-view jumps with a Back chip. */
import type { Dict } from '../../i18n';
import type { Lang, MobileTab, View } from '../../types';
import type { State } from '../store';
import type { ThemePref } from '../../lib/prefs';
import { writeLangPref, writeThemePref } from '../../lib/prefs';
import { haptic } from '../../lib/haptics';
import type { ActionCtx } from './ctx';

export interface NavActions {
  go: (v: View) => void;
  setLang: (l: Lang) => void;
  /** Current appearance preference ('light' | 'dark' | 'system'). */
  theme: ThemePref;
  setTheme: (t: ThemePref) => void;
  toggleRole: () => void;
  setDevice: (dv: State['device']) => void;
  setCalTab: (tab: State['calTab']) => void;
  setForumTab: (tab: State['forumTab']) => void;
  setMobileTab: (tab: MobileTab) => void;
  /** Label of the place a cross-view jump came from (null = no Back chip). */
  backLabel: string | null;
  /** Return to where the last cross-view jump came from. */
  goBack: () => void;
  /** Navigate to the repertoire and open a specific song (from a setlist, etc.). */
  goToSong: (id: string) => void;
  /** Clear the pending scroll-to-song request (called by the repertoire views after scrolling). */
  clearScrollToSong: () => void;
  /** Navigate to the ledger and scroll to a specific movement (from a shareable link). */
  goToTx: (id: string) => void;
  /** Clear the pending scroll-to-movement request (called by the ledger views after scrolling). */
  clearScrollToTx: () => void;
  /** Navigate to the calendar's availability tab and scroll to a specific poll (from a link or search). */
  goToAvailability: (id: number) => void;
  /** Clear the pending scroll-to-poll request (called by the availability panel after scrolling). */
  clearScrollToPoll: () => void;
  signOut: () => Promise<void>;
}

export function navActions({ st, set, toast, t, isAdmin, isMobileViewport, auth }: ActionCtx): NavActions {
  /** Remember where a cross-view jump started (null when it stays on the same screen). */
  const backFrom = (view: View, tab: MobileTab): State['backTo'] =>
    (isMobileViewport ? st.mobileTab !== tab : st.view !== view) ? { view: st.view, mobileTab: st.mobileTab } : null;
  return {
    go: (v) => {
      set({ view: v, palette: false, openSong: null, backTo: null });
      window.scrollTo({ top: 0 });
    },
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
    setForumTab: (tab) => set({ forumTab: tab }),
    setMobileTab: (tab) => set({ mobileTab: tab, backTo: null }),
    backLabel: st.backTo
      ? t[(isMobileViewport ? st.backTo.mobileTab : st.backTo.view) as keyof Dict] as string
      : null,
    goBack: () => {
      if (!st.backTo) return;
      haptic('tap');
      set({ view: st.backTo.view, mobileTab: st.backTo.mobileTab, backTo: null, openSong: null });
    },
    goToSong: (id) => set({ backTo: backFrom('repertoire', 'repertoire'), view: 'repertoire', mobileTab: 'repertoire', openSong: id, scrollToSong: id, q: '', genre: 'all', staleOnly: false, modal: null, palette: false }),
    clearScrollToSong: () => set({ scrollToSong: null }),
    goToTx: (id) => set({ backTo: backFrom('ledger', 'fund'), view: 'ledger', mobileTab: 'fund', scrollToTx: id, modal: null, palette: false }),
    clearScrollToTx: () => set({ scrollToTx: null }),
    goToAvailability: (id) => set({ backTo: backFrom('calendar', 'agenda'), view: 'calendar', mobileTab: 'agenda', calTab: 'availability', scrollToPoll: id, modal: null, palette: false, search: false }),
    clearScrollToPoll: () => set({ scrollToPoll: null }),
    signOut: auth.signOut,
  };
}
