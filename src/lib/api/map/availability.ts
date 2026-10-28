/** Read side: map PostgREST rows into availability polls. */
import { groupBy, type Row } from '../shared';
import { compareSlots } from '../../availability';
import type { AvailabilityAnswer, AvailabilityPoll, AvailabilitySlot } from '../../../types';

const ANSWERS: AvailabilityAnswer[] = ['yes', 'maybe', 'no'];

/** Postgres `time` comes back as "HH:MM:SS"; the app works in "HH:MM". */
const hhmm = (t: unknown): string | null => (t ? String(t).slice(0, 5) : null);

export function mapAvailability(polls: Row[], slots: Row[], votes: Row[]): AvailabilityPoll[] {
  const slotsByPoll = groupBy(slots, 'poll_id');
  const votesByPoll = groupBy(votes, 'poll_id');
  return polls
    .map((p): AvailabilityPoll => ({
      id: p.id,
      title: p.title,
      closed: !!p.closed,
      archived: !!p.archived,
      createdBy: p.created_by,
      slots: (slotsByPoll.get(p.id) ?? [])
        .map((s): AvailabilitySlot => ({ id: s.id, date: String(s.date), start: hhmm(s.start_time), end: hhmm(s.end_time) }))
        .sort(compareSlots),
      votes: (votesByPoll.get(p.id) ?? [])
        .filter((v) => ANSWERS.includes(v.answer))
        .map((v) => ({ slotId: v.slot_id, profileId: v.profile_id, answer: v.answer as AvailabilityAnswer })),
    }))
    .sort((a, b) => b.id - a.id);
}
