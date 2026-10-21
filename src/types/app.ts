/** App-level types: navigation, layout, toasts, modals, forms, profile and props. */
import type { GenreId, LinkKind } from './songs';
import type { EventType } from './events';
import type { TxKind, ProofKind, TxCategory, GearCondition } from './ledger';

export type Lang = 'es' | 'en';
export type Role = 'admin' | 'member';
export type View = 'dashboard' | 'calendar' | 'repertoire' | 'ledger' | 'brainstorm' | 'links' | 'members' | 'system';
/** Dev preview override for the layout tier. 'auto' follows the viewport. */
export type Device = 'auto' | 'desktop' | 'tablet' | 'mobile';
export type Layout = 'phone' | 'tablet' | 'desktop';
export type MobileTab = 'agenda' | 'repertoire' | 'fund' | 'brainstorm' | 'links' | 'profile';
export type CalTab = 'upcoming' | 'history' | 'availability';
/** Brainstorm/forum tab: everyday ideas, or ones an admin has archived. */
export type ForumTab = 'active' | 'archived';

/** A string that has a translation per language. */
export type Localized = Record<Lang, string>;

export type ToastTone = 'ok' | 'violet' | 'err';
export interface Toast {
  id: string;
  msg: string;
  tone: ToastTone;
  /** Optional button (e.g. Undo); the toast stays up for `ttl` ms so there is time to tap it. */
  action?: { label: string; run: () => void };
  /** Set briefly before removal so the stack can play an exit animation. */
  leaving?: boolean;
}

export type Modal =
  | { kind: 'event'; id: string }
  | { kind: 'thread'; id: string; commentId?: number }
  | { kind: 'member'; id: string; edit?: boolean }
  | { kind: 'newThread' }
  | { kind: 'newEvent'; id?: string }
  | { kind: 'newSong'; id?: string }
  | { kind: 'newTx'; id?: string }
  | { kind: 'newGear' }
  | { kind: 'onboard' }
  | { kind: 'signin' }
  | { kind: 'notifications' }
  | { kind: 'changelog'; since?: string };

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
  /** Event form: labelled links. */
  eventLinks?: { label: string; url: string }[];
  /** Song ids picked for a new event's setlist. */
  setlist?: string[];
  /** New gear form. */
  name?: string;
  custodian?: string;
  cond?: GearCondition;
  boughtBy?: string;
  /** Song form: required instrument ids. */
  songInstruments?: string[];
  /** New idea form: title + body + structured song/event refs. */
  threadTitle?: string;
  threadBody?: string;
  threadRefs?: { kind: 'song' | 'event'; id: string }[];
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
  /** Web Push category preferences (default true; the opt-in gate is the browser permission grant). */
  notify_events?: boolean;
  notify_forum?: boolean;
}

/** App-level props (band name, initial lang/role/view, tour + stale-day settings). */
export interface AppProps {
  bandName: string;
  initialLang: Lang;
  initialRole: Role;
  startView: View;
  showTour: boolean;
  staleDays: number;
}
