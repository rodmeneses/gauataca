import { describe, expect, it } from 'vitest';
import { scoreOf, tallyPoll, unansweredCount } from './availability';
import type { AvailabilityPoll } from '../types';

const poll = (votes: AvailabilityPoll['votes'], dates = ['2026-11-07', '2026-11-14']): AvailabilityPoll => ({
  id: 1, title: 'Fiesta', closed: false, createdBy: 'a', dates, votes,
});
const members = ['a', 'b', 'c'];

describe('tallyPoll', () => {
  it('groups members by answer and lists who is still pending', () => {
    const [d1] = tallyPoll(poll([
      { date: '2026-11-07', profileId: 'a', answer: 'yes' },
      { date: '2026-11-07', profileId: 'b', answer: 'maybe' },
    ]), members, 'a');
    expect(d1.yes).toEqual(['a']);
    expect(d1.maybe).toEqual(['b']);
    expect(d1.no).toEqual([]);
    expect(d1.pending).toEqual(['c']);
    expect(d1.mine).toBe('yes');
  });

  it('ignores votes from people who are not members and reports no answer as null', () => {
    const [d1, d2] = tallyPoll(poll([{ date: '2026-11-07', profileId: 'ghost', answer: 'yes' }]), members, 'b');
    expect(d1.yes).toEqual([]);
    expect(d1.mine).toBeNull();
    expect(d2.pending).toEqual(members);
  });

  it('marks the best date, counting maybe as half a yes', () => {
    const t = tallyPoll(poll([
      { date: '2026-11-07', profileId: 'a', answer: 'yes' },
      { date: '2026-11-07', profileId: 'b', answer: 'maybe' },
      { date: '2026-11-14', profileId: 'a', answer: 'yes' },
    ]), members, 'a');
    expect(t.map((x) => x.best)).toEqual([true, false]);
  });

  it('marks every tied date and none while nobody can make any', () => {
    const tied = tallyPoll(poll([
      { date: '2026-11-07', profileId: 'a', answer: 'yes' },
      { date: '2026-11-14', profileId: 'b', answer: 'yes' },
    ]), members, 'a');
    expect(tied.map((x) => x.best)).toEqual([true, true]);
    const none = tallyPoll(poll([{ date: '2026-11-07', profileId: 'a', answer: 'no' }]), members, 'a');
    expect(none.every((x) => !x.best)).toBe(true);
  });

  it('handles a poll without dates', () => {
    expect(tallyPoll(poll([], []), members, 'a')).toEqual([]);
  });
});

describe('scoreOf / unansweredCount', () => {
  it('scores yes as 2 and maybe as 1', () => {
    expect(scoreOf({ yes: ['a', 'b'], maybe: ['c'] })).toBe(5);
  });

  it('counts the dates a member has not answered', () => {
    const p = poll([{ date: '2026-11-07', profileId: 'a', answer: 'no' }]);
    expect(unansweredCount(p, 'a')).toBe(1);
    expect(unansweredCount(p, 'b')).toBe(2);
  });
});
