/** Read side: map PostgREST rows into availability polls. */
import { groupBy, type Row } from '../shared';
import type { AvailabilityAnswer, AvailabilityPoll } from '../../../types';

const ANSWERS: AvailabilityAnswer[] = ['yes', 'maybe', 'no'];

export function mapAvailability(polls: Row[], dates: Row[], votes: Row[]): AvailabilityPoll[] {
  const datesByPoll = groupBy(dates, 'poll_id');
  const votesByPoll = groupBy(votes, 'poll_id');
  return polls
    .map((p): AvailabilityPoll => ({
      id: p.id,
      title: p.title,
      closed: !!p.closed,
      createdBy: p.created_by,
      dates: (datesByPoll.get(p.id) ?? []).map((d) => String(d.date)).sort(),
      votes: (votesByPoll.get(p.id) ?? [])
        .filter((v) => ANSWERS.includes(v.answer))
        .map((v) => ({ date: String(v.date), profileId: v.profile_id, answer: v.answer as AvailabilityAnswer })),
    }))
    .sort((a, b) => b.id - a.id);
}
