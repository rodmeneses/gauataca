/**
 * Availability polls: turn a poll's raw votes into per-slot counts, the best slot(s) and a
 * member's own answers; plus the slot helpers the form and the API share. Pure — the panel
 * renders what this returns.
 */
import type { AvailabilityAnswer, AvailabilityPoll, AvailabilitySlot, AvailabilitySlotInput } from '../types';

export interface SlotTally {
  slot: AvailabilitySlot;
  yes: string[];
  maybe: string[];
  no: string[];
  /** Members who haven't answered this slot. */
  pending: string[];
  /** The signed-in member's answer, if any. */
  mine: AvailabilityAnswer | null;
  /** true for every slot tied for the best score (only once someone has said yes or maybe). */
  best: boolean;
}

/** Yes counts fully, maybe as half: 2 yes + 1 maybe beats 2 yes, and 3 maybes lose to 2 yes. */
export const scoreOf = (t: Pick<SlotTally, 'yes' | 'maybe'>): number => t.yes.length * 2 + t.maybe.length;

/** Identity of a slot's content: two slots with the same key are the same candidate. */
export const slotKey = (s: AvailabilitySlotInput): string => `${s.date}|${s.start ?? ''}|${s.end ?? ''}`;

/** By date, then start hour (all-day before timed), then end hour. */
export function compareSlots(a: AvailabilitySlotInput, b: AvailabilitySlotInput): number {
  return a.date.localeCompare(b.date) || (a.start ?? '').localeCompare(b.start ?? '') || (a.end ?? '').localeCompare(b.end ?? '');
}

/** "19:00–22:00", "from 19:00" / "desde 19:00", or '' for an all-day slot. */
export function slotHours(s: Pick<AvailabilitySlotInput, 'start' | 'end'>, fromWord: string): string {
  if (!s.start) return '';
  return s.end ? `${s.start}–${s.end}` : `${fromWord} ${s.start}`;
}

/**
 * Clean up form rows: drop rows without a date, drop an end hour without a start hour,
 * and drop duplicates (same date and hours), keeping order.
 */
export function normalizeSlots(rows: AvailabilitySlotInput[]): AvailabilitySlotInput[] {
  const seen = new Set<string>();
  return rows.flatMap((r) => {
    if (!r.date) return [];
    const start = r.start || null;
    const slot = { date: r.date, start, end: start ? r.end || null : null };
    const key = slotKey(slot);
    if (seen.has(key)) return [];
    seen.add(key);
    return [slot];
  });
}

/** true when a row's end hour equals its start hour (the only invalid combination). */
export const badHours = (s: Pick<AvailabilitySlotInput, 'start' | 'end'>): boolean => !!s.start && !!s.end && s.start === s.end;

/**
 * What an edit changes: slots whose content is unchanged keep their id (and their answers);
 * the rest of `current` are removed and the rest of `next` are added.
 */
export function diffSlots(current: AvailabilitySlot[], next: AvailabilitySlotInput[]): { remove: number[]; add: AvailabilitySlotInput[] } {
  const wanted = new Set(next.map(slotKey));
  const have = new Set(current.map(slotKey));
  return {
    remove: current.filter((s) => !wanted.has(slotKey(s))).map((s) => s.id),
    add: next.filter((s) => !have.has(slotKey(s))),
  };
}

/** Event length in hours and minutes for a timed slot (crossing midnight when end < start), or null. */
export function slotDuration(s: Pick<AvailabilitySlotInput, 'start' | 'end'>): { h: number; m: number } | null {
  if (!s.start || !s.end) return null;
  const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const total = (mins(s.end) - mins(s.start) + 1440) % 1440;
  return total === 0 ? null : { h: Math.floor(total / 60), m: total % 60 };
}

/** One tally per candidate slot, in slot order. `memberIds` is everyone who should answer. */
export function tallyPoll(poll: AvailabilityPoll, memberIds: string[], meId: string): SlotTally[] {
  const tallies = poll.slots.map((slot): SlotTally => {
    const answers = new Map(poll.votes.filter((v) => v.slotId === slot.id).map((v) => [v.profileId, v.answer]));
    const by = (a: AvailabilityAnswer) => memberIds.filter((id) => answers.get(id) === a);
    return {
      slot,
      yes: by('yes'),
      maybe: by('maybe'),
      no: by('no'),
      pending: memberIds.filter((id) => !answers.has(id)),
      mine: answers.get(meId) ?? null,
      best: false,
    };
  });
  const top = Math.max(0, ...tallies.map(scoreOf));
  return top === 0 ? tallies : tallies.map((t) => ({ ...t, best: scoreOf(t) === top }));
}

/** How many of the poll's slots the member still has to answer. */
export function unansweredCount(poll: AvailabilityPoll, meId: string): number {
  const answered = new Set(poll.votes.filter((v) => v.profileId === meId).map((v) => v.slotId));
  return poll.slots.filter((s) => !answered.has(s.id)).length;
}
