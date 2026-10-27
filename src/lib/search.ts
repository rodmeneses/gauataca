/**
 * Global search across events, songs, fund movements, brainstorm ideas, idea polls, availability polls
 * and band links.
 * Pure: takes the already-built view-models and returns a flat, typed list.
 */

export type SearchKind = 'event' | 'song' | 'fund' | 'idea' | 'poll' | 'availability' | 'link';

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
  /** Polls attached to forum ideas; `id` is the idea's id (a poll hit opens its idea). */
  polls: { id: string; date: string; question: string; options: string[]; threadTitle: string; author: string }[];
  /** Availability ("which date works?") polls; `date` is the first candidate's, `slots` the formatted candidates. */
  availability: { id: number; date: string; title: string; slots: string[]; status: string }[];
  /** Shared band links. */
  links: { id: number; title: string; url: string; categoryLabel: string; by: string }[];
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

/** Levenshtein distance, bailing out as soon as it must exceed `max` (returns max + 1). */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** Typos tolerated in a term: none for short terms (too many false hits), 1 from 4 letters, 2 from 8. */
const typoBudget = (term: string): number => (term.length >= 8 ? 2 : term.length >= 4 ? 1 : 0);

/** Does some word in the haystack look like `term` — or start like it, so a half-typed word still hits? */
function fuzzyHit(term: string, words: string[]): boolean {
  const max = typoBudget(term);
  if (max === 0) return false;
  return words.some((w) => editDistance(term, w, max) <= max || editDistance(term, w.slice(0, term.length), max) <= max);
}

/** 2 = every term appears verbatim, 1 = every term appears or is a near-typo of a word, 0 = no match. */
type Score = 0 | 1 | 2;

function matchScore(terms: string[], fields: (string | null | undefined)[]): Score {
  const hay = normalize(fields.filter(Boolean).join(' '));
  if (terms.every((term) => hay.includes(term))) return 2;
  const words = hay.split(/[^a-z0-9]+/).filter(Boolean);
  return terms.every((term) => hay.includes(term) || fuzzyHit(term, words)) ? 1 : 0;
}

/** Keep scored items, best match first; the sort is stable so callers' newest-first order breaks ties. */
function rank<T>(items: { item: T; score: Score }[]): T[] {
  return items.filter((x) => x.score > 0).sort((a, b) => b.score - a.score).map((x) => x.item);
}

export interface SearchOptions {
  /** Restrict to one type; it then gets `SEARCH_LIMIT_SINGLE_KIND` results instead of the per-type cap. */
  kind?: SearchKind | 'all';
}

/** Cap when a single type is selected: the whole point of filtering is to see more of it. */
export const SEARCH_LIMIT_SINGLE_KIND = 50;

/**
 * Ordered by type (events, songs, fund, ideas, polls, availability, links). Within a type, verbatim matches come
 * before typo-tolerant ones, then newest first. Empty query → no results.
 */
export function searchAll(query: string, src: SearchSources, opts: SearchOptions = {}): SearchHit[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const only = opts.kind && opts.kind !== 'all' ? opts.kind : null;
  const limit = only ? SEARCH_LIMIT_SINGLE_KIND : SEARCH_LIMIT_PER_KIND;
  const want = (k: SearchKind) => !only || only === k;
  const scored = <T>(items: T[], fields: (item: T) => (string | null | undefined)[]) =>
    items.map((item) => ({ item, score: matchScore(terms, fields(item)) }));

  const events = !want('event') ? [] : rank(scored(src.events.slice().sort(newestFirst), (e) => [e.title, e.venue, e.note, e.typeLabel, e.dateStr]))
    .slice(0, limit)
    .map((e): SearchHit => ({ kind: 'event', id: e.id, title: e.title, sub: [e.dateStr, e.venue].filter(Boolean).join(' · ') }));

  const songs = !want('song') ? [] : rank(scored(src.songs, (s) => [s.title, s.genreLabel, s.key]))
    .slice(0, limit)
    .map((s): SearchHit => ({ kind: 'song', id: s.id, title: s.title, sub: [s.genreLabel, s.key].filter(Boolean).join(' · ') }));

  const fund = !want('fund') ? [] : rank(scored(src.tx.slice().sort(newestFirst), (x) => [x.desc, x.categoryLabel, x.eventLabel, x.gearLabel, x.by, x.dateStr, x.amountStr]))
    .slice(0, limit)
    .map((x): SearchHit => ({ kind: 'fund', id: x.id, title: x.desc, sub: [x.dateStr, x.amountStr].join(' · ') }));

  // One hit per idea. If only a comment matches, show that comment and rank by its date.
  const ideas = !want('idea') ? [] : rank(
    src.threads.flatMap((b) => {
      const own = matchScore(terms, [b.title, b.body, b.author]);
      if (own > 0) {
        const hit: SearchHit & { date: string } = { kind: 'idea', id: b.id, date: b.date, title: b.title, sub: [b.author, b.dateStr].filter(Boolean).join(' · ') };
        return [{ item: hit, score: own }];
      }
      const c = b.comments
        .map((c) => ({ c, score: matchScore(terms, [c.text, c.author]) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || (a.c.date < b.c.date ? 1 : a.c.date > b.c.date ? -1 : 0))[0];
      if (!c) return [];
      const hit: SearchHit & { date: string } = { kind: 'idea', id: b.id, date: c.c.date, title: b.title, sub: `${c.c.author}: ${snippet(c.c.text)}` };
      return [{ item: hit, score: c.score }];
    }).sort((a, b) => newestFirst(a.item, b.item)),
  )
    .slice(0, limit)
    .map(({ date: _date, ...hit }): SearchHit => hit);

  const polls = !want('poll') ? [] : rank(scored(src.polls.slice().sort(newestFirst), (p) => [p.question, ...p.options]))
    .slice(0, limit)
    .map((p): SearchHit => ({ kind: 'poll', id: p.id, title: p.question, sub: [p.threadTitle, p.options.join(' / ')].filter(Boolean).join(' · ') }));

  const availability = !want('availability') ? [] : rank(scored(src.availability.slice().sort(newestFirst), (a) => [a.title, a.status, ...a.slots]))
    .slice(0, limit)
    .map((a): SearchHit => ({ kind: 'availability', id: String(a.id), title: a.title, sub: [a.status, ...a.slots].filter(Boolean).join(' · ') }));

  const links = !want('link') ? [] : rank(scored(src.links, (l) => [l.title, l.url, l.categoryLabel, l.by]))
    .slice(0, limit)
    .map((l): SearchHit => ({ kind: 'link', id: String(l.id), title: l.title, sub: [l.categoryLabel, l.url.replace(/^https?:\/\//, '')].filter(Boolean).join(' · ') }));

  return [...events, ...songs, ...fund, ...ideas, ...polls, ...availability, ...links];
}
