/**
 * Vercel serverless function (`api/notify.ts`) — the fan-out half of Web Push.
 *
 * Triggered app-side after a write (src/lib/notify.ts → POST /api/notify with
 * `{ kind: 'event' | 'thread' | 'comment' | 'reaction', id, commentId? }`). It:
 *   1. re-reads the row from Supabase (service role) so the payload reflects the
 *      DB, never the request;
 *   2. excludes the author — and for `reaction` targets only the author (whoever
 *      the liker is is excluded);
 *   3. sends a Web Push notification to every subscription whose category pref
 *      is on, pruning subscriptions the push service reports as expired.
 *
 * Hardening: every call needs a valid member session (401), ids are validated (400),
 * thread/comment pushes may only be triggered by the row's author (403), and each
 * member is limited to 30 pushes per minute per instance (429).
 *
 * Env vars (Vercel, server-only): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.
 */
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const admin = createClient(url, key);

const publicKey = process.env.VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@gauataca.vercel.app';
if (publicKey && privateKey) webpush.setVapidDetails(subject, publicKey, privateKey);

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
/** Best-effort, per serverless instance: actor id → timestamps of recent calls. */
const hits = new Map<string, number[]>();

function rateLimited(actor: string, now = Date.now()): boolean {
  const recent = (hits.get(actor) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(actor, recent);
  return recent.length > RATE_LIMIT;
}

const validId = (v: unknown): boolean =>
  (typeof v === 'string' && /^[\w-]{1,64}$/.test(v)) || (typeof v === 'number' && Number.isSafeInteger(v));

function dateLabel(startsAt: string): string {
  return new Date(startsAt).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
}

/**
 * Handler. Inline `(req, res)` keeps the function dependency-free — Vercel
 * compiles `api/*.ts` with esbuild and runs it on the Node runtime.
 */
export default async function handler(req: { method?: string; body?: Record<string, unknown>; headers?: Record<string, string> }, res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (s: string) => void }): Promise<void> {
  const send = (status: number, body?: string) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(body ? JSON.stringify({ error: body }) : '{}');
  };

  if (req.method !== 'POST') return send(405, 'method not allowed');

  // Vercel parses the JSON body when the client sends application/json.
  const body = req.body ?? {};
  const kind = body.kind;
  if (kind !== 'event' && kind !== 'thread' && kind !== 'comment' && kind !== 'reaction') return send(400, 'unknown kind');
  if (!body.id && body.commentId === undefined) return send(400, 'missing id');
  if (body.id !== undefined && !validId(body.id)) return send(400, 'invalid id');
  if (body.commentId !== undefined && !(typeof body.commentId === 'number' && Number.isSafeInteger(body.commentId))) return send(400, 'invalid commentId');
  if (!publicKey || !privateKey) return send(500, 'VAPID keys not configured');

  // Only signed-in members may trigger a push, and not in bulk.
  const token = req.headers?.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return send(401, 'unauthorized');
  let actor: string | null = null;
  try {
    const { data, error } = await admin.auth.getUser(token);
    actor = error ? null : (data.user?.id ?? null);
  } catch {
    actor = null;
  }
  if (!actor) return send(401, 'unauthorized');
  if (rateLimited(actor)) return send(429, 'too many requests');

  // Build the notification payload from the DB (never trust the request text).
  let title: string;
  let bodyText: string;
  let targetUrl: string;
  let exclude: string | null;
  let notifyId: string | null = null; // reaction pushes go to this member only
  try {
    if (kind === 'event') {
      const { data } = await admin.from('events').select('title_es, starts_at, venue').eq('id', body.id).single();
      if (!data) return send(404, 'event not found');
      title = data.title_es || 'GUATACA';
      bodyText = data.venue ? `${data.venue} · ${dateLabel(data.starts_at)}` : dateLabel(data.starts_at);
      targetUrl = `/?view=calendar&event=${encodeURIComponent(String(body.id))}`;
      exclude = actor;
    } else if (kind === 'thread') {
      const { data } = await admin.from('threads').select('title_es, author_id').eq('id', body.id).single();
      if (!data) return send(404, 'thread not found');
      if (data.author_id !== actor) return send(403, 'not the author');
      title = data.title_es || 'GUATACA';
      bodyText = 'Nuevo tema del foro';
      targetUrl = `/?view=brainstorm&thread=${encodeURIComponent(String(body.id))}`;
      exclude = data.author_id;
    } else if (kind === 'reaction') {
      const commentId = typeof body.commentId === 'number' ? body.commentId : null;
      if (commentId) {
        const { data } = await admin
          .from('thread_comments')
          .select('author_id, body_es, thread_id, threads!inner(title_es)')
          .eq('id', commentId)
          .single();
        if (!data) return send(404, 'comment not found');
        title = data.threads?.title_es || 'GUATACA';
        bodyText = 'Le gustó tu comentario';
        targetUrl = `/?view=brainstorm&thread=${encodeURIComponent(data.thread_id)}`;
        notifyId = data.author_id;
      } else {
        const { data } = await admin.from('threads').select('title_es, author_id').eq('id', body.id).single();
        if (!data) return send(404, 'thread not found');
        title = data.title_es || 'GUATACA';
        bodyText = 'Le gustó tu idea';
        targetUrl = `/?view=brainstorm&thread=${encodeURIComponent(String(body.id))}`;
        notifyId = data.author_id;
      }
      exclude = actor;
    } else {
      const commentId = typeof body.commentId === 'number' ? body.commentId : body.id;
      const { data } = await admin
        .from('thread_comments')
        .select('author_id, body_es, thread_id, threads!inner(title_es)')
        .eq('id', commentId)
        .single();
      if (!data) return send(404, 'comment not found');
      if (data.author_id !== actor) return send(403, 'not the author');
      title = data.threads?.title_es || 'GUATACA';
      bodyText = (data.body_es || '').slice(0, 120) || 'Nuevo comentario';
      targetUrl = `/?view=brainstorm&thread=${encodeURIComponent(data.thread_id)}`;
      exclude = data.author_id;
    }
  } catch {
    return send(500, 'db error');
  }

  const payload = JSON.stringify({ title, body: bodyText, url: targetUrl });

  // Recipients: subscriptions whose owner has the category pref on, minus the
  // author. The pref lives on `profiles`, the device rows on `push_subscriptions`
  // — one inner-join query filters by both. Reaction pushes are targeted: only
  // the author's devices, and only if the liker isn't the author themselves.
  const prefColumn = kind === 'event' ? 'notify_events' : 'notify_forum';
  let query = admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, profiles!inner(id)')
    .eq(`profiles.${prefColumn}`, true);
  if (!notifyId && kind === 'reaction') return send(200);
  if (kind === 'reaction') query = query.eq('profiles.id', notifyId);
  if (exclude) query = query.neq('profiles.id', exclude);
  const { data: subscriptions } = await query;
  if (!subscriptions?.length) return send(200);

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload),
    ),
  );

  // Prune subscriptions the push service reports as gone (404/410).
  const expired: string[] = [];
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const code = (result.reason as { statusCode?: number })?.statusCode;
      if (code === 404 || code === 410) expired.push(subscriptions[i].endpoint);
    }
  });
  if (expired.length) {
    await admin.from('push_subscriptions').delete().in('endpoint', expired);
  }

  send(200);
}
