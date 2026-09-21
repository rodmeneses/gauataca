/**
 * Brainstorm view — the ideas thread list (design lines 553–587). Each thread
 * card: like/dislike reactions, title (opens thread), body, author/date,
 * comment count, and (admin only) the "convert to event" action.
 */
import { BarChart3, CalendarPlus, Lightbulb, MessageSquare } from 'lucide-react';
import { useGuataca } from '@/store';
import { Button } from '@/components/ui';
import { ReactionButtons } from '@/components/ReactionButtons';

export function Brainstorm() {
  const { t, isAdmin, threads, setThreadReaction, openThread, convertThread, openNewThread } = useGuataca();

  return (
    <div className="flex flex-col gap-[14px] max-w-[900px] animate-fade">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 font-display font-semibold text-[16px] leading-[normal] text-ink-bright flex items-center gap-[8px]">
          <Lightbulb size={17} strokeWidth={2} style={{ color: 'var(--color-violet-light)' }} />
          {t.brainstorm}
        </h2>
        {isAdmin && (
          <Button variant="brand" onClick={openNewThread} className="py-[9px] px-[14px] rounded-[10px] text-[12.5px]">
            {t.newThread}
          </Button>
        )}
      </div>
      {threads.length === 0 && (
        <p className="m-0 font-sans font-normal text-[13.5px] text-ink-meta bg-surface border border-line rounded-[14px] p-[18px]">{t.noResults}</p>
      )}
      {threads.map((b) => (
        <article key={b.id} className="bg-surface border border-line rounded-[14px] p-[18px] flex gap-4">
          <ReactionButtons
            likes={b.likes}
            dislikes={b.dislikes}
            my={b.myReaction}
            onPick={(k) => setThreadReaction(b.id, k)}
            vertical
            className="flex-none mt-[2px]"
          />
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => openThread(b.id)}
              className="border-none bg-transparent p-0 text-left cursor-pointer block w-full"
            >
              <h3 className="m-0 font-display font-semibold text-[16px] leading-[1.35] text-ink">{b.title}</h3>
            </button>
            <p className="mt-[9px] mb-0 text-[13.5px] text-ink-meta leading-[1.65] line-clamp-3">{b.body}</p>
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
              {b.poll && (
                <span className="inline-flex items-center gap-[6px] py-[4px] px-[9px] rounded-[7px] bg-[var(--color-tint-violet)] text-violet-lighter font-sans font-semibold text-[11px] leading-[normal]">
                  <BarChart3 size={12} strokeWidth={2} />
                  {b.poll.total} {t.votes}
                </span>
              )}
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
