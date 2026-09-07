/**
 * Shareable deep links: `?event=<id>`, `?song=<id>`, `?tx=<id>`.
 * Parsed once after data loads (see Shell's useDeepLink effect) and then
 * stripped from the URL so a refresh doesn't re-open the item.
 */

export type DeepLinkKind = 'event' | 'song' | 'tx';

export interface DeepLink {
  kind: DeepLinkKind;
  id: string;
}

const KINDS: DeepLinkKind[] = ['event', 'song', 'tx'];

/** Read the first shareable-item param present in the current URL, if any. */
export function readDeepLink(): DeepLink | null {
  const q = new URLSearchParams(window.location.search);
  for (const kind of KINDS) {
    const id = q.get(kind);
    if (id) return { kind, id };
  }
  return null;
}

/** Remove the shareable-item params, preserving any other query params. */
export function clearDeepLink(): void {
  const q = new URLSearchParams(window.location.search);
  for (const kind of KINDS) q.delete(kind);
  const s = q.toString();
  window.history.replaceState(null, '', s ? `${window.location.pathname}?${s}` : window.location.pathname);
}

/** Build the shareable URL for an item (origin + path + `?kind=id`). */
export function itemUrl(kind: DeepLinkKind, id: string): string {
  return `${window.location.origin}${window.location.pathname}?${kind}=${encodeURIComponent(id)}`;
}
