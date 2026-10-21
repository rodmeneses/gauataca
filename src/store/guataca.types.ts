/** Types for the `useGuataca` view-model: the `Guataca` shape and the pieces it is built from. */
import type { Dict } from '../i18n';
import type { TYPE_SCALE } from '../data';
import type { AppProps, CustodyDialog, FormState, GearCondition, GenreId, Instrument, Lang, LinkKind, Member, Modal, ProofKind, SettleDialog, ShareSheet, Toast, TxCategory, TxDate, TxFilter, View } from '../types';
import type { State } from './store';
import type { SearchHit } from '../lib/search';
import type { NavActions } from './slices/nav';
import type { SongActions } from './slices/songs';
import type { EventActions } from './slices/events';
import type { LedgerActions } from './slices/ledger';
import type { ForumActions } from './slices/forum';
import type { MemberActions } from './slices/members';
import type { UiActions } from './slices/ui';
import type { ContributionVm, EventVm, FeedbackVm, GearVm, MemberVm, SongVm, ThreadVm, TxVm } from './vm';

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

/** A global-search hit plus the action that navigates to it. */
export interface SearchResult extends SearchHit {
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
  /** New idea form: title + body + structured song/event refs. */
  threadTitle: string;
  threadBody: string;
  threadRefs: { kind: 'song' | 'event'; id: string }[];
}

/** Read-only part of the view model: state, derived lists, headline numbers and modal selections. */
export interface GuatacaView {
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
  /** The signed-in member (the current user's profile). */
  me: Member;
  /** true when a real Supabase user is signed in. */
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
  /** true while a mutation + its silent refetch are in flight (drives the top progress bar). */
  mutating: boolean;
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
  /** Active or archived, depending on forumTab; pinned ideas sort first. */
  forumList: ThreadVm[];
  members: MemberVm[];
  /** Instrument catalog (basic + custom), for the picker and name resolution. */
  instruments: Instrument[];

  // ---- headline numbers (pre-formatted)
  balanceStr: string;
  /** true when the pool balance is negative (drives red vs green). */
  balanceNeg: boolean;
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
  /** Global search hits for `state.sq` (empty until the query is non-blank). */
  searchResults: SearchResult[];
  tour: TourVm;
  toasts: ToastVm[];
  tokens: { name: string; varName: string; tw: string; use: string }[];
  typeScale: typeof TYPE_SCALE;
  handoffNotes: { h: string; items: string[] }[];
}

/** The full view model: `GuatacaView` plus the action slices from `./slices`. */
export type Guataca = GuatacaView & NavActions & SongActions & EventActions & LedgerActions & ForumActions & MemberActions & UiActions;
