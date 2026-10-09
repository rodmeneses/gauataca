/** Song and recording ("take") view-models. */
import { GENRES } from '../../data';
import { d, days, fmt, rel } from '../../lib/format';
import type { BandEvent, GenreId, LinkKind, Song, Take } from '../../types';
import { L, tint } from './common';
import type { Ctx } from './common';

/* ------------------------------------------------------------------ songs */
export interface RehearsalLog {
  id: string;
  title: string;
  date: string;
  typeLabel: string;
}

/** A song link with its label already localized. */
export interface SongLinkVm {
  kind: LinkKind;
  label: string;
  url: string;
}

/** Stable display order for streaming links (chart links keep their position). */
const KIND_ORDER: Record<LinkKind, number> = { youtube: 0, apple: 1, spotify: 2, metronome: 3, chart: 4 };

export interface SongVm {
  id: string;
  title: string;
  genre: GenreId;
  genreLabel: string;
  genreShort: string;
  genreColor: string;
  genreBg: string;
  key: string;
  bpm: string;
  dur: string;
  /** "Hace 10 días" / "Never rehearsed" */
  lastLabel: string;
  /** "sáb 15 ago 2026" or "—" */
  lastDate: string;
  staleColor: string;
  staleBg: string;
  isStale: boolean;
  open: boolean;
  /** Streaming links (YouTube / Apple Music / Spotify), synthesized when a kind is missing. */
  streaming: SongLinkVm[];
  hasStreaming: boolean;
  /** Tabs / sheet-music links (several possible). */
  charts: SongLinkVm[];
  hasCharts: boolean;
  logs: RehearsalLog[];
  logCount: number;
  /** Localized names of the instruments this song requires. */
  instruments: string[];
  hasInstruments: boolean;
  /** Recordings ("takes") of this song, oldest first. */
  takes: TakeVm[];
  hasTakes: boolean;
  /** Number of takes (drives the repertoire sort). */
  takeCount: number;
}

export function songVm(s: Song, allEvents: BandEvent[], openSong: string | null, ctx: Ctx): SongVm {
  const { lang, t } = ctx;
  const g = GENRES[s.genre];
  // "Last rehearsed" is derived, not stored: the most recent confirmed (settled)
  // event whose setlist includes this song. A song only counts as rehearsed once
  // its event has been confirmed into the ledger (see the "derived, not stored" note).
  const rehearsals = allEvents
    .filter((e) => (e.setlist || []).includes(s.id) && e.settled)
    .sort((a, b) => d(b.date).getTime() - d(a.date).getTime());
  const last = rehearsals[0]?.date ?? null;
  const gap = last ? -days(last) : 9999;
  const stale = gap > ctx.staleDays;
  const veryStale = gap > 90;
  const logs = rehearsals.map((e) => ({ id: e.id, title: L(lang, e.title), date: fmt(e.date, lang, true), typeLabel: t[e.type] }));
  const songInstruments = (s.instruments || []).map((id) => {
    const inst = ctx.instruments.find((x) => x.id === id);
    return inst ? L(lang, inst.name) : id;
  });
  const takes = (ctx.takes ?? [])
    .filter((tk) => tk.songId === s.id)
    .sort((a, b) => a.n - b.n)
    .map((tk) => {
      const ev = allEvents.find((x) => x.id === tk.eventId);
      return takeVm(tk, s.title, ev ? fmt(ev.date, lang, true) : '', ctx);
    });
  const links: SongLinkVm[] = (s.links ?? []).map((l) => ({ kind: l.kind, label: L(lang, l.label), url: l.url }));
  const streaming = links.filter((l) => l.kind !== 'chart').sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
  const charts = links.filter((l) => l.kind === 'chart');
  return {
    id: s.id,
    title: s.title,
    genre: s.genre,
    genreLabel: L(lang, g.label),
    genreShort: g.short,
    genreColor: g.color,
    genreBg: tint(g.color),
    key: s.key,
    bpm: String(s.bpm),
    dur: s.dur,
    lastLabel: last ? rel(last, lang) : t.neverRehearsed,
    lastDate: last ? fmt(last, lang, true) : '—',
    staleColor: veryStale ? 'var(--color-rose)' : stale ? 'var(--color-amber)' : 'var(--color-emerald)',
    staleBg: veryStale ? tint('var(--color-rose)') : stale ? tint('var(--color-amber)') : tint('var(--color-emerald)'),
    isStale: stale,
    open: openSong === s.id,
    streaming,
    hasStreaming: streaming.length > 0,
    charts,
    hasCharts: charts.length > 0,
    logs,
    logCount: logs.length,
    instruments: songInstruments,
    hasInstruments: songInstruments.length > 0,
    takes,
    hasTakes: takes.length > 0,
    takeCount: takes.length,
  };
}

/* ------------------------------------------------------------------- takes */
export interface TakeVm {
  id: string;
  songId: string;
  songTitle: string;
  url: string;
  /** "Toma 1" / "Take 1" */
  label: string;
  /** Date of the practice event the take came from. */
  dateStr: string;
}

export function takeVm(tk: Take, songTitle: string, dateStr: string, ctx: Ctx): TakeVm {
  const { t } = ctx;
  return {
    id: tk.id,
    songId: tk.songId,
    songTitle,
    url: tk.url,
    label: t.takeN.replace('%d', String(tk.n)),
    dateStr,
  };
}
