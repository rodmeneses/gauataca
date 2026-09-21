/**
 * Global search across events, songs, fund movements and brainstorm ideas.
 * Pure: takes the already-built view-models and returns a flat, typed list.
 */

export type SearchKind = 'event' | 'song' | 'fund' | 'idea';

export interface SearchHit {
  kind: SearchKind;
  id: string;
  title: string;
  sub: string;
}

/** The slice of each view-model the search reads. `date` is ISO (YYYY-MM-DD) and drives the newest-first order. */
export interface SearchSources {
  events: { id: string; date: string; title: string; venue: string; note: string; typeLabel: string; dateStr: string }[];
  songs: { id: string; title: string; genreLabel: string; key: string }[];
  tx: {
    id: string;
    date: string;
    desc: string;
    dateStr: string;
    amountStr: string;
    by: string;
    categoryLabel: string | null;
    eventLabel: string | null;
    gearLabel: string | null;
  }[];
  /** Forum ideas; `comments` is every comment and reply, flattened. */
  threads: {
    id: string;
    date: string;
    title: string;
    body: string;
    author: string;
    dateStr: string;
    comments: { text: string; author: string; date: string }[];
  }[];
}

/** Max results per type, so one noisy type can't push the others off-screen. */
export const SEARCH_LIMIT_PER_KIND = 8;

/** Lowercase + strip accents so "cancion" finds "Canción" (the band writes in Spanish). */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Newest first. ISO dates sort lexicographically. */
function newestFirst<T extends { date: string }>(a: T, b: T): number {
  return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
}

/** One-line preview of a comment for the result's sub line. */
function snippet(text: string, max = 90): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? flat.slice(0, max - 1) + '…' : flat;
}

/** Every whitespace-separated term of the query must appear somewhere in the haystack. */
function matches(terms: string[], fields: (string | null | undefined)[]): boolean {
  const hay = normalize(fields.filter(Boolean).join(' '));
  return terms.every((term) => hay.includes(term));
}

/** Ordered by type (events, songs, fund, ideas), newest first within each type. Empty query → no results. */
export function searchAll(query: string, src: SearchSources): SearchHit[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const events = src.events
    .filter((e) => matches(terms, [e.title, e.venue, e.note, e.typeLabel, e.dateStr]))
    .sort(newestFirst)
    .slice(0, SEARCH_LIMIT_PER_KIND)
    .map((e): SearchHit => ({ kind: 'event', id: e.id, title: e.title, sub: [e.dateStr, e.venue].filter(Boolean).join(' · ') }));

  const songs = src.songs
    .filter((s) => matches(terms, [s.title, s.genreLabel, s.key]))
    .slice(0, SEARCH_LIMIT_PER_KIND)
    .map((s): SearchHit => ({ kind: 'song', id: s.id, title: s.title, sub: [s.genreLabel, s.key].filter(Boolean).join(' · ') }));

  const fund = src.tx
    .filter((x) => matches(terms, [x.desc, x.categoryLabel, x.eventLabel, x.gearLabel, x.by, x.dateStr, x.amountStr]))
    .sort(newestFirst)
    .slice(0, SEARCH_LIMIT_PER_KIND)
    .map((x): SearchHit => ({ kind: 'fund', id: x.id, title: x.desc, sub: [x.dateStr, x.amountStr].join(' · ') }));

  // One hit per idea. If only a comment matches, show that comment and rank by its date.
  const ideas = src.threads
    .flatMap((b): (SearchHit & { date: string })[] => {
      if (matches(terms, [b.title, b.body, b.author])) {
        return [{ kind: 'idea', id: b.id, date: b.date, title: b.title, sub: [b.author, b.dateStr].filter(Boolean).join(' · ') }];
      }
      const c = b.comments.filter((c) => matches(terms, [c.text, c.author])).sort(newestFirst)[0];
      return c ? [{ kind: 'idea', id: b.id, date: c.date, title: b.title, sub: `${c.author}: ${snippet(c.text)}` }] : [];
    })
    .sort(newestFirst)
    .slice(0, SEARCH_LIMIT_PER_KIND);

  return [...events, ...songs, ...fund, ...ideas];
}
