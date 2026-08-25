import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  AppProps, BandEvent, CalTab, CustodyDialog, Device, FormState, GenreId, Lang, LocalComment, MobileTab, Modal,
  RatingKey, Role, ShareSheet, Song, Toast, Transaction, View,
} from '../types';

/**
 * Whole-app state. Mirrors the design's single state object so the view models
 * can be derived exactly like the prototype's `renderVals()`.
 * Nothing is persisted — Phase 1 is an in-memory prototype.
 */
export interface State {
  lang: Lang;
  role: Role;
  view: View;
  device: Device;
  calTab: CalTab;
  openSong: string | null;
  q: string;
  genre: GenreId | 'all';
  staleOnly: boolean;
  modal: Modal | null;
  toasts: Toast[];
  palette: boolean;
  pq: string;
  /** Tour step index, -1 = dismissed. */
  tour: number;
  handoff: boolean;
  /** thread id → 1 when the current user has upvoted. */
  votes: Record<string, 0 | 1>;
  pollPick: number | null;
  anon: boolean;
  myRatings: Record<RatingKey, number>;
  fbWell: string;
  fbImprove: string;
  fbSent: boolean;
  extraComments: Record<string, LocalComment[]>;
  commentDraft: string;
  extraTx: Transaction[];
  extraSongs: Song[];
  extraEvents: BandEvent[];
  /** gear id → member id (custody transfers made in this session). */
  custodyOverrides: Record<string, string>;
  form: FormState;
  mobileTab: MobileTab;
  sheet: ShareSheet | null;
  custody: CustodyDialog | null;
  seq: number;
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
    view: props.startView || 'dashboard',
    device: 'desktop',
    calTab: 'upcoming',
    openSong: null,
    q: '',
    genre: 'all',
    staleOnly: false,
    modal: null,
    toasts: [],
    palette: false,
    pq: '',
    tour: props.showTour === false ? -1 : 0,
    handoff: false,
    votes: {},
    pollPick: null,
    anon: false,
    myRatings: { sound: 0, perf: 0, log: 0, energy: 0 },
    fbWell: '',
    fbImprove: '',
    fbSent: false,
    extraComments: {},
    commentDraft: '',
    extraTx: [],
    extraSongs: [],
    extraEvents: [],
    custodyOverrides: {},
    form: {},
    mobileTab: 'agenda',
    sheet: null,
    custody: null,
    seq: 0,
  };
}

export function BandSyncProvider({ props, children }: { props: AppProps; children: ReactNode }) {
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

  // ⌘K → command palette · Esc → close everything
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setState((s) => ({ ...s, palette: !s.palette, pq: '' }));
      }
      if (e.key === 'Escape') {
        setState((s) => ({ ...s, palette: false, modal: null, handoff: false, sheet: null, custody: null }));
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
  if (!ctx) throw new Error('useStore must be used inside <BandSyncProvider>');
  return ctx;
}
