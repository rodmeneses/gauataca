import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearRecentSearches, MAX_RECENT_SEARCHES, readRecentSearches, rememberSearch, RECENT_SEARCHES_KEY } from './recentSearches';

beforeEach(() => window.localStorage.clear());

describe('recent searches', () => {
  it('starts empty', () => {
    expect(readRecentSearches()).toEqual([]);
  });

  it('remembers newest first and collapses case-insensitive duplicates', () => {
    rememberSearch('joropo');
    rememberSearch('  Festival  ');
    expect(rememberSearch('JOROPO')).toEqual(['JOROPO', 'Festival']);
    expect(readRecentSearches()).toEqual(['JOROPO', 'Festival']);
  });

  it('ignores blank queries and squeezes inner whitespace', () => {
    expect(rememberSearch('   ')).toEqual([]);
    expect(rememberSearch('alma   llanera')).toEqual(['alma llanera']);
  });

  it('keeps only the most recent few', () => {
    for (let i = 0; i < MAX_RECENT_SEARCHES + 3; i++) rememberSearch(`q${i}`);
    const list = readRecentSearches();
    expect(list).toHaveLength(MAX_RECENT_SEARCHES);
    expect(list[0]).toBe(`q${MAX_RECENT_SEARCHES + 2}`);
  });

  it('clears', () => {
    rememberSearch('a');
    clearRecentSearches();
    expect(readRecentSearches()).toEqual([]);
  });

  it('survives corrupt or wrongly-shaped storage', () => {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, '{not json');
    expect(readRecentSearches()).toEqual([]);
    window.localStorage.setItem(RECENT_SEARCHES_KEY, '{"a":1}');
    expect(readRecentSearches()).toEqual([]);
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(['ok', 5, null]));
    expect(readRecentSearches()).toEqual(['ok']);
  });

  it('never throws when storage is unavailable', () => {
    const boom = () => { throw new Error('denied'); };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(boom);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(boom);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(boom);
    expect(readRecentSearches()).toEqual([]);
    expect(rememberSearch('x')).toEqual(['x']);
    expect(() => clearRecentSearches()).not.toThrow();
    vi.restoreAllMocks();
  });
});
