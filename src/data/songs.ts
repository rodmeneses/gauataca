import type { Genre, GenreId } from '../types';

export const GENRES: Record<GenreId, Genre> = {
  joropo: { id: 'joropo', label: { es: 'Joropo llanero', en: 'Joropo llanero' }, short: 'Joropo', color: 'var(--color-emerald)' },
  llanera: { id: 'llanera', label: { es: 'Llanera contemporánea', en: 'Contemporary llanera' }, short: 'Llanera', color: 'var(--color-sky)' },
  gaita: { id: 'gaita', label: { es: 'Gaita zuliana', en: 'Gaita zuliana' }, short: 'Gaita', color: 'var(--color-violet-light)' },
  tambor: { id: 'tambor', label: { es: 'Tambores de la costa', en: 'Coastal drums' }, short: 'Tambores', color: 'var(--color-orange)' },
  calipso: { id: 'calipso', label: { es: 'Calipso de El Callao', en: 'Calipso de El Callao' }, short: 'Calipso', color: 'var(--color-amber)' },
  balada: { id: 'balada', label: { es: 'Balada', en: 'Ballad' }, short: 'Balada', color: 'var(--color-pink)' },
  merengue: { id: 'merengue', label: { es: 'Merengue', en: 'Merengue' }, short: 'Merengue', color: 'var(--color-red)' },
  guacharaca: { id: 'guacharaca', label: { es: 'Guacharaca', en: 'Guacharaca' }, short: 'Guacharaca', color: 'var(--color-teal)' },
  vals: { id: 'vals', label: { es: 'Vals', en: 'Waltz' }, short: 'Vals', color: 'var(--color-blue)' },
  lirica: { id: 'lirica', label: { es: 'Lírica', en: 'Lyrical' }, short: 'Lírica', color: 'var(--color-fuchsia)' },
  tonada: { id: 'tonada', label: { es: 'Tonada llanera', en: 'Tonada llanera' }, short: 'Tonada', color: 'var(--color-violet)' },
  pop: { id: 'pop', label: { es: 'Pop', en: 'Pop' }, short: 'Pop', color: 'var(--color-rose)' },
  otra: { id: 'otra', label: { es: 'Otra', en: 'Other' }, short: 'Otra', color: 'var(--color-ink-meta)' },
  instrumental: { id: 'instrumental', label: { es: 'Instrumental', en: 'Instrumental' }, short: 'Instrumental', color: 'var(--color-emerald-light)' },
};

export const GENRE_IDS = Object.keys(GENRES) as GenreId[];
