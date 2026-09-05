import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  AppProps, CalTab, CustodyDialog, Device, FormState, GenreId, Lang, Localized, MobileTab, Modal,
  RatingKey, Role, SettleDialog, ShareSheet, SongSort, Toast, TxDate, TxFilter, View,
} from '../types';
import { applyTheme, readThemePref, type ThemePref } from '../lib/prefs';

/**
 * Whole-app state. Mirrors the design's single state object so the view models
 * can be derived exactly like the prototype's `renderVals()`.
 * Nothing is persisted — Phase 1 is an in-memory prototype.
 */
export interface State {
  lang: Lang;
  role: Role;
  /** 'light' | 'dark' | 'system' — persisted in localStorage (see src/lib/prefs.ts). */
  theme: ThemePref;
  view: View;
  device: Device;
  calTab: CalTab;
  openSong: string | null;
  /** Song id to scroll into view after a cross-view jump (set by goToSong, cleared after scroll). */
  scrollToSong: string | null;
  q: string;
  genre: GenreId | 'all';
  staleOnly: boolean;
  songSort: SongSort;
  modal: Modal | null;
  toasts: Toast[];
  palette: boolean;
  pq: string;
  /** Tour step index, -1 = dismissed. */
  tour: number;
  handoff: boolean;
  anon: boolean;
  myRatings: Record<RatingKey, number>;
  fbWell: string;
  fbImprove: string;
  commentDraft: string;
  form: FormState;
  txFilter: TxFilter;
  txDate: TxDate;
  mobileTab: MobileTab;
  sheet: ShareSheet | null;
  custody: CustodyDialog | null;
  settle: SettleDialog | null;
  /** Custom instruments created this session (id → name), merged into the catalog. */
  customInstruments: { id: string; name: Localized }[];
  /** true once the sign-up onboarding has been shown and dismissed/skipped this session. */
  onboardDismissed: boolean;
}

export type Updater = Partial<State> | ((s: State) => Partial<State>);

export interface StoreApi {
  state: State;
  props: AppProps;
  /** setState-like merge (accepts an object or an updater fn). */
  set: (u: Updater) => void;
  toast: (msg: string, tone?: Toast['tone']) => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function initialState(props: AppProps): State {
  return {
    lang: props.initialLang === 'en' ? 'en' : 'es',
    role: props.initialRole === 'member' ? 'member' : 'admin',
    theme: readThemePref(),
    view: props.startView || 'dashboard',
    device: 'auto',
    calTab: 'upcoming',
    openSong: null,
    scrollToSong: null,
    q: '',
    genre: 'all',
    staleOnly: false,
    songSort: 'recorded',
    modal: null,
    toasts: [],
    palette: false,
    pq: '',
    tour: props.showTour === false ? -1 : 0,
    handoff: false,
    anon: false,
    myRatings: { sound: 0, perf: 0, log: 0, energy: 0 },
    fbWell: '',
    fbImprove: '',
    commentDraft: '',
    form: {},
    txFilter: 'all',
    txDate: 'all',
    mobileTab: 'agenda',
    sheet: null,
    custody: null,
    settle: null,
    customInstruments: [],
    onboardDismissed: false,
  };
}

export function GuatacaProvider({ props, children }: { props: AppProps; children: ReactNode }) {
  const [state, setState] = useState<State>(() => initialState(props));
  const seqRef = useRef(0);

  const set = useCallback((u: Updater) => {
    setState((s) => ({ ...s, ...(typeof u === 'function' ? u(s) : u) }));
  }, []);

  const toast = useCallback(
    (msg: string, tone: Toast['tone'] = 'ok') => {
      const id = 'k' + Date.now() + '-' + seqRef.current++;
      setState((s) => ({ ...s, toasts: [...s.toasts, { id, msg, tone }] }));
      window.setTimeout(() => setState((s) => ({ ...s, toasts: s.toasts.filter((x) => x.id !== id) })), 3600);
    },
    [],
  );

  // Keep <html data-theme> and the address-bar colour in sync with the choice,
  // and react to OS changes while the preference is 'system'.
  useEffect(() => {
    applyTheme(state.theme);
    if (state.theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [state.theme]);

  // ⌘K → command palette · Esc → close everything
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setState((s) => ({ ...s, palette: !s.palette, pq: '' }));
      }
      if (e.key === 'Escape') {
        setState((s) => ({ ...s, palette: false, modal: null, handoff: false, sheet: null, custody: null, settle: null }));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const api = useMemo<StoreApi>(() => ({ state, props, set, toast }), [state, props, set, toast]);
  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <GuatacaProvider>');
  return ctx;
}
