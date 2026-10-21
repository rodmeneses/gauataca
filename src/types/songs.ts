/** Songs, genres and song links. */
import type { Localized } from './app';

export type GenreId = 'joropo' | 'llanera' | 'gaita' | 'tambor' | 'calipso' | 'balada' | 'merengue' | 'guacharaca' | 'vals' | 'lirica' | 'tonada' | 'pop' | 'otra' | 'instrumental';

export interface Genre {
  id: GenreId;
  label: Localized;
  short: string;
  color: string;
}

/** What a song link points at — drives the icon and grouping on the card. */
export type LinkKind = 'youtube' | 'apple' | 'spotify' | 'metronome' | 'chart';

/** A link attached to a song (real-version streaming or tabs/sheet music). */
export interface SongLink {
  kind: LinkKind;
  label: Localized;
  url: string;
}

export interface Song {
  id: string;
  title: string;
  genre: GenreId;
  key: string;
  bpm: number;
  dur: string; // "m:ss"
  /** Instrument catalog ids this song requires (optional). */
  instruments?: string[];
  /** Streaming + chart links (any number of each kind). */
  links: SongLink[];
}

/** Repertoire sort: most recorded (default), by name, or fewest takes. */
export type SongSort = 'recorded' | 'name' | 'takes';
