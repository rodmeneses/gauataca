/**
 * Like / dislike pair for forum ideas and comments. The active reaction is tinted
 * (like → emerald, dislike → rose); clicking the active one again withdraws it.
 */
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { useGuataca } from '@/store';
import type { ReactionKind } from '../types';

export function ReactionButtons({
  likes,
  dislikes,
  my,
  onPick,
  vertical = false,
  className,
}: {
  likes: number;
  dislikes: number;
  my: ReactionKind | null;
  /** Called with the *next* reaction (or null to withdraw the current one). */
  onPick: (kind: ReactionKind | null) => void;
  /** Stacked column (card leader) instead of a row. */
  vertical?: boolean;
  className?: string;
}) {
  const { t } = useGuataca();
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
    </div>
  );
}
