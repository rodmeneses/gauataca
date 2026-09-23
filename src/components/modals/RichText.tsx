/**
 * Renders forum body/comment text. @-mention tokens (`@{song:<id>}` /
 * `@{event:<id>}`) become tappable chips that open the referenced song/event;
 * a token whose id no longer exists is dropped (the reference was deleted).
 * Line breaks the author typed are preserved (`whitespace-pre-wrap`).
 */
import { CalendarDays, Music } from 'lucide-react';
import { useGuataca } from '@/store';
import { parseMentions } from '@/lib/mentions';

export function RichText({ text, className }: { text: string; className?: string }) {
  const { songs, events, goToSong: goSong, openEvent: goEvent } = useGuataca();
  const segs = parseMentions(text);
  const songById = new Map(songs.map((s) => [s.id, s]));
  const eventById = new Map(events.map((e) => [e.id, e]));
  return (
    <span className={`whitespace-pre-wrap break-words${className ? ' ' + className : ''}`}>
      {segs.map((seg, i) => {
        if (seg.type === 'text') return <span key={i}>{seg.text}</span>;
        const label = seg.kind === 'song' ? songById.get(seg.id)?.title : eventById.get(seg.id)?.title;
        if (!label) return null; // dangling reference — drop the chip, keep nothing
        const Icon = seg.kind === 'song' ? Music : CalendarDays;
        return (
          <button
            key={i}
            type="button"
            onClick={() => (seg.kind === 'song' ? goSong(seg.id) : goEvent(seg.id))}
            title={seg.kind === 'song' ? '🎵' : '📅'}
            className="inline-flex items-center gap-[5px] mx-[1px] my-[-1px] px-[7px] py-[1px] rounded-[8px] border-none font-sans font-semibold text-[inherit] align-baseline cursor-pointer hover:brightness-[1.1]"
            style={{
              background: seg.kind === 'song'
                ? 'color-mix(in srgb, var(--color-emerald) 14%, transparent)'
                : 'color-mix(in srgb, var(--color-violet) 14%, transparent)',
              color: seg.kind === 'song' ? 'var(--color-emerald-light)' : 'var(--color-violet-lighter)',
            }}
          >
            <Icon size={12} strokeWidth={2.2} />
            {label}
          </button>
        );
      })}
    </span>
  );
}
