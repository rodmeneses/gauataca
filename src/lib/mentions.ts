/**
 * Forum @-mention tokens. A mention inline in body/comment text is rendered as a
 * tappable chip and, like the picker chips, also lands in `thread_refs` (single
 * source of truth for references). Syntax: `@{song:<id>}` / `@{event:<id>}`.
 */

export type MentionKind = 'song' | 'event';

export interface TextSegment {
  type: 'text';
  text: string;
}
export interface RefSegment {
  type: 'ref';
  kind: MentionKind;
  id: string;
}
export type Segment = TextSegment | RefSegment;

export const MENTION_RE = /@\{(song|event):([^}]+)\}/g;

/** Build the token to insert for a mention (`@{song:abc123}`). */
export function formatMention(kind: MentionKind, id: string): string {
  return `@{${kind}:${id}}`;
}

/** Split free text into text + mention segments (gaps and literal text preserved). */
export function parseMentions(text: string): Segment[] {
  const segs: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(MENTION_RE)) {
    if (m.index! > last) segs.push({ type: 'text', text: text.slice(last, m.index!) });
    segs.push({ type: 'ref', kind: m[1] as MentionKind, id: m[2] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) segs.push({ type: 'text', text: text.slice(last) });
  return segs;
}

export interface PartialMention {
  /** Index of the `@` that opens the token. */
  start: number;
  kind: MentionKind;
  query: string;
}

/**
 * Find the (unterminated) mention token whose `@` is at or before `caret`, for
 * the autocomplete popup. Returns null when the caret isn't inside an open token.
 */
export function getPartialMention(text: string, caret: number): PartialMention | null {
  const lineStart = text.lastIndexOf('\n', caret - 1) + 1;
  for (let i = caret - 1; i >= lineStart; i--) {
    const ch = text[i];
    if (ch === '}') return null; // the token is already closed before the caret
    if (ch === '\n') return null;
    if (ch === '@') {
      const tail = text.slice(i, caret);
      const m = /^@\{\s*(song|event)\s*:\s*([^}]*)$/.exec(tail);
      if (m) return { start: i, kind: m[1] as MentionKind, query: m[2].trim() };
      return null;
    }
  }
  return null;
}
