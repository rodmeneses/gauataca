/**
 * Availability polls: turn a poll's raw votes into per-date counts, the best date(s) and a
 * member's own answers. Pure — the panel renders what this returns.
 */
import type { AvailabilityAnswer, AvailabilityPoll } from '../types';

export interface DateTally {
  date: string;
  yes: string[];
  maybe: string[];
  no: string[];
  /** Members who haven't answered this date. */
  pending: string[];
  /** The signed-in member's answer, if any. */
  mine: AvailabilityAnswer | null;
  /** true for every date tied for the best score (only once someone has said yes or maybe). */
  best: boolean;
}

/** Yes counts fully, maybe as half: 2 yes + 1 maybe beats 2 yes, and 3 maybes lose to 2 yes. */
export const scoreOf = (t: Pick<DateTally, 'yes' | 'maybe'>): number => t.yes.length * 2 + t.maybe.length;

/** One tally per candidate date, in date order. `memberIds` is everyone who should answer. */
export function tallyPoll(poll: AvailabilityPoll, memberIds: string[], meId: string): DateTally[] {
  const tallies = poll.dates.map((date): DateTally => {
    const answers = new Map(poll.votes.filter((v) => v.date === date).map((v) => [v.profileId, v.answer]));
    const by = (a: AvailabilityAnswer) => memberIds.filter((id) => answers.get(id) === a);
    return {
      date,
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

/** How many of `dates` the member still has to answer. */
export function unansweredCount(poll: AvailabilityPoll, meId: string): number {
  const answered = new Set(poll.votes.filter((v) => v.profileId === meId).map((v) => v.date));
  return poll.dates.filter((d) => !answered.has(d)).length;
}
