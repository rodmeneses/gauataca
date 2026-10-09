/** Write side for the forum: ideas, links, comments, polls, reactions and photos. */
import { supabase } from '../supabase';
import { notifyCreated } from '../notify';
import { newId } from './shared';
import type {
  LinkCategory, ReactionKind,
} from '../../types';

export async function createThread(input: { title: string; body: string }, userId: string): Promise<string> {
  const id = newId('t');
  await supabase.from('threads').insert({
    id,
    author_id: userId,
    title_es: input.title,
    title_en: input.title,
    body_es: input.body,
    body_en: input.body,
  }).throwOnError();
  void notifyCreated({ kind: 'thread', id });
  return id;
}

/** Add a general band link. */
export async function createLink(input: { title: string; url: string; category: LinkCategory }, userId: string): Promise<void> {
  await supabase.from('links').insert({ title: input.title, url: input.url, category: input.category, created_by: userId }).throwOnError();
}

/** Remove a general band link. */
export async function deleteLink(id: number): Promise<void> {
  await supabase.from('links').delete().eq('id', id).throwOnError();
}

/** Pin/unpin a forum idea — pinned ideas sort to the top of the active/archived list. */
export async function setThreadPinned(id: string, pinned: boolean): Promise<void> {
  await supabase.from('threads').update({ pinned }).eq('id', id).throwOnError();
}

/** Archive/unarchive a forum idea — archived ideas move out of the active tab. */
export async function setThreadArchived(id: string, archived: boolean): Promise<void> {
  await supabase.from('threads').update({ archived }).eq('id', id).throwOnError();
}

/** Add a comment (or, with `parentId`, a one-level reply) to an idea; returns the new comment id. */
export async function addComment(threadId: string, body: string, userId: string, parentId: number | null = null): Promise<number> {
  const { data } = await supabase.from('thread_comments').insert({
    thread_id: threadId,
    parent_id: parentId,
    author_id: userId,
    body_es: body,
    body_en: body,
  }).select('id').single().throwOnError();
  const cid = data?.id ?? 0;
  if (cid) void notifyCreated({ kind: 'comment', id: threadId, commentId: cid });
  return cid;
}

/** Attach a poll (question + options) to an idea, created alongside it. */
export async function createThreadPoll(
  threadId: string,
  question: string,
  options: string[],
  multiple: boolean,
  _userId: string,
): Promise<void> {
  const { data } = await supabase.from('thread_polls').insert({
    thread_id: threadId,
    question_es: question,
    question_en: question,
    multiple,
  }).select('id').single().throwOnError();
  const pollId = data?.id;
  if (pollId && options.length) {
    await supabase.from('thread_poll_options').insert(
      options.map((o) => ({ poll_id: pollId, label_es: o, label_en: o })),
    ).throwOnError();
  }
}

/** Add another option to an existing idea poll (admins only, enforced by RLS). */
export async function addThreadPollOption(threadId: string, label: string): Promise<void> {
  const { data: poll } = await supabase.from('thread_polls').select('id').eq('thread_id', threadId).single();
  if (!poll?.id) return;
  await supabase.from('thread_poll_options').insert({ poll_id: poll.id, label_es: label, label_en: label }).throwOnError();
}

/**
 * Vote on a poll option. Single-choice polls: re-picking moves the vote, and voting
 * again on the picked option removes it. Multiple-choice polls: toggles that option.
 */
export async function voteThreadPoll(optionId: number, userId: string): Promise<void> {
  const { data: opt } = await supabase.from('thread_poll_options').select('poll_id').eq('id', optionId).single();
  const pollId = opt?.poll_id;
  if (!pollId) return;
  const { data: poll } = await supabase.from('thread_polls').select('multiple').eq('id', pollId).single();
  const { data: opts } = await supabase.from('thread_poll_options').select('id').eq('poll_id', pollId);
  const optIds = (opts ?? []).map((o) => o.id);
  const { data: mine } = await supabase.from('thread_poll_votes').select('option_id').in('option_id', optIds).eq('profile_id', userId);
  const picked = (mine ?? []).some((v) => v.option_id === optionId);
  if (poll?.multiple) {
    if (picked) await supabase.from('thread_poll_votes').delete().eq('option_id', optionId).eq('profile_id', userId).throwOnError();
    else await supabase.from('thread_poll_votes').insert({ option_id: optionId, profile_id: userId }).throwOnError();
    return;
  }
  await supabase.from('thread_poll_votes').delete().in('option_id', optIds).eq('profile_id', userId).throwOnError();
  if (!picked) {
    await supabase.from('thread_poll_votes').insert({ option_id: optionId, profile_id: userId }).throwOnError();
  }
}

