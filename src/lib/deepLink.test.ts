import { describe, it, expect, beforeEach } from 'vitest';
import { readDeepLink, clearDeepLink, itemUrl } from './deepLink';

function setUrl(url: string) {
  window.history.replaceState(null, '', url);
}

beforeEach(() => {
  setUrl('/');
});

describe('readDeepLink', () => {
  it('returns null when no shareable param is present', () => {
    setUrl('/?foo=bar');
    expect(readDeepLink()).toBeNull();
  });

  it('reads an event id', () => {
    setUrl('/?event=abc123');
    expect(readDeepLink()).toEqual({ kind: 'event', id: 'abc123' });
  });

  it('reads a song id', () => {
    setUrl('/?song=s1');
    expect(readDeepLink()).toEqual({ kind: 'song', id: 's1' });
  });

  it('reads a tx id', () => {
    setUrl('/?tx=t1');
    expect(readDeepLink()).toEqual({ kind: 'tx', id: 't1' });
  });

  it('prefers event over song/tx when multiple are present', () => {
    setUrl('/?tx=t1&event=e1&song=s1');
    expect(readDeepLink()).toEqual({ kind: 'event', id: 'e1' });
  });
});

describe('clearDeepLink', () => {
  it('removes the shareable params but keeps others', () => {
    setUrl('/?foo=bar&event=e1');
    clearDeepLink();
    expect(window.location.search).toBe('?foo=bar');
  });

  it('drops the query string entirely when nothing else remains', () => {
    setUrl('/?event=e1');
    clearDeepLink();
    expect(window.location.search).toBe('');
  });
});

describe('itemUrl', () => {
  it('builds an absolute shareable url with the id encoded', () => {
    const url = itemUrl('song', 'a b/c');
    expect(url).toBe(`${window.location.origin}${window.location.pathname}?song=a%20b%2Fc`);
  });
});
