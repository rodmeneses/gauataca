/** Shared view-model context, lookups and color tokens. */
import type { Dict } from '../../i18n';
import type { BandEvent, Gear, Instrument, Lang, Localized, Member, Proficiency, RsvpStatus, Song, Take } from '../../types';

export interface Ctx {
  lang: Lang;
  t: Dict;
  staleDays: number;
  /** Signed-in member id. */
  meId: string;
  /** true when the signed-in user is an admin (drives write affordances). */
  isAdmin: boolean;
  /** All members, for resolving ids to names/initials. */
  members: Member[];
  /** All events, for resolving a transaction's linked event id. */
  events: BandEvent[];
  /** All songs, for resolving forum references to song names. */
  songs: Song[];
  /** All gear, for resolving a transaction's linked gear id. */
  gear: Gear[];
  /** Instrument catalog, for resolving instrument ids to names. */
  instruments: Instrument[];
  /** Song recordings ("takes"), for resolving per-event / per-song links. */
  takes: Take[];
}

/** Resolve a member id to a Member (falls back to the first member). */
const FALLBACK_MEMBER: Member = {
  id: '', name: '', short: '', initial: '', role: 'member',
  title: { es: '', en: '' }, email: '', joined: '', instruments: [], vocals: [],
};

export function memberById(members: Member[], id: string): Member {
  return members.find((m) => m.id === id) ?? members[0] ?? FALLBACK_MEMBER;
}

export const L = (lang: Lang, v: Localized | string | null | undefined): string =>
  v && typeof v === 'object' ? (v[lang] ?? v.es) : (v ?? '');

/* ---------------------------------------------------------------- colors */
export const STATE_COLOR = { active: 'var(--color-emerald)', cancelled: 'var(--color-rose)', rescheduled: 'var(--color-amber)' } as const;
export const TYPE_COLOR = { gig: 'var(--color-violet-light)', studio: 'var(--color-sky)', garage: 'var(--color-ink-meta)' } as const;
export const LEVEL_COLOR: Record<Proficiency, string> = { expert: 'var(--color-emerald)', inter: 'var(--color-sky)', beg: 'var(--color-ink-muted)' };
export const LEVEL_PCT: Record<Proficiency, string> = { expert: '100%', inter: '62%', beg: '30%' };
export const RSVP_COLOR: Record<RsvpStatus, string> = { going: 'var(--color-emerald)', maybe: 'var(--color-amber)', no: 'var(--color-rose)' };
export const RSVP_PENDING_COLOR = 'var(--color-ink-muted)';
export const RSVP_ORDER: RsvpStatus[] = ['going', 'maybe', 'no'];
/** ~11% wash of an accent, behind coloured badges/labels. Accepts any CSS colour incl. var(--color-*). */
export const tint = (c: string) => `color-mix(in srgb, ${c} 12%, transparent)`;
