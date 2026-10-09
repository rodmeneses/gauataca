/**
 * Pure list/aggregate logic behind the `useGuataca` view-model: layout tier,
 * song/ledger filtering, event bucketing, contribution totals and palette
 * filtering. Kept free of React so it is unit-tested (derive.test.ts).
 */
import { d, days, sameMonth } from '../lib/format';
import type { BandEvent, Device, GenreId, Instrument, Member, SongSort, Transaction, TxDate, TxFilter } from '../types';

export type Layout = 'phone' | 'tablet' | 'desktop';

/** `device` is the dev preview override; 'auto' follows the viewport. */
export function layoutTier(device: Device, isMobileViewport: boolean, isTabletViewport: boolean): Layout {
  if (device === 'mobile') return 'phone';
  if (device === 'tablet') return 'tablet';
  if (device === 'desktop') return 'desktop';
  return isMobileViewport ? 'phone' : isTabletViewport ? 'tablet' : 'desktop';
}

/** DB instruments plus locally-added custom ones (skipping ids the DB already has). */
export function mergeInstruments(db: Instrument[], custom: Omit<Instrument, 'isBasic'>[]): Instrument[] {
  const seen = new Set(db.map((i) => i.id));
  return [...db, ...custom.filter((c) => !seen.has(c.id)).map((c) => ({ ...c, isBasic: false }))];
}

interface FilterableSong { title: string; genre: GenreId; genreLabel: string; key: string; isStale: boolean; takeCount: number }

export function filterSongs<S extends FilterableSong>(
  songs: S[],
  opts: { genre: GenreId | 'all'; staleOnly: boolean; query: string; sort: SongSort },
): S[] {
  const q = opts.query.trim().toLowerCase();
  return songs
    .filter(
      (s) =>
        (opts.genre === 'all' || s.genre === opts.genre) &&
        (!opts.staleOnly || s.isStale) &&
        (!q || s.title.toLowerCase().includes(q) || s.genreLabel.toLowerCase().includes(q) || s.key.toLowerCase() === q),
    )
    .sort((a, b) => {
      if (opts.sort === 'name') return a.title.localeCompare(b.title);
      if (opts.sort === 'takes') return a.takeCount - b.takeCount || a.title.localeCompare(b.title);
      return b.takeCount - a.takeCount || a.title.localeCompare(b.title); // 'recorded' (most takes first)
    });
}

/** Upcoming (soonest first), history incl. cancelled (latest first), and the next active event. */
export function bucketEvents(events: BandEvent[]) {
  const upcoming = events.filter((e) => days(e.date) >= 0 && e.state !== 'cancelled').sort((a, b) => d(a.date).getTime() - d(b.date).getTime());
  const history = events.filter((e) => days(e.date) < 0 || e.state === 'cancelled').sort((a, b) => d(b.date).getTime() - d(a.date).getTime());
  const next = upcoming.find((e) => e.state === 'active') ?? null;
  return { upcoming, history, next };
}

/** Pinned items first; Array#sort is stable so the existing order holds within each group. */
export const pinnedFirst = <V extends { pinned: boolean }>(arr: V[]): V[] => [...arr].sort((a, b) => Number(b.pinned) - Number(a.pinned));

/** Newest-first copy of the ledger. */
export const sortTxNewestFirst = (tx: Transaction[]): Transaction[] => [...tx].sort((a, b) => (a.date < b.date ? 1 : -1));

export function filterTx(tx: Transaction[], kind: TxFilter, date: TxDate): Transaction[] {
  return tx.filter((x) => {
    if (kind !== 'all' && x.kind !== kind) return false;
    if (date !== 'all' && days(x.date) < -Number(date)) return false;
    return true;
  });
}

export function ledgerTotals(tx: Transaction[]) {
  const income = tx.filter((x) => x.kind === 'in').reduce((a, b) => a + b.amt, 0);
  const expense = tx.filter((x) => x.kind === 'out').reduce((a, b) => a + b.amt, 0);
  return { income, expense, balance: income - expense };
}

/**
 * Per-member voluntary contributions in cents (all-time and this month). Any income
 * with a contributor counts; DTV income is the org's, never a member's.
 */
export function contributionTotals(tx: Transaction[], members: Member[]): { member: Member; total: number; month: number }[] {
  const byMember = new Map<string, { total: number; month: number }>();
  for (const x of tx) {
    if (x.kind !== 'in' || !x.contributor || x.category === 'DTV') continue;
    const cur = byMember.get(x.contributor) ?? { total: 0, month: 0 };
    cur.total += x.amt * 100;
    if (sameMonth(x.date)) cur.month += x.amt * 100;
    byMember.set(x.contributor, cur);
  }
  return members.map((member) => ({ member, ...(byMember.get(member.id) ?? { total: 0, month: 0 }) }));
}

/** Filter palette entries by label/group/sub, cap at 9 and number them "1".."9". */
export function filterPalette<I extends { group: string; label: string; sub: string }>(items: I[], query: string): (I & { idx: string })[] {
  const q = query.trim().toLowerCase();
  return (q ? items.filter((i) => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q)) : items)
    .slice(0, 9)
    .map((i, n) => ({ ...i, idx: String(n + 1) }));
}
