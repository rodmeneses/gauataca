import { describe, it, expect } from 'vitest';
import { reorder, rowIndexAt } from './reorder';

describe('reorder', () => {
  it('moves an item forward and backward', () => {
    expect(reorder(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(reorder(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });
  it('returns the same array for no-ops and out-of-range indexes', () => {
    const l = ['a', 'b'];
    expect(reorder(l, 1, 1)).toBe(l);
    expect(reorder(l, -1, 0)).toBe(l);
    expect(reorder(l, 0, 2)).toBe(l);
    expect(reorder(l, 2, 0)).toBe(l);
    expect(reorder(l, 0, -1)).toBe(l);
  });
});

describe('rowIndexAt', () => {
  const rows = [{ top: 0, bottom: 40 }, { top: 45, bottom: 85 }, { top: 90, bottom: 130 }];
  it('picks the row nearest the pointer', () => {
    expect(rowIndexAt(rows, 10)).toBe(0);
    expect(rowIndexAt(rows, 70)).toBe(1);
    expect(rowIndexAt(rows, 500)).toBe(2);
    expect(rowIndexAt(rows, -50)).toBe(0);
  });
  it('returns 0 for no rows', () => {
    expect(rowIndexAt([], 10)).toBe(0);
  });
});
