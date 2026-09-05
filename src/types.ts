// Domain types for BandSync (Phase 1 prototype — mock data, no persistence).
// Field names mirror the suggested Phase 2 tables (see data/system.ts → handoff notes).

export type Lang = 'es' | 'en';
export type Role = 'admin' | 'member';
export type View = 'dashboard' | 'calendar' | 'repertoire' | 'ledger' | 'brainstorm' | 'members' | 'system';
export type Device = 'desktop' | 'mobile';
export type MobileTab = 'agenda' | 'repertoire' | 'fund' | 'brainstorm' | 'profile';
export type CalTab = 'upcoming' | 'history';

/** A string that has a translation per language. */
export type Localized = Record<Lang, string>;

export type Proficiency = 'expert' | 'inter' | 'beg';
export type VocalFlag = 'lead' | 'chorus' | 'none';

/** A playable instrument in the shared catalog (basic or custom). */
export interface Instrument {
  id: string;
  name: Localized;
  isBasic: boolean;
}

export interface Member {
  id: string;
  name: string;
  short: string;
  initial: string;
  role: Role;
  title: Localized;
  email: string;
  joined: string; // ISO date
  /** Instrument catalog ids + the member's proficiency on each. */
  instruments: { id: string; lv: Proficiency }[];
  vocals: VocalFlag[];
}

export type GenreId = 'joropo' | 'llanera' | 'gaita' | 'tambor' | 'calipso' | 'balada' | 'merengue' | 'guacharaca' | 'vals' | 'lirica';

export interface Genre {
  id: GenreId;
  label: Localized;
  short: string;
  color: string;
}

/** What a song link points at — drives the icon and grouping on the card. */
export type LinkKind = 'youtube' | 'apple' | 'spotify' | 'chart';

/** A link attached to a song (real-version streaming or tabs/sheet music). */
export interface SongLink {
  kind: LinkKind;
  label: Localized;
  url: string;
}

export interface Song {
  id: string;
  title: string;
  genre: GenreId;
  key: string;
  bpm: number;
  dur: string; // "m:ss"
  last: string | null; // ISO date of last rehearsal, null = never
  /** Instrument catalog ids this song requires (optional). */
  instruments?: string[];
  /** Streaming + chart links (any number of each kind). */
  links: SongLink[];
}

/** Repertoire sort: most recorded (default), by name, or fewest takes. */
export type SongSort = 'recorded' | 'name' | 'takes';

export type EventType = 'gig' | 'studio' | 'garage';
export type EventState = 'active' | 'cancelled' | 'rescheduled';
/** A member's answer to "are you going?" — absent = pending. */
export type RsvpStatus = 'going' | 'maybe' | 'no';

export interface FeedbackEntry {
  by: string | null;
  anon: boolean;
  text: Localized;
}

export interface EventFeedback {
  sound: number;
  perf: number;
  log: number;
  energy: number;
  responses: number;
  well: FeedbackEntry[];
  improve: FeedbackEntry[];
  poll: { q: Localized; options: { label: Localized; v: number }[] };
}

export interface BandEvent {
  id: string;
  type: EventType;
  state: EventState;
  date: string; // ISO date
  time: string; // "HH:mm"
  hours?: number; // duration in hours (e.g. 2.5)
  title: Localized;
  venue: string;
  fee: number; // expected income (cachet), >= 0
  cost: number; // expected expense (e.g. studio rental), >= 0
  /** true once the event's income/expense have been confirmed into the ledger. */
  settled: boolean;
  setlist: string[]; // song ids (gig setlist or songs rehearsed)
  /** Historical headcount; ignored when `attendance` is present (then derived = count of 'going'). */
  attend: number;
  /** member id → RSVP. Present on upcoming events; members without an entry are pending. */
  attendance?: Record<string, RsvpStatus>;
  note: Localized;
  flyer?: string;
  prevDate?: string;
  media?: { label: Localized; url: string }[];
  feedback?: EventFeedback;
}

