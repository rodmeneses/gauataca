/** Read side: map PostgREST rows into forum domain shapes. */
import { Row, groupBy } from '../shared';
import type { ReactionKind, ReactionTally, Thread, ThreadComment, ThreadPoll } from '../../../types';

/* ----------------------------------------------------------------- threads */
export function tallyReactions(rows: Row[], userId: string | null): { tally: ReactionTally; mine: ReactionKind | null } {
  const likedBy: string[] = [];
  const dislikedBy: string[] = [];
  let mine: ReactionKind | null = null;
  for (const r of rows) {
    (r.kind === 'like' ? likedBy : dislikedBy).push(r.profile_id);
    if (userId && r.profile_id === userId) mine = r.kind;
  }
  return { tally: { like: likedBy.length, dislike: dislikedBy.length, likedBy, dislikedBy }, mine };
}

export function mapThreads(
  threads: Row[],
  threadReactions: Row[],
  commentReactions: Row[],
  comments: Row[],
  media: Row[],
  refs: Row[],
  threadPolls: Row[],
  threadPollOptions: Row[],
  threadPollVotes: Row[],
  userId: string | null,
): Thread[] {
  const reactionsByThread = groupBy(threadReactions, 'thread_id');
  const reactionsByComment = groupBy(commentReactions, 'comment_id');
  const mediaByThread = groupBy(media, 'thread_id');
  const refsByThread = groupBy(refs, 'thread_id');
  const commentsByThread = groupBy(comments, 'thread_id');
  const pollsByThread = groupBy(threadPolls, 'thread_id');
  const optsByPoll = groupBy(threadPollOptions, 'poll_id');
  const votesByOpt = groupBy(threadPollVotes, 'option_id');

  const pollFor = (threadId: string): ThreadPoll | undefined => {
    const poll = pollsByThread.get(threadId)?.[0];
    if (!poll) return undefined;
    const opts = (optsByPoll.get(poll.id) ?? []).sort((a, b) => a.id - b.id);
    const myOptionIds: number[] = [];
    const options = opts.map((o) => {
      const rows = votesByOpt.get(o.id) ?? [];
      if (userId && rows.some((v) => v.profile_id === userId)) myOptionIds.push(o.id);
      return { id: o.id, label: { es: o.label_es, en: o.label_en }, votes: rows.length, voterIds: rows.map((v) => v.profile_id) };
    });
    return { question: { es: poll.question_es, en: poll.question_en }, options, multiple: !!poll.multiple, myOptionIds };
  };

  const commentVm = (c: Row): ThreadComment => {
    const r = tallyReactions(reactionsByComment.get(c.id) ?? [], userId);
    return {
      id: c.id,
      parentId: c.parent_id,
      by: c.author_id,
      text: { es: c.body_es, en: c.body_en },
      createdAt: c.created_at,
      reactions: r.tally,
      myReaction: r.mine,
      media: (mediaByThread.get(c.thread_id) ?? [])
        .filter((m) => m.comment_id === c.id)
        .map((m) => ({ id: m.id, url: m.url, authorId: m.author_id })),
      refs: (refsByThread.get(c.thread_id) ?? [])
        .filter((r2) => r2.comment_id === c.id)
        .map((r2) => ({ id: r2.id, kind: r2.ref_kind, refId: r2.ref_id })),
      replies: [],
    };
  };

  // Newest first; the store's pinnedFirst sort is stable, so this order holds within pinned/unpinned.
  const newestFirst = [...threads].sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
  return newestFirst.map((b) => {
    const sorted = (commentsByThread.get(b.id) ?? []).sort((a, c) => a.id - c.id);
    const r = tallyReactions(reactionsByThread.get(b.id) ?? [], userId);
    return {
      id: b.id,
      by: b.author_id,
      date: (b.created_at ?? '').slice(0, 10),
      title: { es: b.title_es, en: b.title_en },
      body: { es: b.body_es, en: b.body_en },
      reactions: r.tally,
      myReaction: r.mine,
      media: (mediaByThread.get(b.id) ?? []).filter((m) => m.comment_id == null).map((m) => ({ id: m.id, url: m.url, authorId: m.author_id })),
      refs: (refsByThread.get(b.id) ?? []).filter((m) => m.comment_id == null).map((m) => ({ id: m.id, kind: m.ref_kind, refId: m.ref_id })),
      comments: sorted
        .filter((c) => c.parent_id == null)
        .map((c) => {
          const cm = commentVm(c);
          cm.replies = sorted.filter((r2) => r2.parent_id === c.id).map(commentVm);
          return cm;
        }),
      poll: pollFor(b.id),
      pinned: !!b.pinned,
      archived: !!b.archived,
    };
  });
}
