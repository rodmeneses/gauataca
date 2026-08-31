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

export interface Member {
  id: string;
  name: string;
  short: string;
  initial: string;
  role: Role;
  title: Localized;
  email: string;
  joined: string; // ISO date
  instruments: { n: Localized; lv: Proficiency }[];
  vocals: VocalFlag[];
}

export type GenreId = 'joropo' | 'llanera' | 'gaita' | 'tambor' | 'calipso';

export interface Genre {
  id: GenreId;
  label: Localized;
  short: string;
  color: string;
}

export interface Song {
  id: string;
  title: string;
  genre: GenreId;
  key: string;
  bpm: number;
  dur: string; // "m:ss"
  last: string | null; // ISO date of last rehearsal, null = never
}

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
  money: number; // >0 fee, <0 cost, 0 none
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

export type TxKind = 'in' | 'out';
export type ProofKind = 'zelle' | 'invoice' | 'photo' | 'receipt';

export interface Transaction {
  id: string;
  kind: TxKind;
  amt: number;
  date: string;
  by: string; // member id
  desc: Localized;
  proof: string | null;
  proofKind: ProofKind;
  event?: string;
  gear?: string;
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

export type ToastTone = 'ok' | 'violet';
export interface Toast {
  id: string;
  msg: string;
  tone: ToastTone;
}

export type Modal =
  | { kind: 'event'; id: string }
  | { kind: 'thread'; id: string }
  | { kind: 'member'; id: string }
  | { kind: 'newEvent' }
  | { kind: 'newSong' }
  | { kind: 'newTx' }
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

export type RatingKey = 'sound' | 'perf' | 'log' | 'energy';

export interface FormState {
  title?: string;
  venue?: string;
  date?: string;
  time?: string;
  hours?: string;
  money?: string;
  note?: string;
  type?: EventType;
  desc?: string;
  amt?: string;
  proof?: string;
  kind?: TxKind;
  key?: string;
  bpm?: string;
  dur?: string;
  genre?: GenreId;
  chart?: string;
  /** Song ids picked for a new event's setlist. */
  setlist?: string[];
}

/** Supabase profile (extends auth.users). */
export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  joined_at: string;
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
