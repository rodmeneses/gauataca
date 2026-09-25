import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CHANGELOG, APP_VERSION, entriesSince } from './changelog';

describe('changelog', () => {
  it('top entry matches package.json version', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(APP_VERSION).toBe(pkg.version);
  });

  it('has unique versions and both languages for every line', () => {
    expect(new Set(CHANGELOG.map((e) => e.version)).size).toBe(CHANGELOG.length);
    for (const e of CHANGELOG) {
      expect(e.title.es && e.title.en).toBeTruthy();
      for (const c of e.changes) expect(c.es && c.en).toBeTruthy();
    }
  });

  it('returns only entries newer than the seen version', () => {
    expect(entriesSince(APP_VERSION)).toEqual([]);
    expect(entriesSince('0.1.0').map((e) => e.version)).toEqual(CHANGELOG.slice(0, -1).map((e) => e.version));
  });

  it('shows nothing on first visit and only the latest for an unknown version', () => {
    expect(entriesSince(null)).toEqual([]);
    expect(entriesSince('9.9.9')).toEqual([CHANGELOG[0]]);
  });
});
