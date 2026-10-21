/** Brainstorm forum: ideas, comments/replies, reactions, polls and photo attachments. */
import type { ReactionKind } from '../../types';
import { UNDO_WINDOW_MS } from '../../lib/optimistic';
import { uploadPhotoBatch, type ActionCtx } from './ctx';

/** True while a poll vote is saving, so rapid taps don't stack votes or toasts. */
let votingThreadPoll = false;

export interface ForumActions {
  openThread: (id: string, commentId?: number) => void;
  openNewThread: () => void;
  /** Create a forum idea (title/body/refs) and upload its photos; an optional poll rides along. */
  saveThread: (photos: File[], poll?: { question: string; options: string[]; multiple?: boolean } | null) => Promise<void>;
  setThreadReaction: (threadId: string, kind: ReactionKind | null) => Promise<void>;
  setCommentReaction: (commentId: number, kind: ReactionKind | null) => Promise<void>;
  /** Delete one of your own comments (its replies go with it). */
  deleteComment: (commentId: number) => Promise<void>;
  /** Add an option to the open idea's poll (admins). */
  addThreadPollOption: (label: string) => Promise<void>;
  /** Set the signed-in member's vote on a poll option; re-picking moves the vote. */
  voteThreadPoll: (optionId: number) => Promise<void>;
  /** Attach photos to a forum idea (or, with `commentId`, to one of its comments). */
  addThreadPhotos: (threadId: string, files: File[], commentId?: number | null) => Promise<void>;
  deleteThreadMedia: (id: number) => Promise<void>;
  addThreadRefs: (threadId: string, refs: { kind: 'song' | 'event'; id: string }[], commentId?: number | null) => Promise<void>;
  setCommentDraft: (s: string) => void;
  /** Post a top-level comment (optionally with photos). */
  sendComment: (photos?: File[]) => Promise<void>;
  /** Begin replying to a specific comment id (null clears the reply composer). */
  setReplyTarget: (target: number | null) => void;
  setReplyDraft: (s: string) => void;
  /** Post a one-level reply to the active reply target (optionally with photos). */
  sendReply: (photos?: File[]) => Promise<void>;
  convertThread: (id: string) => void;
  /** Toggle a forum idea's pinned state (admin only). */
  toggleThreadPin: (id: string) => Promise<void>;
  /** Toggle a forum idea's archived state (admin only). */
  toggleThreadArchive: (id: string) => Promise<void>;
}

export function forumActions(ctx: ActionCtx): ForumActions {
  const { st, set, toast, t, Lx, data, thSel } = ctx;
  const f = st.form;
  // compress → upload → attach to a thread or one of its comments; shared by
  // idea creation, the idea composer and the reply composer.
  const uploadToThread = (threadId: string, files: File[], commentId: number | null = null) =>
    uploadPhotoBatch(ctx, files, data.uploadForumPhoto, (urls) => data.addThreadMedia(threadId, urls, commentId));
  return {
    openThread: (id, commentId) => set({ modal: { kind: 'thread', id, commentId } }),
    openNewThread: () => set({ modal: { kind: 'newThread' }, form: {} }),
    saveThread: async (photos, poll) => {
      const title = (f.threadTitle || '').trim();
      const body = f.threadBody || '';
      const refs = f.threadRefs || [];
      set({ modal: null, form: {} });
      if (!title && !body) return;
      const id = await data.createThread({ title: title || '…', body });
      if (!id) return;
      if (refs.length) await data.addThreadRefs(id, refs);
      const pollOpts = (poll?.options ?? []).map((o) => o.trim()).filter(Boolean);
      if (poll && (poll.question || '').trim() && pollOpts.length >= 2) {
        await data.createThreadPoll(id, poll.question.trim(), pollOpts, !!poll.multiple);
      }
      if (photos.length) await uploadToThread(id, photos);
      toast(t.ideaCreated);
    },
    setThreadReaction: async (threadId, kind: ReactionKind | null) => {
      await data.setThreadReaction(threadId, kind);
    },
    setCommentReaction: async (commentId, kind: ReactionKind | null) => {
      await data.setCommentReaction(commentId, kind);
    },
    deleteComment: async (commentId) => {
      const undo = data.deleteComment(commentId);
      toast(t.commentDeleted, 'ok', { action: { label: t.undo, run: undo }, ttl: UNDO_WINDOW_MS });
    },
    addThreadPollOption: async (label) => {
      const l = label.trim();
      if (!thSel?.poll || !l) return;
      await data.addThreadPollOption(thSel.id, l);
      toast(t.optionAdded);
    },
    voteThreadPoll: async (optionId) => {
      if (votingThreadPoll) return;
      votingThreadPoll = true;
      try {
        const removing = !!thSel?.poll?.myOptionIds.includes(optionId);
        await data.voteThreadPoll(optionId);
        toast(removing ? t.voteRemoved : t.voted);
      } finally {
        votingThreadPoll = false;
      }
    },
    addThreadPhotos: (threadId, files, commentId = null) => uploadToThread(threadId, files, commentId),
    deleteThreadMedia: async (id) => {
      await data.deleteThreadMedia(id);
      toast(t.mediaRemoved);
    },
    addThreadRefs: async (threadId, refs, commentId = null) => {
      if (refs.length) await data.addThreadRefs(threadId, refs, commentId);
    },
    setCommentDraft: (v) => set({ commentDraft: v }),
    sendComment: async (photos) => {
      const txt = st.commentDraft.trim();
      if (!txt || !thSel) return;
      set({ commentDraft: '' });
      const cid = await data.addComment(thSel.id, txt, null);
      if (cid && photos && photos.length) await uploadToThread(thSel.id, photos, cid);
      toast(t.commentPosted);
    },
    setReplyTarget: (target) => set({ replyTarget: target, replyDraft: '' }),
    setReplyDraft: (v) => set({ replyDraft: v }),
    sendReply: async (photos) => {
      const txt = st.replyDraft.trim();
      const target = st.replyTarget;
      if (!txt || !thSel || target == null) return;
      set({ replyDraft: '', replyTarget: null });
      const cid = await data.addComment(thSel.id, txt, target);
      if (cid && photos && photos.length) await uploadToThread(thSel.id, photos, cid);
      toast(t.replyPosted);
    },
    convertThread: (id) => {
      const b = data.threads.find((x) => x.id === id);
      if (!b) return;
      set({ modal: { kind: 'newEvent' }, view: 'calendar', form: { title: Lx(b.title), note: Lx(b.body), type: 'gig' } });
      toast(t.ideaLoaded, 'violet');
    },
    toggleThreadPin: async (id) => {
      const b = data.threads.find((x) => x.id === id);
      if (!b) return;
      await data.setThreadPinned(id, !b.pinned);
      toast(b.pinned ? t.unpinned : t.pinned);
    },
    toggleThreadArchive: async (id) => {
      const b = data.threads.find((x) => x.id === id);
      if (!b) return;
      await data.setThreadArchived(id, !b.archived);
      toast(b.archived ? t.unarchived : t.archived);
    },
  };
}
