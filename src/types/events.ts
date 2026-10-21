/** Events, RSVPs, feedback and takes. */
import type { Localized } from './app';

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
  fee: number; // expected income (honorarios), >= 0
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
  media?: { id: number; kind: 'photo' | 'video'; label: Localized; url: string }[];
  /** Labelled links (setlist doc, venue page, …), in display order. */
  links?: { label: string; url: string }[];
  feedback?: EventFeedback;
  /** Admin-pinned events sort to the top of the calendar's upcoming/history lists. */
  pinned: boolean;
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

/** A member's answer for one candidate date — absent = hasn't answered yet. */
export type AvailabilityAnswer = 'yes' | 'maybe' | 'no';

/** "Which date works?" poll: candidate dates plus every member's answers. */
export interface AvailabilityPoll {
  id: number;
  title: string;
  closed: boolean;
  createdBy: string;
  /** Candidate dates, ISO (YYYY-MM-DD), ascending. */
  dates: string[];
  votes: { date: string; profileId: string; answer: AvailabilityAnswer }[];
}

