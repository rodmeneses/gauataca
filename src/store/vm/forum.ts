/** Forum thread, comment and poll view-models. */
import { fmt, rel } from '../../lib/format';
import type { ReactionKind, Thread, ThreadComment, ThreadMedia, ThreadPoll, ThreadRef } from '../../types';
import { L, memberById } from './common';
import type { Ctx } from './common';

/* ---------------------------------------------------------------- threads */
export interface ResolvedRef {
  id: number;
  kind: 'song' | 'event';
  /** Target song/event id (the raw ThreadRef.refId), for navigation. */
  refId: string;
  /** Display label of the referenced song/event (unresolvable ids are dropped). */
  label: string;
}

export interface CommentVm {
  id: number;
  parentId: number | null;
  /** Written by the signed-in member (only they can delete it). */
  mine: boolean;
  author: string;
  initial: string;
  text: string;
  dateStr: string;
  likes: number;
  dislikes: number;
  /** Short names of the members behind each count. */
  likedBy: string[];
  dislikedBy: string[];
  myReaction: ReactionKind | null;
  media: ThreadMedia[];
  refs: ResolvedRef[];
  /** Flat, one level deep. */
  replies: CommentVm[];
}

export interface ThreadVm {
  id: string;
  title: string;
  body: string;
  author: string;
  initial: string;
  dateStr: string;
  likes: number;
  dislikes: number;
  /** Short names of the members behind each count. */
  likedBy: string[];
  dislikedBy: string[];
  myReaction: ReactionKind | null;
  media: ThreadMedia[];
  refs: ResolvedRef[];
  /** Top-level comments + replies. */
  commentCount: string;
  comments: CommentVm[];
  /** Optional poll attached at creation time (null when the idea has none). */
  poll: ThreadPollVm | null;
  /** Admin-pinned; sorts to the top of the active/archived list. */
  pinned: boolean;
  /** Admin-archived; hidden from the active forum tab. */
  archived: boolean;
}

function resolveRefs(refs: ThreadRef[], ctx: Ctx): ResolvedRef[] {
  const out: ResolvedRef[] = [];
  for (const r of refs) {
    if (r.kind === 'song') {
      const song = ctx.songs.find((s) => s.id === r.refId);
      if (song) out.push({ id: r.id, kind: 'song', refId: r.refId, label: song.title });
    } else {
      const ev = ctx.events.find((e) => e.id === r.refId);
      if (ev) out.push({ id: r.id, kind: 'event', refId: r.refId, label: L(ctx.lang, ev.title) });
    }
  }
  return out;
}

function reactorNames(ids: string[], ctx: Ctx): string[] {
  return ids.map((id) => memberById(ctx.members, id).short);
}

function commentVm(c: ThreadComment, ctx: Ctx): CommentVm {
  return {
    id: c.id,
    parentId: c.parentId,
    mine: c.by === ctx.meId,
    author: memberById(ctx.members, c.by).short,
    initial: memberById(ctx.members, c.by).initial,
    text: L(ctx.lang, c.text),
    dateStr: rel(c.createdAt.slice(0, 10), ctx.lang),
    likes: c.reactions.like,
    dislikes: c.reactions.dislike,
    likedBy: reactorNames(c.reactions.likedBy, ctx),
    dislikedBy: reactorNames(c.reactions.dislikedBy, ctx),
    myReaction: c.myReaction,
    media: c.media,
    refs: resolveRefs(c.refs, ctx),
    replies: [],
  };
}

/* ----------------------------------------------------------------- polls */
export interface ThreadPollOptionVm {
  /** The option row id, for voting. */
  id: number;
  label: string;
  /** Vote count, as text. */
  v: string;
  /** "%" share. */
  pct: string;
  picked: boolean;
  /** Short names of the members who voted for it. */
  voters: string[];
}

export interface ThreadPollVm {
  question: string;
  /** True when members may pick several options. */
  multiple: boolean;
  /** Total votes, as text. */
  total: string;
  options: ThreadPollOptionVm[];
}

export function threadPollVm(p: ThreadPoll, ctx: Ctx): ThreadPollVm {
  const { lang } = ctx;
  const total = p.options.reduce((a, b) => a + b.votes, 0);
  const denom = total || 1;
  return {
    question: L(lang, p.question),
    multiple: p.multiple,
    total: String(total),
    options: p.options.map((o) => ({
      id: o.id,
      label: L(lang, o.label),
      v: String(o.votes),
      pct: Math.round((o.votes / denom) * 100) + '%',
      picked: p.myOptionIds.includes(o.id),
      voters: reactorNames(o.voterIds, ctx),
    })),
  };
}

export function threadVm(b: Thread, ctx: Ctx): ThreadVm {
  const comments = b.comments.map((c) => {
    const vm = commentVm(c, ctx);
    vm.replies = c.replies.map((r) => commentVm(r, ctx));
    return vm;
  });
  const flat = b.comments.reduce((n, c) => n + 1 + c.replies.length, 0);
  return {
    id: b.id,
    title: L(ctx.lang, b.title),
    body: L(ctx.lang, b.body),
    author: memberById(ctx.members, b.by).short,
    initial: memberById(ctx.members, b.by).initial,
    dateStr: fmt(b.date, ctx.lang, true),
    likes: b.reactions.like,
    dislikes: b.reactions.dislike,
    likedBy: reactorNames(b.reactions.likedBy, ctx),
    dislikedBy: reactorNames(b.reactions.dislikedBy, ctx),
    myReaction: b.myReaction,
    media: b.media,
    refs: resolveRefs(b.refs, ctx),
    commentCount: String(flat),
    comments,
    poll: b.poll ? threadPollVm(b.poll, ctx) : null,
    pinned: b.pinned,
    archived: b.archived,
  };
}
