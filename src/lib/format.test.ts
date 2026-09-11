import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { d, days, sameMonth, fmt, monthShort, rel, money, money0, slug, durationSeconds } from './format';

describe('d', () => {
  it('parses an ISO date at noon local time', () => {
    const dt = d('2026-09-12');
    expect(dt.getFullYear()).toBe(2026);
    expect(dt.getMonth()).toBe(8);
    expect(dt.getDate()).toBe(12);
    expect(dt.getHours()).toBe(12);
  });
});

describe('days / sameMonth / rel (time-dependent)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-10T09:00:00'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('days: 0 for today', () => {
    expect(days('2026-09-10')).toBe(0);
  });

  it('days: positive for the future', () => {
    expect(days('2026-09-13')).toBe(3);
  });

  it('days: negative for the past', () => {
    expect(days('2026-09-05')).toBe(-5);
  });

  it('sameMonth: true within the current month', () => {
    expect(sameMonth('2026-09-30')).toBe(true);
  });

  it('sameMonth: false in a different month', () => {
    expect(sameMonth('2026-10-01')).toBe(false);
  });

  it('rel: today', () => {
    expect(rel('2026-09-10', 'en')).toBe('Today');
    expect(rel('2026-09-10', 'es')).toBe('Hoy');
  });

  it('rel: tomorrow', () => {
    expect(rel('2026-09-11', 'en')).toBe('Tomorrow');
  });

  it('rel: N days in the future', () => {
    expect(rel('2026-09-15', 'en')).toBe('In 5 days');
    expect(rel('2026-09-15', 'es')).toBe('En 5 días');
  });

  it('rel: N days ago', () => {
    expect(rel('2026-09-01', 'en')).toBe('9 days ago');
    expect(rel('2026-09-01', 'es')).toBe('Hace 9 días');
  });
});

describe('fmt', () => {
  it('formats without year in Spanish (dow day month)', () => {
    expect(fmt('2026-09-12', 'es')).toBe('sáb 12 sep');
  });

  it('formats without year in English (dow month day)', () => {
    expect(fmt('2026-09-12', 'en')).toBe('Sat Sep 12');
  });

  it('appends the year when requested', () => {
    expect(fmt('2026-09-12', 'es', true)).toBe('sáb 12 sep 2026');
    expect(fmt('2026-09-12', 'en', true)).toBe('Sat Sep 12 2026');
  });
});

describe('monthShort', () => {
  it('returns the localized short month label', () => {
    expect(monthShort('2026-01-05', 'es')).toBe('ene');
    expect(monthShort('2026-01-05', 'en')).toBe('Jan');
  });
});

describe('money', () => {
  it('formats a positive amount with a dollar sign and 2 decimals', () => {
    expect(money(1112.7)).toBe('$1,112.70');
  });

  it('formats zero as unsigned', () => {
    expect(money(0)).toBe('$0.00');
  });

  it('prefixes negative amounts with -$ and drops the inner sign', () => {
    expect(money(-47.3)).toBe('-$47.30');
  });
});

describe('money0', () => {
  it('formats whole dollars with no decimals', () => {
    expect(money0(305)).toBe('$305');
  });

  it('takes the absolute value (never signed)', () => {
    expect(money0(-305)).toBe('$305');
  });

  it('rounds to the nearest whole dollar', () => {
    expect(money0(305.6)).toBe('$306');
  });
});

describe('slug', () => {
  it('lowercases and hyphenates', () => {
    expect(slug('Hello World')).toBe('hello-world');
  });

  it('strips accents', () => {
    expect(slug('Canción Ñoño')).toBe('cancion-nono');
  });

  it('collapses non-alphanumeric runs and trims edge hyphens', () => {
    expect(slug('  --Foo!! Bar--  ')).toBe('foo-bar');
  });
});

describe('durationSeconds', () => {
  it('parses m:ss into total seconds', () => {
    expect(durationSeconds('3:52')).toBe(232);
  });

  it('handles single-digit seconds', () => {
    expect(durationSeconds('1:05')).toBe(65);
  });

  it('falls back to 0 for missing/invalid parts', () => {
    expect(durationSeconds('')).toBe(0);
    expect(durationSeconds(':')).toBe(0);
  });
});
