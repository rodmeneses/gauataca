/**
 * Shareable deep links: `?event=<id>`, `?song=<id>`, `?tx=<id>`, `?thread=<id>`
 * (a thread link may add `&comment=<id>` to point at one comment or reply).
 * Parsed once after data loads (see Shell's useDeepLink effect) and then
 * stripped from the URL so a refresh doesn't re-open the item.
 */

export type DeepLinkKind = 'event' | 'song' | 'tx' | 'thread';

export interface DeepLink {
  kind: DeepLinkKind;
  id: string;
  /** Forum comment/reply to scroll to (thread links only). */
  commentId?: number;
}

const KINDS: DeepLinkKind[] = ['event', 'song', 'tx', 'thread'];

/** Read the first shareable-item param present in the current URL, if any. */
export function readDeepLink(): DeepLink | null {
  const q = new URLSearchParams(window.location.search);
  for (const kind of KINDS) {
    const id = q.get(kind);
    if (id) {
      const c = kind === 'thread' ? Number(q.get('comment')) : NaN;
      return Number.isInteger(c) && c > 0 ? { kind, id, commentId: c } : { kind, id };
    }
  }
  return null;
}

/** Remove the shareable-item params, preserving any other query params. */
export function clearDeepLink(): void {
  const q = new URLSearchParams(window.location.search);
  for (const kind of KINDS) q.delete(kind);
  q.delete('comment');
  const s = q.toString();
  window.history.replaceState(null, '', s ? `${window.location.pathname}?${s}` : window.location.pathname);
}

/** Build the shareable URL for an item (origin + path + `?kind=id`). */
export function itemUrl(kind: DeepLinkKind, id: string, commentId?: number): string {
  const c = commentId != null ? `&comment=${commentId}` : '';
  return `${window.location.origin}${window.location.pathname}?${kind}=${encodeURIComponent(id)}${c}`;
}
