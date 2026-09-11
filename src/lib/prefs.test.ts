import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  THEME_KEY, LANG_KEY, readThemePref, writeThemePref, readLangPref, writeLangPref,
  prefersDark, resolveTheme, applyTheme,
} from './prefs';

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('theme pref', () => {
  it('defaults to system when unset', () => {
    expect(readThemePref()).toBe('system');
  });

  it('round-trips a written value', () => {
    writeThemePref('dark');
    expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(readThemePref()).toBe('dark');
  });

  it('falls back to system for a garbage stored value', () => {
    window.localStorage.setItem(THEME_KEY, 'neon');
    expect(readThemePref()).toBe('system');
  });

  it('read/write survive localStorage throwing', () => {
    const spy = vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readThemePref()).toBe('system');
    spy.mockRestore();
  });
});

describe('lang pref', () => {
  it('defaults to null when unset', () => {
    expect(readLangPref()).toBeNull();
  });

  it('round-trips es/en', () => {
    writeLangPref('en');
    expect(window.localStorage.getItem(LANG_KEY)).toBe('en');
    expect(readLangPref()).toBe('en');
  });

  it('returns null for a garbage stored value', () => {
    window.localStorage.setItem(LANG_KEY, 'fr');
    expect(readLangPref()).toBeNull();
  });
});

describe('prefersDark', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reflects matchMedia', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    expect(prefersDark()).toBe(true);
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    expect(prefersDark()).toBe(false);
  });

  it('defaults to true when matchMedia throws', () => {
    vi.stubGlobal('matchMedia', () => {
      throw new Error('unsupported');
    });
    expect(prefersDark()).toBe(true);
  });
});

describe('resolveTheme', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('passes through light/dark unchanged', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('resolves system via prefersDark', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    expect(resolveTheme('system')).toBe('dark');
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    expect(resolveTheme('system')).toBe('light');
  });
});

describe('applyTheme', () => {
  it('sets data-theme on <html> and the theme-color meta', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);

    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(meta.getAttribute('content')).toBe('#020617');

    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(meta.getAttribute('content')).toBe('#eef2f7');

    meta.remove();
  });

  it('is a no-op on the meta tag when none exists', () => {
    expect(() => applyTheme('dark')).not.toThrow();
  });
});
