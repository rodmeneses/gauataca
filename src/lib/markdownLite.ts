/**
 * Minimal Markdown subset for forum body/comment text: `## `/`### ` headings,
 * `- `/`* ` bullet lists, `1. ` numbered lists, `**bold**` and `_italic_`/`*italic*`
 * inline emphasis. Deliberately not CommonMark — just enough for the pasted
 * meeting-notes style text people paste into the forum. No HTML is parsed or
 * produced (renderer builds React elements directly, never innerHTML), so
 * there's no injection surface for arbitrary markup.
 */

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] };

const HEADING_RE = /^(#{1,3})\s+(.*)$/;
const BULLET_RE = /^\s*[-*]\s+(.*)$/;
const ORDERED_RE = /^\s*\d+\.\s+(.*)$/;

export function parseBlocks(text: string): Block[] {
  const lines = text.split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim() === '') { i++; continue; }

    const heading = HEADING_RE.exec(lines[i]);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length as 1 | 2 | 3, text: heading[2] });
      i++;
      continue;
    }

    const isBullet = BULLET_RE.test(lines[i]);
    const isOrdered = ORDERED_RE.test(lines[i]);
    if (isBullet || isOrdered) {
      const ordered = isOrdered;
      const items: string[] = [];
      while (i < lines.length) {
        const m = (ordered ? ORDERED_RE : BULLET_RE).exec(lines[i]);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !HEADING_RE.test(lines[i]) && !BULLET_RE.test(lines[i]) && !ORDERED_RE.test(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'paragraph', text: paraLines.join('\n') });
  }
  return blocks;
}

export interface InlinePiece {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

const INLINE_RE = /\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_/g;

/** Split a run of plain text into bold/italic/plain pieces (no nesting). */
export function parseInline(text: string): InlinePiece[] {
  const pieces: InlinePiece[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE_RE)) {
    if (m.index! > last) pieces.push({ text: text.slice(last, m.index!) });
    if (m[1] !== undefined) pieces.push({ text: m[1], bold: true });
    else pieces.push({ text: (m[2] ?? m[3])!, italic: true });
    last = m.index! + m[0].length;
  }
  if (last < text.length) pieces.push({ text: text.slice(last) });
  return pieces;
}
