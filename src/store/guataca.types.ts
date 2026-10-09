/** Types for the `useGuataca` view-model: the `Guataca` shape and the pieces it is built from. */
import type { Dict } from '../i18n';
import type { TYPE_SCALE } from '../data';
import type { AppProps, CustodyDialog, FormState, GearCondition, GenreId, Instrument, Lang, LinkKind, Member, MobileTab, Modal, Proficiency, ProofKind, RatingKey, ReactionKind, RsvpStatus, SettleDialog, ShareSheet, SongSort, Toast, TxCategory, TxDate, TxFilter, View, VocalFlag } from '../types';
import type { State } from './store';
import type { ThemePref } from '../lib/prefs';
import type { SearchHit } from '../lib/search';
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

  // ---- actions
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
  toggleSong: (id: string) => void;
  /** Navigate to the repertoire and open a specific song (from a setlist, etc.). */
  goToSong: (id: string) => void;
  /** Clear the pending scroll-to-song request (called by the repertoire views after scrolling). */
  clearScrollToSong: () => void;
  /** Navigate to the ledger and scroll to a specific movement (from a shareable link). */
  goToTx: (id: string) => void;
  /** Clear the pending scroll-to-movement request (called by the ledger views after scrolling). */
  clearScrollToTx: () => void;
  /** Copy a shareable deep link for an item (event / song / movement) to the clipboard. */
  copyLink: (kind: 'event' | 'song' | 'tx' | 'thread', id: string, commentId?: number) => void;
  setQ: (q: string) => void;
  setGenre: (g: GenreId | 'all') => void;
  toggleStale: () => void;
  setSongSort: (s: SongSort) => void;
  openEvent: (id: string) => void;
  openThread: (id: string, commentId?: number) => void;
  openMember: (id: string, edit?: boolean) => void;
  openNewEvent: () => void;
  openEditEvent: (id: string) => void;
  openNewSong: () => void;
  openEditSong: (id: string) => void;
  openNewTx: () => void;
  openEditTx: (id: string) => void;
  openNewGear: () => void;
  openNewThread: () => void;
  /** Create a forum idea (title/body/refs) and upload its photos; an optional poll rides along. */
  saveThread: (photos: File[], poll?: { question: string; options: string[]; multiple?: boolean } | null) => Promise<void>;
  setThreadReaction: (threadId: string, kind: ReactionKind | null) => Promise<void>;
  setCommentReaction: (commentId: number, kind: ReactionKind | null) => Promise<void>;
  /** Delete one of your own comments (its replies go with it). */
  deleteComment: (commentId: number) => Promise<void>;
  /** Add an option to the open idea's poll (admins). */
  addThreadPollOption: (label: string) => Promise<void>;
  /** Set the signed-in member's vote on a poll option; re-picking moves the vote. */
  voteThreadPoll: (optionId: number) => Promise<void>;
  /** Attach photos to a forum idea (or, with `commentId`, to one of its comments). */
  addThreadPhotos: (threadId: string, files: File[], commentId?: number | null) => Promise<void>;
  deleteThreadMedia: (id: number) => Promise<void>;
  addThreadRefs: (threadId: string, refs: { kind: 'song' | 'event'; id: string }[], commentId?: number | null) => Promise<void>;
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
  /** Open the Web Push notification preferences modal (desktop). */
  openNotifications: () => void;
  /** Open the changelog; with `since`, only entries newer than that version are marked new. */
  openChangelog: (since?: string) => void;
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
  /** Toggle an event's pinned state (admin only). */
  toggleEventPin: (eventId: string) => Promise<void>;
  /** Cancel an event (it moves to history) or reinstate a cancelled one (admin only). */
  toggleEventCancelled: (eventId: string) => Promise<void>;
  /** Replace an event's setlist (ordered song ids). */
  setEventSetlist: (eventId: string, songIds: string[]) => Promise<void>;
  /** Add a recording ("take") of a song during a practice event. */
  addTake: (eventId: string, songId: string, url: string) => Promise<void>;
  /** Remove a recording ("take"). */
  deleteTake: (id: string) => Promise<void>;
  /** Add a video link (Google Drive) to an event. */
  addEventVideo: (eventId: string, label: string, url: string) => Promise<void>;
  /** Compress + upload one or more photos to an event. */
  addEventPhotos: (eventId: string, files: File[]) => Promise<void>;
  /** Remove a photo or video from an event. */
  deleteEventMedia: (id: number) => Promise<void>;
  setCommentDraft: (s: string) => void;
  /** Post a top-level comment (optionally with photos). */
  sendComment: (photos?: File[]) => Promise<void>;
  /** Begin replying to a specific comment id (null clears the reply composer). */
  setReplyTarget: (target: number | null) => void;
  setReplyDraft: (s: string) => void;
  /** Post a one-level reply to the active reply target (optionally with photos). */
  sendReply: (photos?: File[]) => Promise<void>;
  convertThread: (id: string) => void;
  /** Toggle a forum idea's pinned state (admin only). */
  toggleThreadPin: (id: string) => Promise<void>;
  /** Toggle a forum idea's archived state (admin only). */
  toggleThreadArchive: (id: string) => Promise<void>;
  pickPoll: (i: number) => Promise<void>;
  setRating: (k: RatingKey, n: number) => void;
  toggleAnon: () => void;
  setFbWell: (s: string) => void;
  setFbImprove: (s: string) => void;
  submitFb: () => Promise<void>;
  setForm: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  saveEvent: () => Promise<void>;
  saveTx: () => Promise<void>;
  deleteTx: (id: string) => Promise<void>;
  saveSong: () => Promise<void>;
  saveGear: () => Promise<void>;
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
}
