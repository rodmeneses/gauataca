/** Mobile "Ideas" tab: the brainstorm thread list (vote, open, convert-to-event). */
import { ArrowUp, CalendarPlus, MessageSquare } from 'lucide-react';
import { useGuataca } from '../../store';

export function MobileBrainstorm() {
  const { t, isAdmin, threads, voteThread, openThread, convertThread } = useGuataca();

  return (
    <div className="flex flex-col gap-3">
      {threads.map((b) => (
        <article key={b.id} className="bg-surface border border-line rounded-2xl p-4 flex gap-3">
          <button
            type="button"
            onClick={() => voteThread(b.id)}
            aria-pressed={b.voted}
            aria-label={`${t.upvote} — ${b.votes}`}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-2.5 rounded-xl cursor-pointer flex-none transition-colors"
            style={{
              border: '1px solid ' + (b.voted ? 'color-mix(in srgb, var(--color-emerald) 40%, transparent)' : 'var(--color-line)'),
              background: b.voted ? 'var(--color-tint-emerald)' : 'var(--color-raised)',
              color: b.voted ? 'var(--color-emerald)' : 'var(--color-ink-meta)',
            }}
          >
            <ArrowUp size={17} strokeWidth={2.2} />
            <span className="font-mono font-semibold text-[13px]">{b.votes}</span>
          </button>
          <div className="min-w-0 flex-1">
            <button type="button" onClick={() => openThread(b.id)} className="border-none bg-transparent p-0 text-left cursor-pointer block w-full">
              <h3 className="m-0 font-display font-semibold text-[17px] leading-snug text-ink">{b.title}</h3>
            </button>
            <p className="mt-2 mb-0 text-[15px] text-ink-body leading-relaxed line-clamp-3">{b.body}</p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-line grid place-items-center font-display font-semibold text-[12px] text-ink-meta">{b.initial}</span>
                <span className="text-[13px] text-ink-muted">{b.author}</span>
              </span>
              <span className="text-[13px] text-ink-dim">{b.dateStr}</span>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <button
                type="button"
                onClick={() => openThread(b.id)}
                className="flex items-center gap-1.5 min-h-[44px] px-3 rounded-lg border border-line bg-raised text-ink-body font-sans font-semibold text-[13px] cursor-pointer"
              >
                <MessageSquare size={15} strokeWidth={1.9} />
                {b.commentCount} {t.comments}
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => convertThread(b.id)}
                  className="ml-auto flex items-center gap-1.5 min-h-[44px] px-3 rounded-lg border border-violet/40 bg-[var(--color-tint-violet)] text-violet font-sans font-semibold text-[13px] cursor-pointer"
                >
                  <CalendarPlus size={14} strokeWidth={2} />
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
