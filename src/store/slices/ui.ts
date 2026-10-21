/** Cross-cutting UI: share sheet, deep links, modals, palette/search/tour/handoff overlays, toasts and form fields. */
import type { FormState, Toast } from '../../types';
import { itemUrl } from '../../lib/deepLink';
import { igCaption } from '../vm';
import type { ActionCtx } from './ctx';

export interface UiActions {
  /** Copy a shareable deep link for an item (event / song / movement) to the clipboard. */
  copyLink: (kind: 'event' | 'song' | 'tx' | 'thread', id: string, commentId?: number) => void;
  /** True when the browser has the native share sheet (navigator.share). */
  canShare: boolean;
  /** Open the native share sheet for an item's deep link (no-op without navigator.share). */
  shareLink: (kind: 'event' | 'song', id: string, title: string) => void;
  openSignIn: () => void;
  /** Open the Web Push notification preferences modal (desktop). */
  openNotifications: () => void;
  /** Open the changelog; with `since`, only entries newer than that version are marked new. */
  openChangelog: (since?: string) => void;
  closeModal: () => void;
  /** Instagram flow: builds caption and opens the bottom sheet. */
  openShare: (eventId: string) => void;
  closeSheet: () => void;
  copyCaption: () => void;
  shareNow: () => void;
  openFlyer: () => void;
  openPalette: () => void;
  closePalette: () => void;
  setPq: (s: string) => void;
  openSearch: () => void;
  closeSearch: () => void;
  setSq: (s: string) => void;
  tourNext: () => void;
  tourEnd: () => void;
  toggleHandoff: () => void;
  closeHandoff: () => void;
  toast: (msg: string, tone?: Toast['tone'], opts?: { action?: Toast['action']; ttl?: number }) => void;
  dismissToast: (id: string) => void;
  setForm: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}

/** Build the share-sheet opener (needed early: the palette and the event modal both call it). */
export const makeOpenShare = ({ set, d, lang, Lx }: Pick<ActionCtx, 'set' | 'd' | 'lang' | 'Lx'>) => (eventId: string) => {
  const e = d.allEvents.find((x) => x.id === eventId);
  if (!e) return;
  set({ sheet: { title: Lx(e.title), caption: igCaption(e, lang), flyer: e.flyer || null }, modal: null });
};

export function uiActions({ st, set, toast, t, copyText, openShare, dismissToast }: ActionCtx & { dismissToast: UiActions['dismissToast'] }): UiActions {
  return {
    canShare: typeof navigator !== 'undefined' && typeof navigator.share === 'function',
    shareLink: (kind, id, title) => {
      if (typeof navigator.share !== 'function') return;
      // Dismissing the share sheet rejects with AbortError — not worth a toast.
      navigator.share({ title, url: itemUrl(kind, id) }).catch(() => {});
    },
    copyLink: (kind, id, commentId) => {
      copyText(itemUrl(kind, id, commentId), t.linkCopied);
    },
    openSignIn: () => set({ modal: { kind: 'signin' } }),
    openNotifications: () => set({ modal: { kind: 'notifications' } }),
    openChangelog: (since) => set({ modal: { kind: 'changelog', since } }),
    closeModal: () => set({ modal: null }),
    openShare,
    closeSheet: () => set({ sheet: null }),
    copyCaption: () => {
      const c = st.sheet?.caption;
      if (!c) return;
      copyText(c, t.copied);
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
    openPalette: () => set({ palette: true, pq: '' }),
    closePalette: () => set({ palette: false }),
    setPq: (v) => set({ pq: v }),
    openSearch: () => set({ search: true, sq: '' }),
    closeSearch: () => set({ search: false }),
    setSq: (v) => set({ sq: v }),
    tourNext: () => set((s) => ({ tour: s.tour + 1 })),
    tourEnd: () => set({ tour: -1 }),
    toggleHandoff: () => set((s) => ({ handoff: !s.handoff })),
    closeHandoff: () => set({ handoff: false }),
    toast,
    dismissToast,
    setForm: (k, v) => set((s) => ({ form: { ...s.form, [k]: v } })),
  };
}
