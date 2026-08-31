import type { Lang } from '../types';
import { T } from '../i18n';

/** "Now" for relative dates. Live mode uses the real clock; the mock data is dated around 2026-08. */
export const TODAY = new Date();

export function d(iso: string): Date {
  return new Date(iso + 'T12:00:00');
}

/** Whole days from TODAY to `iso` (negative = past). */
export function days(iso: string): number {
  return Math.round((d(iso).getTime() - TODAY.getTime()) / 86400000);
}

const DOW: Record<Lang, string[]> = {
  es: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};
const MON: Record<Lang, string[]> = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** "vie 12 sep" / "Fri Sep 12" (+ year when requested). */
export function fmt(iso: string, lang: Lang, withYear = false): string {
  const dt = d(iso);
  const dow = DOW[lang][dt.getDay()];
  const mo = MON[lang][dt.getMonth()];
  const day = dt.getDate();
  const core = lang === 'es' ? `${dow} ${day} ${mo}` : `${dow} ${mo} ${day}`;
  return withYear ? `${core} ${dt.getFullYear()}` : core;
}

/** Short month label ("sep" / "Sep"). */
export function monthShort(iso: string, lang: Lang): string {
  return MON[lang][d(iso).getMonth()];
}

/** Relative label: Today / Tomorrow / In N days / N days ago. */
export function rel(iso: string, lang: Lang): string {
  const n = days(iso);
  const t = T[lang];
  if (n === 0) return t.today;
  if (n === 1) return t.tomorrow;
  if (n > 0) return t.inDays.replace('%d', String(n));
  return t.daysAgo.replace('%d', String(-n));
}

/** "$1,112.70" (sign-prefixed when negative). */
export function money(n: number): string {
  return (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "$305" — whole dollars, unsigned. */
export function money0(n: number): string {
  return '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** "3:52" → seconds. */
export function durationSeconds(dur: string): number {
  const [m, s] = dur.split(':');
  return (+m || 0) * 60 + (+s || 0);
}
