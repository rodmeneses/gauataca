/**
 * Tiny typed wrapper over localStorage for the handful of preferences that
 * must survive a reload (theme, language). Every access is guarded — private
 * windows, disabled storage and quota errors must never break the app.
 *
 * The theme is also read by an inline bootstrap script in index.html (kept in
 * sync with THEME_KEY) so the correct `data-theme` is on <html> before React
 * mounts and there is no flash.
 */
import type { Lang } from '../types';

export type ThemePref = 'light' | 'dark' | 'system';

export const THEME_KEY = 'guataca.theme';
export const LANG_KEY = 'guataca.lang';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore — storage unavailable or full */
  }
}

export function readThemePref(): ThemePref {
  const v = read(THEME_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

export function writeThemePref(v: ThemePref): void {
  write(THEME_KEY, v);
}

export function readLangPref(): Lang | null {
  const v = read(LANG_KEY);
  return v === 'es' || v === 'en' ? v : null;
}

export function writeLangPref(v: Lang): void {
  write(LANG_KEY, v);
}

/** `true` when the OS currently asks for a dark UI. */
export function prefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return true; // GUATACA's historical default
  }
}

/** Resolve a preference to the concrete theme to paint right now. */
export function resolveTheme(pref: ThemePref): 'light' | 'dark' {
  if (pref === 'system') return prefersDark() ? 'dark' : 'light';
  return pref;
}

/** Apply the resolved theme to <html> and the address-bar colour. */
export function applyTheme(pref: ThemePref): void {
  const resolved = resolveTheme(pref);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#020617' : '#eef2f7');
}
