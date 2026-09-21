/** Mobile "Ideas" tab: the brainstorm thread list (reactions, open, convert). */
import { BarChart3, CalendarPlus, Lightbulb, MessageSquare } from 'lucide-react';
import { useGuataca } from '../../store';
import { ReactionButtons } from '../ReactionButtons';

export function MobileBrainstorm() {
  const { t, isAdmin, threads, setThreadReaction, openThread, convertThread, openNewThread } = useGuataca();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="m-0 font-display font-semibold text-[17px] leading-normal text-ink-bright flex items-center gap-2">
          <Lightbulb size={17} strokeWidth={2} style={{ color: 'var(--color-violet)' }} />
          {t.brainstorm}
        </h2>
        {isAdmin && (
          <button
            type="button"
            onClick={openNewThread}
            className="min-h-[44px] px-4 rounded-xl border border-violet/40 bg-[var(--color-tint-violet)] text-violet font-sans font-semibold text-[13px] cursor-pointer"
          >
            {t.newThread}
          </button>
        )}
      </div>
      {threads.length === 0 && <p className="m-0 font-sans font-normal text-[14px] text-ink-dim bg-surface border border-line rounded-2xl p-4">{t.noResults}</p>}
      {threads.map((b) => (
        <article key={b.id} className="bg-surface border border-line rounded-2xl p-4 flex gap-3">
          <ReactionButtons
            likes={b.likes}
            dislikes={b.dislikes}
            my={b.myReaction}
            onPick={(k) => setThreadReaction(b.id, k)}
            vertical
            className="flex-none"
          />
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
              {b.poll && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-tint-violet)] text-violet-lighter font-sans font-semibold text-[12px]">
                  <BarChart3 size={13} strokeWidth={2} />
                  {b.poll.total} {t.votes}
                </span>
              )}
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
