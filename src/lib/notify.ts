/**
 * Fire-and-forget notification trigger. After a write succeeds, tell the Vercel
 * backend (`api/notify.ts`) to fan the change out as Web Push notifications.
 *
 * Only fired for the pushable events (new event / forum thread / comment) and
 * deliberately best-effort: a failure here must never block the write or toast.
 * See `src/lib/push.tsx` for the subscription + opt-in model.
 */
import { supabase } from './supabase';

export type NotifyKind = 'event' | 'thread' | 'comment' | 'reaction';

export interface NotifyPayload {
  kind: NotifyKind;
  /** events.id / threads.id; for comments, the thread id. Absent for a comment reaction (commentId is used). */
  id?: string;
  /** comment id — for a comment push ('comment') or a like on a comment ('reaction'). */
  commentId?: number;
}

/**
 * Ask the backend to push this change out. Best-effort: a failure here must
 * never break the write, toast, or reload. The author is excluded server-side.
 */
export async function notifyCreated(payload: NotifyPayload): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Push is best-effort — swallow failures silently.
  }
}
