/**
 * Renders forum body/comment text. @-mention tokens (`@{song:<id>}` /
 * `@{event:<id>}`) become tappable chips that open the referenced song/event;
 * a token whose id no longer exists is dropped (the reference was deleted).
 * Also renders a small Markdown subset (headings, bold/italic, lists) via
 * `markdownLite` — see that file for the supported syntax. Author line breaks
 * within a paragraph are preserved (`whitespace-pre-wrap`).
 */
import { ReactNode } from 'react';
import { CalendarDays, Music } from 'lucide-react';
import { useGuataca } from '@/store';
import { parseMentions } from '@/lib/mentions';
import { parseBlocks, parseInline } from '@/lib/markdownLite';

export function RichText({ text, className }: { text: string; className?: string }) {
  const { songs, events, goToSong: goSong, openEvent: goEvent } = useGuataca();
  const songById = new Map(songs.map((s) => [s.id, s]));
  const eventById = new Map(events.map((e) => [e.id, e]));

  const renderRef = (kind: 'song' | 'event', id: string, key: string) => {
    const label = kind === 'song' ? songById.get(id)?.title : eventById.get(id)?.title;
    if (!label) return null; // dangling reference — drop the chip, keep nothing
    const Icon = kind === 'song' ? Music : CalendarDays;
    return (
      <button
        key={key}
        type="button"
        onClick={() => (kind === 'song' ? goSong(id) : goEvent(id))}
        title={kind === 'song' ? '🎵' : '📅'}
        className="inline-flex items-center gap-[5px] mx-[1px] my-[-1px] px-[7px] py-[1px] rounded-[8px] border-none font-sans font-semibold text-[inherit] align-baseline cursor-pointer hover:brightness-[1.1]"
        style={{
          background: kind === 'song'
            ? 'color-mix(in srgb, var(--color-emerald) 14%, transparent)'
            : 'color-mix(in srgb, var(--color-violet) 14%, transparent)',
          color: kind === 'song' ? 'var(--color-emerald-light)' : 'var(--color-violet-lighter)',
        }}
      >
        <Icon size={12} strokeWidth={2.2} />
        {label}
      </button>
    );
  };

  const renderInline = (raw: string, keyPrefix: string): ReactNode[] =>
    parseMentions(raw).flatMap((seg, i) => {
      if (seg.type === 'ref') {
        const node = renderRef(seg.kind, seg.id, `${keyPrefix}-r${i}`);
        return node ? [node] : [];
      }
      return parseInline(seg.text).map((piece, j) => {
        const key = `${keyPrefix}-${i}-${j}`;
        if (piece.bold) return <strong key={key}>{piece.text}</strong>;
        if (piece.italic) return <em key={key}>{piece.text}</em>;
        return <span key={key}>{piece.text}</span>;
      });
    });

  const blocks = parseBlocks(text);

  return (
    <div className={`whitespace-pre-wrap break-words${className ? ' ' + className : ''}`}>
      {blocks.map((b, i) => {
        if (b.type === 'heading') {
          const Tag: 'h2' | 'h3' | 'h4' = b.level === 1 ? 'h2' : b.level === 2 ? 'h3' : 'h4';
          const size = b.level === 1 ? '1.15em' : '1.05em';
          return (
            <Tag key={i} className="font-sans font-semibold mt-[12px] mb-[4px] first:mt-0" style={{ fontSize: size }}>
              {renderInline(b.text, `h${i}`)}
            </Tag>
          );
        }
        if (b.type === 'list') {
          const ListTag: 'ol' | 'ul' = b.ordered ? 'ol' : 'ul';
          return (
            <ListTag key={i} className={`${b.ordered ? 'list-decimal' : 'list-disc'} pl-[20px] my-[4px] space-y-[2px]`}>
              {b.items.map((item, j) => <li key={j}>{renderInline(item, `li${i}-${j}`)}</li>)}
            </ListTag>
          );
        }
        return (
          <p key={i} className="m-0 mb-[6px] last:mb-0">
            {renderInline(b.text, `p${i}`)}
          </p>
        );
      })}
    </div>
  );
}