/** A recording of one song made during a practice event ("Take 1", "Take 2", …). */
export interface Take {
  id: string;
  eventId: string;
  songId: string;
  url: string;
  /** Take number for this song (1-based, global across all practices). */
  n: number;
}

export type TxKind = 'in' | 'out';
export type ProofKind = 'zelle' | 'invoice' | 'photo' | 'receipt';
/** Income category (null for expenses). */
export type TxCategory = 'fee' | 'tip' | 'donation' | 'contribution';
/** Ledger filter: all movements, income only, or expenses only. */
export type TxFilter = 'all' | 'in' | 'out';
/** Ledger date window: all time, or the last N days. */
export type TxDate = 'all' | '30' | '90' | '365';

export interface Transaction {
  id: string;
  kind: TxKind;
  amt: number;
  date: string;
  by: string; // member id (who logged it)
  desc: Localized;
  proof: string | null;
  proofKind: ProofKind;
  event?: string;
  gear?: string;
  /** Income category (fee/tip/donation/contribution); undefined for expenses. */
  category?: TxCategory;
  /** Member id who contributed (contribution movements only). */
  contributor?: string;
}

export type GearCondition = 'good' | 'attention';

export interface Gear {
  id: string;
  name: Localized;
  cost: number;
  date: string;
  holder: string; // member id (current custodian)
  tx?: string;
  cond: GearCondition;
  note: Localized;
  /** Member id who bought it (for money tracking). */
  boughtBy?: string;
}

export interface ThreadComment {
  by: string; // member id
  text: Localized;
}

export interface Thread {
  id: string;
  by: string;
  date: string;
  votes: number;
  title: Localized;
  body: Localized;
  comments: ThreadComment[];
}

/** Comment added at runtime (already localized, author resolved). */
export interface LocalComment {
  by: string;
  initial: string;
  text: string;
}

export type ToastTone = 'ok' | 'violet' | 'err';
export interface Toast {
  id: string;
  msg: string;
  tone: ToastTone;
}

export type Modal =
  | { kind: 'event'; id: string }
  | { kind: 'thread'; id: string }
  | { kind: 'member'; id: string; edit?: boolean }
  | { kind: 'newEvent' }
  | { kind: 'newSong'; id?: string }
  | { kind: 'newTx' }
  | { kind: 'newGear' }
  | { kind: 'onboard' }
  | { kind: 'signin' };

export interface ShareSheet {
  title: string;
  caption: string;
  flyer: string | null;
}

export interface CustodyDialog {
  id: string;
  name: string;
  holder: string;
}

export interface SettleDialog {
  id: string;
  title: string;
  fee: number;
  cost: number;
}

export type RatingKey = 'sound' | 'perf' | 'log' | 'energy';

export interface FormState {
  title?: string;
  venue?: string;
  date?: string;
  time?: string;
  hours?: string;
  fee?: string;
  cost?: string;
  note?: string;
  type?: EventType;
  desc?: string;
  amt?: string;
  proof?: string;
  proofKind?: ProofKind;
  kind?: TxKind;
  /** Income category (fee/tip/donation/contribution). */
  category?: TxCategory;
  /** Member id who contributed (contribution movements only). */
  contributor?: string;
  /** Event / gear ids a new movement is linked to (optional). */
  event?: string;
  gear?: string;
  key?: string;
  bpm?: string;
  dur?: string;
  genre?: GenreId;
  /** Song form: streaming + chart links (kind, label, url). */
  songLinks?: { kind: LinkKind; label: string; url: string }[];
  /** Song ids picked for a new event's setlist. */
  setlist?: string[];
  /** New gear form. */
  name?: string;
  custodian?: string;
  cond?: GearCondition;
  boughtBy?: string;
  /** Song form: required instrument ids. */
  songInstruments?: string[];
}

/** Supabase profile (extends auth.users). */
export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  joined_at: string;
  /** false until the member completes sign-up onboarding. */
  onboarded?: boolean;
}

/** Prototype knobs (the "tweaks" of the design). */
export interface AppProps {
  bandName: string;
  initialLang: Lang;
  initialRole: Role;
  startView: View;
  showTour: boolean;
  staleDays: number;
}
