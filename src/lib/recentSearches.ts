/**
 * The last few global-search queries, kept in localStorage so the search overlay can offer
 * them again. Every access is guarded — storage can be unavailable (private windows) or full.
 */
export const RECENT_SEARCHES_KEY = 'guataca.recentSearches';
export const MAX_RECENT_SEARCHES = 6;

export function readRecentSearches(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((q): q is string => typeof q === 'string').slice(0, MAX_RECENT_SEARCHES) : [];
  } catch {
    return [];
  }
}

function write(list: string[]): void {
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
  } catch {
    /* ignore — storage unavailable or full */
  }
}

/** Remember a query (most recent first, no case-insensitive duplicates); blank queries are ignored. Returns the new list. */
export function rememberSearch(query: string): string[] {
  const q = query.trim().replace(/\s+/g, ' ');
  const current = readRecentSearches();
  if (!q) return current;
  const next = [q, ...current.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
  write(next);
  return next;
}

export function clearRecentSearches(): void {
  try {
    window.localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    /* ignore */
  }
}
