/**
 * Brainstorm view — the ideas thread list (design lines 553–587). Each thread
 * card: like/dislike reactions, title, body, author/date,
 * comment count, and a "view details" button (pin/archive/convert live in the thread modal).
 */
import { Lightbulb, MessageSquare } from 'lucide-react';
import { useGuataca } from '@/store';
import { AddButton, Badge, Button, Card, Pill, Segment } from '@/components/ui';
import { ReactionButtons } from '@/components/ReactionButtons';

export function Brainstorm() {
  const {
    t, state, isAdmin, forumList, setThreadReaction, openThread, openNewThread, setForumTab,
  } = useGuataca();
  const tab = state.forumTab;

  return (
    <div className="flex flex-col gap-[14px] max-w-[900px] animate-fade">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 font-display font-semibold text-[16px] leading-[normal] text-ink-bright flex items-center gap-[8px]">
          <Lightbulb size={17} strokeWidth={2} style={{ color: 'var(--color-violet-light)' }} />
          {t.brainstorm}
        </h2>
        <div className="flex items-center gap-3 ml-auto">
          <Segment>
            <Pill active={tab === 'active'} color="var(--color-violet-light)" onClick={() => setForumTab('active')}>
              {t.active}
            </Pill>
            <Pill active={tab === 'archived'} color="var(--color-violet-light)" onClick={() => setForumTab('archived')}>
              {t.forumArchived}
            </Pill>
          </Segment>
          {isAdmin && (
            <AddButton onClick={openNewThread}>{t.newThread}</AddButton>
          )}
        </div>
      </div>
      {forumList.length === 0 && (
        <Card className="p-[18px] font-sans font-normal text-[13.5px] text-ink-meta">
          {tab === 'archived' ? t.noArchivedIdeas : t.noResults}
        </Card>
      )}
      {forumList.map((b) => (
        <Card key={b.id} as="article" className="p-[18px] flex gap-4">
          <ReactionButtons
            likes={b.likes}
            dislikes={b.dislikes}
            likedBy={b.likedBy}
            dislikedBy={b.dislikedBy}
            my={b.myReaction}
            onPick={(k) => setThreadReaction(b.id, k)}
            vertical
            className="flex-none mt-[2px]"
          />
          <div className="min-w-0 flex-1">
            <h3 className="m-0 font-display font-semibold text-[16px] leading-[1.35] text-ink">{b.title}</h3>
            <p className="mt-[9px] mb-0 text-[13.5px] text-ink-meta leading-[1.65] line-clamp-3">{b.body}</p>
            <div className="flex items-center gap-[14px] mt-[14px] flex-wrap">
              <span className="flex items-center gap-2">
                <span className="w-[23px] h-[23px] rounded-[7px] bg-line grid place-items-center font-display font-semibold text-[9.5px] text-ink-meta">
                  {b.initial}
                </span>
                <span className="text-[12px] text-ink-meta">{b.author}</span>
              </span>
              <span className="text-[12px] text-ink-dim">{b.dateStr}</span>
              {b.pinned && (
                <Badge color="var(--color-amber)">{t.pinned}</Badge>
              )}
              <span className="flex items-center gap-[7px] text-ink-muted font-sans font-medium text-[12px] whitespace-nowrap">
                <MessageSquare size={14} strokeWidth={1.9} />
                {b.commentCount} {t.comments}
              </span>
              {b.poll && (
                <Badge color="var(--color-violet-light)">{b.poll.total} {t.votes}</Badge>
              )}
            </div>
            <div className="flex gap-2 border-t border-line-soft pt-[13px] mt-[14px]">
              <Button variant="ghost" className="flex-1 py-[9px] px-3 text-[12.5px]" onClick={() => openThread(b.id)}>
                {t.viewDetails}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
