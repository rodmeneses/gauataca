import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BandEvent, Instrument, Member, Transaction } from '../types';
import {
  bucketEvents, contributionTotals, filterPalette, filterSongs, filterTx, layoutTier, ledgerTotals,
  mergeInstruments, pinnedFirst, sortTxNewestFirst,
} from './derive';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-08T12:00:00'));
});
afterEach(() => vi.useRealTimers());

describe('layoutTier', () => {
  it('honours the forced device preview', () => {
    expect(layoutTier('mobile', false, false)).toBe('phone');
    expect(layoutTier('tablet', true, false)).toBe('tablet');
    expect(layoutTier('desktop', true, true)).toBe('desktop');
  });
  it('follows the viewport on auto', () => {
    expect(layoutTier('auto', true, false)).toBe('phone');
    expect(layoutTier('auto', false, true)).toBe('tablet');
    expect(layoutTier('auto', false, false)).toBe('desktop');
  });
});

describe('mergeInstruments', () => {
  const db: Instrument[] = [{ id: 'cuatro', name: { es: 'Cuatro', en: 'Cuatro' }, isBasic: true }];
  it('appends custom instruments not already in the DB, marked non-basic', () => {
    const out = mergeInstruments(db, [
      { id: 'cuatro', name: { es: 'dup', en: 'dup' } },
      { id: 'tambor', name: { es: 'Tambor', en: 'Drum' } },
    ]);
    expect(out.map((i) => i.id)).toEqual(['cuatro', 'tambor']);
    expect(out[1].isBasic).toBe(false);
  });
});

const song = (title: string, over: Partial<Parameters<typeof filterSongs>[0][number]> = {}) =>
  ({ title, genre: 'joropo' as const, genreLabel: 'Joropo', key: 'D', isStale: false, takeCount: 0, ...over });

describe('filterSongs', () => {
  const list = [song('Beta', { takeCount: 1 }), song('Alpha', { takeCount: 3, isStale: true }), song('Gamma', { genre: 'gaita', genreLabel: 'Gaita', key: 'C' })];
  const base = { genre: 'all' as const, staleOnly: false, query: '', sort: 'name' as const };
  it('sorts by name, takes ascending, and recorded (most takes first)', () => {
    expect(filterSongs(list, base).map((s) => s.title)).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(filterSongs(list, { ...base, sort: 'takes' }).map((s) => s.title)).toEqual(['Gamma', 'Beta', 'Alpha']);
    expect(filterSongs(list, { ...base, sort: 'recorded' }).map((s) => s.title)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });
  it('filters by genre, staleness and query (title, genre label, exact key)', () => {
    expect(filterSongs(list, { ...base, genre: 'gaita' }).map((s) => s.title)).toEqual(['Gamma']);
    expect(filterSongs(list, { ...base, staleOnly: true }).map((s) => s.title)).toEqual(['Alpha']);
    expect(filterSongs(list, { ...base, query: ' ALP ' }).map((s) => s.title)).toEqual(['Alpha']);
    expect(filterSongs(list, { ...base, query: 'gait' }).map((s) => s.title)).toEqual(['Gamma']);
    expect(filterSongs(list, { ...base, query: 'c' }).map((s) => s.title)).toEqual(['Gamma']);
  });
});

const ev = (id: string, date: string, state: BandEvent['state'] = 'active') => ({ id, date, state }) as BandEvent;

describe('bucketEvents', () => {
  it('splits upcoming/history, sorts each, and finds the next active event', () => {
    const { upcoming, history, next } = bucketEvents([
      ev('far', '2026-12-01'), ev('soon', '2026-10-10'), ev('old', '2026-09-01'), ev('older', '2026-08-01'), ev('cx', '2026-10-12', 'cancelled'),
    ]);
    expect(upcoming.map((e) => e.id)).toEqual(['soon', 'far']);
    expect(history.map((e) => e.id)).toEqual(['cx', 'old', 'older']);
    expect(next?.id).toBe('soon');
  });
  it('has no next event when nothing is upcoming and active', () => {
    expect(bucketEvents([ev('old', '2026-01-01'), ev('r', '2026-11-01', 'rescheduled')]).next).toBeNull();
    expect(bucketEvents([]).next).toBeNull();
  });
});

describe('pinnedFirst', () => {
  it('floats pinned items up, keeping order within groups', () => {
    const out = pinnedFirst([{ n: 1, pinned: false }, { n: 2, pinned: true }, { n: 3, pinned: false }, { n: 4, pinned: true }]);
    expect(out.map((x) => x.n)).toEqual([2, 4, 1, 3]);
  });
});

const tx = (id: string, kind: 'in' | 'out', amt: number, date: string, extra: Partial<Transaction> = {}) =>
  ({ id, kind, amt, date, by: 'm1', desc: { es: '', en: '' }, proof: null, proofKind: 'receipt', ...extra }) as Transaction;

describe('ledger helpers', () => {
  const all = [tx('a', 'in', 100, '2026-10-01'), tx('b', 'out', 30, '2026-10-05'), tx('c', 'in', 50, '2025-01-01'), tx('d', 'out', 10, '2026-09-20')];
  it('sorts newest first', () => {
    expect(sortTxNewestFirst(all).map((x) => x.id)).toEqual(['b', 'a', 'd', 'c']);
  });
  it('filters by kind and date window', () => {
    expect(filterTx(all, 'all', 'all')).toHaveLength(4);
    expect(filterTx(all, 'in', 'all').map((x) => x.id)).toEqual(['a', 'c']);
    expect(filterTx(all, 'all', '30').map((x) => x.id)).toEqual(['a', 'b', 'd']);
    expect(filterTx(all, 'out', '30').map((x) => x.id)).toEqual(['b', 'd']);
  });
  it('totals income, expense and balance', () => {
    expect(ledgerTotals(all)).toEqual({ income: 150, expense: 40, balance: 110 });
    expect(ledgerTotals([])).toEqual({ income: 0, expense: 0, balance: 0 });
  });
});

describe('contributionTotals', () => {
  const m = (id: string) => ({ id }) as Member;
  it('sums contributor income in cents, splits out this month, and ignores DTV / expenses / anonymous', () => {
    const out = contributionTotals(
      [
        tx('1', 'in', 20, '2026-10-02', { contributor: 'm1' }),
        tx('2', 'in', 5, '2026-03-02', { contributor: 'm1' }),
        tx('3', 'in', 99, '2026-10-02', { contributor: 'm2', category: 'DTV' }),
        tx('4', 'out', 7, '2026-10-02', { contributor: 'm2' }),
        tx('5', 'in', 8, '2026-10-02'),
      ],
      [m('m1'), m('m2')],
    );
    expect(out.map((c) => [c.member.id, c.total, c.month])).toEqual([['m1', 2500, 2000], ['m2', 0, 0]]);
  });
});

describe('filterPalette', () => {
  const items = Array.from({ length: 12 }, (_, i) => ({ group: i < 6 ? 'Nav' : 'Songs', label: `Item ${i}`, sub: i === 7 ? 'special' : '' }));
  it('caps at nine and numbers entries', () => {
    const out = filterPalette(items, '');
    expect(out).toHaveLength(9);
    expect(out[0].idx).toBe('1');
    expect(out[8].idx).toBe('9');
  });
  it('matches on label, group or sub, case-insensitively', () => {
    expect(filterPalette(items, ' ITEM 3 ').map((i) => i.label)).toEqual(['Item 3']);
    expect(filterPalette(items, 'songs')).toHaveLength(6);
    expect(filterPalette(items, 'special').map((i) => i.label)).toEqual(['Item 7']);
  });
});
