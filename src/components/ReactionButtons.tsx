/**
 * Like / dislike pair for forum ideas and comments. The active reaction is tinted
 * (like → emerald, dislike → rose); clicking the active one again withdraws it.
 * A trailing "who reacted" button opens a list of the members behind each count.
 */
import { useState } from 'react';
import { ThumbsDown, ThumbsUp, Users } from 'lucide-react';
import { useGuataca } from '@/store';
import { CloseButton, Modal } from '@/components/ui';
import type { ReactionKind } from '../types';

export function ReactionButtons({
  likes,
  dislikes,
  likedBy,
  dislikedBy,
  my,
  onPick,
  vertical = false,
  className,
}: {
  likes: number;
  dislikes: number;
  /** Short names of the members behind each count. */
  likedBy: string[];
  dislikedBy: string[];
  my: ReactionKind | null;
  /** Called with the *next* reaction (or null to withdraw the current one). */
  onPick: (kind: ReactionKind | null) => void;
  /** Stacked column (card leader) instead of a row. */
  vertical?: boolean;
  className?: string;
}) {
  const { t } = useGuataca();
  const [showWho, setShowWho] = useState(false);
  const btn = (kind: ReactionKind, count: number) => {
    const active = my === kind;
    const tint = kind === 'like' ? 'var(--color-emerald)' : 'var(--color-rose)';
    const Icon = kind === 'like' ? ThumbsUp : ThumbsDown;
    return (
      <button
        key={kind}
        type="button"
        title={kind === 'like' ? t.like : t.dislike}
        aria-pressed={active}
        aria-label={`${kind === 'like' ? t.like : t.dislike} — ${count}`}
        onClick={() => onPick(active ? null : kind)}
        className="flex items-center gap-[5px] py-[7px] px-[11px] rounded-[10px] cursor-pointer transition-colors hover:brightness-[1.06]"
        style={{
          border: active ? `1px solid color-mix(in srgb, ${tint} 45%, transparent)` : '1px solid var(--color-line)',
          background: active ? `color-mix(in srgb, ${tint} 13%, transparent)` : 'var(--color-raised)',
          color: active ? tint : 'var(--color-ink-meta)',
        }}
      >
        <Icon size={15} strokeWidth={2.2} />
        <span className="font-mono font-semibold text-[13px] leading-[normal]">{count}</span>
      </button>
    );
  };
  return (
    <div className={vertical ? `flex flex-col gap-[6px] ${className ?? ''}` : `flex items-center gap-[7px] ${className ?? ''}`} role="group" aria-label={t.reactions}>
      {btn('like', likes)}
      {btn('dislike', dislikes)}
      {likes + dislikes > 0 && (
        <button
          type="button"
          title={t.whoReacted}
          aria-label={t.whoReacted}
          onClick={() => setShowWho(true)}
          className="grid place-items-center min-w-[32px] min-h-[32px] rounded-[10px] border border-line bg-raised text-ink-meta cursor-pointer hover:text-ink hover:border-line-hover"
        >
          <Users size={14} strokeWidth={2.2} />
        </button>
      )}
      {showWho && (
        // Portal-less modal: stop clicks bubbling to a clickable card/row behind it.
        <div onClick={(e) => e.stopPropagation()}>
          <Modal onClose={() => setShowWho(false)} maxWidth={360} z={90} labelledBy="who-reacted-title">
            <div className="p-[18px_20px]">
              <div className="flex items-center justify-between gap-3 mb-[14px]">
                <h3 id="who-reacted-title" className="m-0 font-display font-semibold text-[16px] text-ink-bright">{t.whoReacted}</h3>
                <CloseButton onClick={() => setShowWho(false)} size={32} />
              </div>
              {([['like', likedBy], ['dislike', dislikedBy]] as const).map(([kind, names]) =>
                names.length === 0 ? null : (
                  <div key={kind} className="mb-3 last:mb-0">
                    <div className="flex items-center gap-[6px] mb-[6px] font-mono font-semibold text-[12px]" style={{ color: kind === 'like' ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                      {kind === 'like' ? <ThumbsUp size={13} strokeWidth={2.2} /> : <ThumbsDown size={13} strokeWidth={2.2} />}
                      {kind === 'like' ? t.like : t.dislike} · {names.length}
                    </div>
                    <ul className="m-0 p-0 list-none flex flex-col gap-[4px]">
                      {names.map((n, i) => (
                        <li key={i} className="text-[13px] text-ink-body">{n}</li>
                      ))}
                    </ul>
                  </div>
                ),
              )}
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}
