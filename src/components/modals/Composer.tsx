/**
 * Forum text composer: textarea + send button with an @-mention autocomplete.
 * Typing `@{` (or selecting a mention) opens a filtered song/event popup; picking
 * inserts a `@{song:<id>}` / `@{event:<id>}` token that the renderer turns into a
 * chip (and that also lands in `thread_refs` on save — see src/lib/mentions.ts).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { AtSign, CalendarDays, Music } from 'lucide-react';
import { useGuataca } from '@/store';
import { Button } from '@/components/ui';
import { formatMention, getPartialMention } from '@/lib/mentions';
import type { EventVm, SongVm } from '@/store/vm';

export function Composer({
  value,
  onChange,
  onSend,
  placeholder,
  sendLabel,
  rows = 2,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder?: string;
  sendLabel: string;
  rows?: number;
  className?: string;
}) {
  const { songs, events } = useGuataca();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [caret, setCaret] = useState(value.length);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const partial = getPartialMention(value, caret);
  const matches = useMemo(() => {
    if (!partial) return [];
    const query = partial.query.toLowerCase();
    const pool = partial.kind === 'song' ? songs : events;
    return pool.filter((x) => x.title.toLowerCase().includes(query)).slice(0, 6);
  }, [partial, songs, events]);

  // Auto-open when the caret sits in an open token; close otherwise. `partial` is
  // recreated every render so key off the token start + query strings.
  useEffect(() => {
    if (partial) {
      setOpen(true);
      setActive(0);
    } else {
      setOpen(false);
    }
  }, [partial?.start, partial?.query]);

  const insert = (id: string) => {
    if (!partial) return;
    const token = formatMention(partial.kind, id) + ' ';
    onChange(value.slice(0, partial.start) + token + value.slice(caret));
    setOpen(false);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const pos = partial.start + token.length;
      el.focus();
      el.selectionStart = el.selectionEnd = pos;
      setCaret(pos);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') setOpen(false);
    if (!open || !partial) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % matches.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + matches.length) % matches.length); }
    else if (e.key === 'Enter' && !e.shiftKey && matches.length > 0) { e.preventDefault(); insert(matches[active].id); }
  };

  return (
    <div className={className}>
      <div className="relative">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
          onKeyDown={onKeyDown}
          rows={rows}
          placeholder={placeholder}
          className="block w-full p-[11px_13px] rounded-[11px] border border-line bg-base text-ink-base font-sans text-[13.5px] leading-[1.55] outline-none resize-none focus:border-emerald/40"
        />
        {open && partial && matches.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 z-20 rounded-[12px] border border-line bg-surface overflow-hidden shadow-lg animate-fade-fast">
            {matches.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => insert(m.id)}
                onMouseEnter={() => setActive(i)}
                className="flex items-center gap-[10px] w-full py-[9px] px-[13px] text-left cursor-pointer"
                style={{ background: i === active ? 'color-mix(in srgb, var(--color-violet) 12%, transparent)' : 'transparent' }}
              >
                <span className="flex-none" style={{ color: partial.kind === 'song' ? 'var(--color-emerald)' : 'var(--color-violet)' }}>
                  {partial.kind === 'song' ? <Music size={15} strokeWidth={2} /> : <CalendarDays size={15} strokeWidth={2} />}
                </span>
                <span className="flex-1 min-w-0 font-sans font-medium text-[13px] leading-[normal] text-ink-body truncate">{m.title}</span>
                <span className="font-mono font-medium text-[11px] leading-[normal] text-ink-muted flex-none">
                  {partial.kind === 'song' ? `${(m as SongVm).key} · ${(m as SongVm).dur}` : (m as EventVm).dateStr}
                </span>
                <AtSign size={13} strokeWidth={2} className="flex-none" style={{ color: 'var(--color-ink-dim)' }} />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end mt-[8px]">
        <Button variant="primary" onClick={onSend} className="py-[9px] px-[16px] rounded-[10px]">
          {sendLabel}
        </Button>
      </div>
    </div>
  );
}
