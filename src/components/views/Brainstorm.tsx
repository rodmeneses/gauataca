/**
 * Brainstorm view — the ideas thread list (design lines 553–587).
 * Each thread card: vote toggle, title (opens thread), body, author/date/comments footer,
 * and (admin only) the "convert to event" action.
 */
import { ArrowUp, CalendarPlus, MessageSquare } from 'lucide-react';
import { useGuataca } from '@/store';

export function Brainstorm() {
  const { t, isAdmin, threads, voteThread, openThread, convertThread } = useGuataca();

  return (
    <div className="flex flex-col gap-[14px] max-w-[900px] animate-fade">
      {threads.map((b) => (
        <article key={b.id} className="bg-surface border border-line rounded-[14px] p-[18px] flex gap-4">
          <button
            type="button"
            onClick={() => voteThread(b.id)}
            className="flex flex-col items-center gap-[3px] py-2 px-[11px] rounded-[10px] cursor-pointer flex-none"
            style={{
              border: '1px solid ' + (b.voted ? 'color-mix(in srgb, var(--color-emerald) 40%, transparent)' : 'var(--color-line)'),
              background: b.voted ? 'color-mix(in srgb, var(--color-emerald) 11%, transparent)' : 'var(--color-raised)',
              color: b.voted ? 'var(--color-emerald-light)' : 'var(--color-ink-meta)',
            }}
          >
            <ArrowUp size={16} strokeWidth={2.2} />
            <span className="font-mono font-semibold text-[13px]">{b.votes}</span>
          </button>
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => openThread(b.id)}
              className="border-none bg-transparent p-0 text-left cursor-pointer block w-full"
            >
              <h3 className="m-0 font-display font-semibold text-[16px] leading-[1.35] text-ink">{b.title}</h3>
            </button>
            <p className="mt-[9px] mb-0 text-[13.5px] text-ink-meta leading-[1.65]">{b.body}</p>
            <div className="flex items-center gap-[14px] mt-[14px] flex-wrap">
              <span className="flex items-center gap-2">
                <span className="w-[23px] h-[23px] rounded-[7px] bg-line grid place-items-center font-display font-semibold text-[9.5px] text-ink-meta">
                  {b.initial}
                </span>
                <span className="text-[12px] text-ink-meta">{b.author}</span>
              </span>
              <span className="text-[12px] text-ink-dim">{b.dateStr}</span>
              <button
                type="button"
                onClick={() => openThread(b.id)}
                className="flex items-center gap-[7px] border-none bg-transparent text-ink-muted font-sans font-medium text-[12px] cursor-pointer p-0 whitespace-nowrap hover:text-violet-light"
              >
                <MessageSquare size={14} strokeWidth={1.9} />
                {b.commentCount} {t.comments}
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => convertThread(b.id)}
                  className="ml-auto flex items-center gap-[7px] py-2 px-3 rounded-[9px] border border-violet/40 bg-[var(--color-tint-violet)] text-violet-lighter font-sans font-semibold text-[12px] cursor-pointer whitespace-nowrap hover:bg-[var(--color-tint-violet)]"
                >
                  <CalendarPlus size={13} strokeWidth={2} />
                  {t.convert}
                </button>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