/** Set the signed-in member's like/dislike on an idea; `null` removes it. */
export async function setThreadReaction(threadId: string, kind: ReactionKind | null, userId: string): Promise<void> {
  if (kind === null) {
    await supabase.from('thread_reactions').delete().eq('thread_id', threadId).eq('profile_id', userId).throwOnError();
  } else {
    await supabase.from('thread_reactions').upsert(
      { thread_id: threadId, profile_id: userId, kind },
      { onConflict: 'thread_id,profile_id' },
    ).throwOnError();
    if (kind === 'like') void notifyCreated({ kind: 'reaction', id: threadId });
  }
}

/** Delete a comment (its replies, reactions, media rows and refs cascade); also removes uploaded photos from storage. */
export async function deleteComment(id: number): Promise<void> {
  const { data: ids } = await supabase.from('thread_comments').select('id').or(`id.eq.${id},parent_id.eq.${id}`);
  const { data: media } = await supabase.from('thread_media').select('url').in('comment_id', (ids ?? []).map((r) => r.id));
  const { error } = await supabase.from('thread_comments').delete().eq('id', id);
  if (error) throw error;
  const marker = '/storage/v1/object/public/forum-photos/';
  const paths = (media ?? []).map((m) => m.url).filter((u): u is string => !!u && u.includes(marker)).map((u) => u.slice(u.indexOf(marker) + marker.length));
  if (paths.length) await supabase.storage.from('forum-photos').remove(paths);
}

/** Set the signed-in member's like/dislike on a comment; `null` removes it. */
export async function setCommentReaction(commentId: number, kind: ReactionKind | null, userId: string): Promise<void> {
  if (kind === null) {
    await supabase.from('thread_comment_reactions').delete().eq('comment_id', commentId).eq('profile_id', userId).throwOnError();
  } else {
    await supabase.from('thread_comment_reactions').upsert(
      { comment_id: commentId, profile_id: userId, kind },
      { onConflict: 'comment_id,profile_id' },
    ).throwOnError();
    if (kind === 'like') void notifyCreated({ kind: 'reaction', commentId });
  }
}

/** Attach uploaded photo URLs to an idea or one of its comments; true on success. */
export async function addThreadMedia(threadId: string, urls: string[], userId: string, commentId: number | null = null): Promise<boolean> {
  if (urls.length === 0) return false;
  const { error } = await supabase.from('thread_media').insert(
    urls.map((url) => ({ thread_id: threadId, comment_id: commentId, url, author_id: userId })),
  );
  return !error;
}

/** Remove a thread-media row; also deletes the storage object when it's an uploaded photo. */
export async function deleteThreadMedia(id: number): Promise<void> {
  const { data: row } = await supabase.from('thread_media').select('url').eq('id', id).single();
  await supabase.from('thread_media').delete().eq('id', id).throwOnError();
  if (row?.url) {
    const marker = '/storage/v1/object/public/forum-photos/';
    const idx = row.url.indexOf(marker);
    if (idx >= 0) {
      const path = row.url.slice(idx + marker.length);
      await supabase.storage.from('forum-photos').remove([path]);
    }
  }
}

/** Attach song/event references to an idea or one of its comments, skipping dups; true on success. */
export async function addThreadRefs(
  threadId: string,
  refs: { kind: 'song' | 'event'; id: string }[],
  userId: string,
  commentId: number | null = null,
): Promise<boolean> {
  if (refs.length === 0) return false;
  const { data: existing } = await supabase
    .from('thread_refs')
    .select('ref_kind, ref_id')
    .eq('thread_id', threadId)
    .eq('comment_id', commentId);
  const have = new Set((existing ?? []).map((r) => `${r.ref_kind}:${r.ref_id}`));
  const fresh = refs.filter((r) => !have.has(`${r.kind}:${r.id}`));
  if (fresh.length === 0) return true;
  const { error } = await supabase.from('thread_refs').insert(
    fresh.map((r) => ({ thread_id: threadId, comment_id: commentId, ref_kind: r.kind, ref_id: r.id, author_id: userId })),
  );
  return !error;
}

/** Upload a forum photo to the public `forum-photos` bucket; returns its public URL. */
export async function uploadForumPhoto(blob: Blob): Promise<string> {
  const path = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from('forum-photos').upload(path, blob, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('forum-photos').getPublicUrl(path);
  return data.publicUrl;
}
