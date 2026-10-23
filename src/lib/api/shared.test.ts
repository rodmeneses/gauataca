import { describe, expect, it } from 'vitest';
import { groupBy, initials, newId, shortName } from './shared';

describe('shared helpers', () => {
  it('groups rows by key and skips null keys', () => {
    const m = groupBy([{ k: 'a', v: 1 }, { k: 'a', v: 2 }, { k: null, v: 3 }, { k: 'b', v: 4 }], 'k');
    expect(m.get('a')).toHaveLength(2);
    expect(m.get('b')).toHaveLength(1);
    expect(m.size).toBe(2);
  });
  it('derives short names and initials', () => {
    expect(shortName('Ana Maria')).toBe('Ana');
    expect(initials('ana maria lopez')).toBe('AM');
    expect(initials('bo')).toBe('B');
  });
  it('generates prefixed, distinct ids', () => {
    const a = newId('x');
    expect(a.startsWith('x')).toBe(true);
    expect(newId('x')).not.toBe(a);
  });
});
