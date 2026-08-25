import type { Genre, GenreId, Song } from '../types';

export const GENRES: Record<GenreId, Genre> = {
  joropo: { id: 'joropo', label: { es: 'Joropo llanero', en: 'Joropo llanero' }, short: 'Joropo', color: '#34d399' },
  llanera: { id: 'llanera', label: { es: 'Llanera contemporánea', en: 'Contemporary llanera' }, short: 'Llanera', color: '#38bdf8' },
  gaita: { id: 'gaita', label: { es: 'Gaita zuliana', en: 'Gaita zuliana' }, short: 'Gaita', color: '#a78bfa' },
  tambor: { id: 'tambor', label: { es: 'Tambores de la costa', en: 'Coastal drums' }, short: 'Tambores', color: '#fb923c' },
  calipso: { id: 'calipso', label: { es: 'Calipso de El Callao', en: 'Calipso de El Callao' }, short: 'Calipso', color: '#fbbf24' },
};

export const GENRE_IDS = Object.keys(GENRES) as GenreId[];

// [id, title, genre, key, bpm, duration, lastRehearsed]
const RAW: [string, string, GenreId, string, number, string, string][] = [
  ['s1', 'Alma Llanera', 'joropo', 'Em', 184, '3:52', '2026-08-15'],
  ['s2', 'Pajarillo', 'joropo', 'Am', 212, '5:10', '2026-08-15'],
  ['s3', 'Seis por Derecho', 'joropo', 'D', 224, '4:05', '2026-07-18'],
  ['s4', 'Quirpa', 'joropo', 'Am', 208, '3:40', '2026-08-08'],
  ['s5', 'Zumba que Zumba', 'joropo', 'Em', 200, '3:15', '2026-06-20'],
  ['s6', 'Carmentea', 'joropo', 'G', 196, '3:28', '2026-08-08'],
  ['s7', 'El Gavilán', 'joropo', 'Dm', 216, '4:44', '2026-05-30'],
  ['s8', 'Concierto en la Llanura', 'joropo', 'Am', 190, '4:20', '2026-08-15'],
  ['s9', 'Caballo Viejo', 'llanera', 'Am', 122, '4:12', '2026-08-15'],
  ['s10', 'Tonada de Luna Llena', 'llanera', 'Dm', 68, '3:30', '2026-08-08'],
  ['s11', 'Sabana', 'llanera', 'F', 96, '4:02', '2026-07-26'],
  ['s12', 'Mi Querencia', 'llanera', 'G', 88, '3:44', '2026-06-14'],
  ['s13', 'La Vaca Mariposa', 'llanera', 'C', 132, '2:58', '2026-08-08'],
  ['s14', 'Sentir Zuliano', 'gaita', 'Am', 138, '3:20', '2025-12-20'],
  ['s15', 'La Grey Zuliana', 'gaita', 'Dm', 142, '3:35', '2025-12-20'],
  ['s16', 'Amparito', 'gaita', 'G', 136, '3:10', '2025-12-14'],
  ['s17', 'Ronda Antañona', 'gaita', 'C', 130, '3:26', '2025-12-14'],
  ['s18', 'Maracaibo en la Noche', 'gaita', 'Em', 134, '3:48', '2025-12-06'],
  ['s19', 'San Juan Todo lo Tiene', 'tambor', 'Dm', 108, '5:30', '2026-06-24'],
  ['s20', 'Malembe', 'tambor', 'Am', 100, '4:50', '2026-06-24'],
  ['s21', 'Sangueo de Curiepe', 'tambor', 'Em', 104, '6:10', '2026-07-18'],
  ['s22', 'Calipso del Callao', 'calipso', 'G', 118, '4:00', '2026-08-08'],
  ['s23', 'Guasipati', 'calipso', 'C', 116, '3:36', '2026-07-26'],
  ['s24', 'El Callao Suena', 'calipso', 'F', 120, '3:52', '2026-05-16'],
];

export const SONGS: Song[] = RAW.map(([id, title, genre, key, bpm, dur, last]) => ({ id, title, genre, key, bpm, dur, last }));
