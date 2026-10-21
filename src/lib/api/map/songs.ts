/** Read side: map PostgREST rows into songs domain shapes. */
import { Row, groupBy } from '../shared';
import type { LinkKind, Song, Take } from '../../../types';

/* -------------------------------------------------------------------- songs */
export function mapSongs(rows: Row[], songInstruments: Row[], songLinks: Row[]): Song[] {
  const instrBySong = groupBy(songInstruments, 'song_id');
  const linksBySong = groupBy(songLinks, 'song_id');
  return rows.map((s) => ({
    id: s.id,
    title: s.title_es ?? s.title_en,
    genre: s.genre,
    key: s.key,
    bpm: s.bpm,
    dur: s.duration,
    instruments: (instrBySong.get(s.id) ?? []).map((r) => r.instrument_id),
    links: (linksBySong.get(s.id) ?? [])
      .sort((a, b) => a.position - b.position)
      .map((l) => ({ kind: l.kind as LinkKind, label: { es: l.label_es, en: l.label_en }, url: l.url })),
  }));
}

/* ------------------------------------------------------------------- takes */
export function mapTakes(rows: Row[]): Take[] {
  return rows.map((r) => ({
    id: r.id,
    eventId: r.event_id,
    songId: r.song_id,
    url: r.url,
    n: r.n,
  }));
}
