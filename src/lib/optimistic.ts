/**
 * Pure snapshot patches applied the instant a member taps (pin, archive, RSVP,
 * react), before the write finishes. The silent refetch that follows every
 * mutation (see `run` in data.tsx) replaces them with server truth, so a failed
 * write rolls back by itself.
 */
import type { DataSnapshot } from './api';
import type { ReactionKind, ReactionTally, RsvpStatus } from '../types';

export type Patch = (s: DataSnapshot) => DataSnapshot;

export const pinEvent = (id: string, pinned: boolean): Patch => (s) => ({
  ...s,
  events: s.events.map((e) => (e.id === id ? { ...e, pinned } : e)),
});

export const pinThread = (id: string, pinned: boolean): Patch => (s) => ({
  ...s,
  threads: s.threads.map((t) => (t.id === id ? { ...t, pinned } : t)),
});

export const archiveThread = (id: string, archived: boolean): Patch => (s) => ({
  ...s,
  threads: s.threads.map((t) => (t.id === id ? { ...t, archived } : t)),
});

export const rsvp = (eventId: string, status: RsvpStatus | null, userId: string): Patch => (s) => ({
  ...s,
  events: s.events.map((e) => {
    if (e.id !== eventId) return e;
    const attendance = { ...(e.attendance ?? {}) };
    if (status === null) delete attendance[userId];
    else attendance[userId] = status;
    return { ...e, attendance };
  }),
});

/** Move `userId` from their previous reaction (if any) to `next` in a tally. */
export function retally(r: ReactionTally, prev: ReactionKind | null, next: ReactionKind | null, userId: string): ReactionTally {
  const likedBy = r.likedBy.filter((u) => u !== userId);
  const dislikedBy = r.dislikedBy.filter((u) => u !== userId);
  let like = r.like - (prev === 'like' ? 1 : 0);
  let dislike = r.dislike - (prev === 'dislike' ? 1 : 0);
  if (next === 'like') { likedBy.push(userId); like += 1; }
  if (next === 'dislike') { dislikedBy.push(userId); dislike += 1; }
  return { like: Math.max(0, like), dislike: Math.max(0, dislike), likedBy, dislikedBy };
}

export const reactToThread = (id: string, kind: ReactionKind | null, userId: string): Patch => (s) => ({
  ...s,
  threads: s.threads.map((t) =>
    t.id === id ? { ...t, myReaction: kind, reactions: retally(t.reactions, t.myReaction, kind, userId) } : t,
  ),
});

/** How long a deleted comment/link can be restored with the Undo toast before the write is sent. */
export const UNDO_WINDOW_MS = 6000;

/** Ids hidden from the UI while their delete waits out the undo window. */
export interface PendingDeletes { links: number[]; comments: number[] }
export const NO_PENDING_DELETES: PendingDeletes = { links: [], comments: [] };

/** Hide pending deletes (a comment takes its replies with it). Returns the same snapshot when nothing is pending. */
export function hideDeleted(s: DataSnapshot, pending: PendingDeletes): DataSnapshot {
  if (!pending.links.length && !pending.comments.length) return s;
  const gone = new Set(pending.comments);
  return {
    ...s,
    links: s.links.filter((l) => !pending.links.includes(l.id)),
    threads: gone.size
      ? s.threads.map((t) => ({
          ...t,
          comments: t.comments.filter((c) => !gone.has(c.id)).map((c) => ({ ...c, replies: c.replies.filter((r) => !gone.has(r.id)) })),
        }))
      : s.threads,
  };
}
