import { describe, expect, it } from 'vitest';
import { badHours, compareSlots, diffSlots, normalizeSlots, scoreOf, slotDuration, slotHours, slotKey, tallyPoll, unansweredCount } from './availability';
import type { AvailabilityPoll, AvailabilitySlot } from '../types';

const slot = (id: number, date: string, start: string | null = null, end: string | null = null): AvailabilitySlot => ({ id, date, start, end });
const SLOTS = [slot(1, '2026-11-07'), slot(2, '2026-11-14')];
const poll = (votes: AvailabilityPoll['votes'], slots = SLOTS): AvailabilityPoll => ({
  id: 1, title: 'Fiesta', closed: false, createdBy: 'a', slots, votes,
});
const members = ['a', 'b', 'c'];

describe('tallyPoll', () => {
  it('groups members by answer and lists who is still pending', () => {
    const [d1] = tallyPoll(poll([
      { slotId: 1, profileId: 'a', answer: 'yes' },
      { slotId: 1, profileId: 'b', answer: 'maybe' },
    ]), members, 'a');
    expect(d1.slot).toBe(SLOTS[0]);
    expect(d1.yes).toEqual(['a']);
    expect(d1.maybe).toEqual(['b']);
    expect(d1.no).toEqual([]);
    expect(d1.pending).toEqual(['c']);
    expect(d1.mine).toBe('yes');
  });

  it('ignores votes from people who are not members and reports no answer as null', () => {
    const [d1, d2] = tallyPoll(poll([{ slotId: 1, profileId: 'ghost', answer: 'yes' }]), members, 'b');
    expect(d1.yes).toEqual([]);
    expect(d1.mine).toBeNull();
    expect(d2.pending).toEqual(members);
  });

  it('marks the best slot, counting maybe as half a yes', () => {
    const t = tallyPoll(poll([
      { slotId: 1, profileId: 'a', answer: 'yes' },
      { slotId: 1, profileId: 'b', answer: 'maybe' },
      { slotId: 2, profileId: 'a', answer: 'yes' },
    ]), members, 'a');
    expect(t.map((x) => x.best)).toEqual([true, false]);
  });

  it('marks every tied slot and none while nobody can make any', () => {
    const tied = tallyPoll(poll([
      { slotId: 1, profileId: 'a', answer: 'yes' },
      { slotId: 2, profileId: 'b', answer: 'yes' },
    ]), members, 'a');
    expect(tied.map((x) => x.best)).toEqual([true, true]);
    const none = tallyPoll(poll([{ slotId: 1, profileId: 'a', answer: 'no' }]), members, 'a');
    expect(none.every((x) => !x.best)).toBe(true);
  });

  it('keeps two slots on the same date apart', () => {
    const t = tallyPoll(poll([{ slotId: 3, profileId: 'a', answer: 'yes' }], [slot(3, '2026-11-07', '14:00'), slot(4, '2026-11-07', '19:00')]), members, 'a');
    expect(t.map((x) => x.yes)).toEqual([['a'], []]);
  });

  it('handles a poll without slots', () => {
    expect(tallyPoll(poll([], []), members, 'a')).toEqual([]);
  });
});

describe('scoreOf / unansweredCount', () => {
  it('scores yes as 2 and maybe as 1', () => {
    expect(scoreOf({ yes: ['a', 'b'], maybe: ['c'] })).toBe(5);
  });

  it('counts the slots a member has not answered', () => {
    const p = poll([{ slotId: 1, profileId: 'a', answer: 'no' }]);
    expect(unansweredCount(p, 'a')).toBe(1);
    expect(unansweredCount(p, 'b')).toBe(2);
  });
});

describe('slot helpers', () => {
  it('orders by date, then all-day before timed, then by hours', () => {
    const s = [slot(1, '2026-11-08'), slot(2, '2026-11-07', '19:00'), slot(3, '2026-11-07', '14:00', '17:00'), slot(4, '2026-11-07'), slot(5, '2026-11-07', '14:00')];
    expect(s.sort(compareSlots).map((x) => x.id)).toEqual([4, 5, 3, 2, 1]);
  });

  it('keys a slot by its date and hours', () => {
    expect(slotKey(slot(1, 'd', '10:00'))).toBe('d|10:00|');
    expect(slotKey(slot(2, 'd', '10:00'))).toBe(slotKey(slot(1, 'd', '10:00')));
  });

  it('formats the hours of a slot', () => {
    expect(slotHours({ start: '19:00', end: '22:00' }, 'from')).toBe('19:00–22:00');
    expect(slotHours({ start: '19:00', end: null }, 'desde')).toBe('desde 19:00');
    expect(slotHours({ start: null, end: null }, 'from')).toBe('');
  });

  it('normalizes form rows: no date, end without start, duplicates', () => {
    expect(normalizeSlots([
      { date: '', start: '10:00', end: null },
      { date: 'd', start: '', end: '12:00' },
      { date: 'd', start: null, end: null },
      { date: 'd', start: '10:00', end: '' },
      { date: 'd', start: '10:00', end: null },
    ])).toEqual([{ date: 'd', start: null, end: null }, { date: 'd', start: '10:00', end: null }]);
  });

  it('flags a slot whose end equals its start', () => {
    expect(badHours({ start: '10:00', end: '10:00' })).toBe(true);
    expect(badHours({ start: '10:00', end: '11:00' })).toBe(false);
    expect(badHours({ start: null, end: null })).toBe(false);
  });

  it('diffs an edit into removed ids and added slots', () => {
    const cur = [slot(1, 'a'), slot(2, 'b', '19:00')];
    expect(diffSlots(cur, [{ date: 'a', start: null, end: null }, { date: 'b', start: '20:00', end: null }])).toEqual({
      remove: [2],
      add: [{ date: 'b', start: '20:00', end: null }],
    });
    expect(diffSlots(cur, cur)).toEqual({ remove: [], add: [] });
  });

  it('computes the length of a timed slot, across midnight too', () => {
    expect(slotDuration({ start: '19:00', end: '22:30' })).toEqual({ h: 3, m: 30 });
    expect(slotDuration({ start: '22:00', end: '01:15' })).toEqual({ h: 3, m: 15 });
    expect(slotDuration({ start: '19:00', end: null })).toBeNull();
    expect(slotDuration({ start: '19:00', end: '19:00' })).toBeNull();
  });
});
