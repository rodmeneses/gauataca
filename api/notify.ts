/**
 * Vercel serverless function (`api/notify.ts`) — the fan-out half of Web Push.
 *
 * Triggered app-side after a write (src/lib/notify.ts → POST /api/notify with
 * `{ kind: 'event' | 'thread' | 'comment', id, commentId? }`). It:
 *   1. re-reads the row from Supabase (service role) so the payload reflects the
 *      DB, never the request;
 *   2. excludes the author;
 *   3. sends a Web Push notification to every subscription whose category pref
 *      is on, pruning subscriptions the push service reports as expired.
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
  if (kind !== 'event' && kind !== 'thread' && kind !== 'comment') return send(400, 'unknown kind');
  if (!body.id) return send(400, 'missing id');
  if (!publicKey || !privateKey) return send(500, 'VAPID keys not configured');

  // Event pushes go to everyone except the acting member; thread/comment
  // pushes exclude by row author_id instead (resolved from the DB below).
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  let actor: string | null = null;
  if (token && kind === 'event') {
    try {
      const { data, error } = await admin.auth.getUser(token);
      actor = error ? null : (data.user?.id ?? null);
    } catch {
      actor = null;
    }
  }

  // Build the notification payload from the DB (never trust the request text).
  let title = 'GUATACA';
  let bodyText = '';
  let exclude: string | null = null;
  try {
    if (kind === 'event') {
      const { data } = await admin.from('events').select('title_es, starts_at, venue').eq('id', body.id).single();
      if (!data) return send(404, 'event not found');
      title = data.title_es || 'GUATACA';
      bodyText = data.venue ? `${data.venue} · ${dateLabel(data.starts_at)}` : dateLabel(data.starts_at);
      exclude = actor;
    } else if (kind === 'thread') {
      const { data } = await admin.from('threads').select('title_es, author_id').eq('id', body.id).single();
      if (!data) return send(404, 'thread not found');
      title = data.title_es || 'GUATACA';
      bodyText = 'Nuevo tema del foro';
      exclude = data.author_id;
    } else {
      const commentId = typeof body.commentId === 'number' ? body.commentId : body.id;
      const { data } = await admin
        .from('thread_comments')
        .select('author_id, body_es, threads!inner(title_es)')
        .eq('id', commentId)
        .single();
      if (!data) return send(404, 'comment not found');
      title = data.threads?.title_es || 'GUATACA';
      bodyText = (data.body_es || '').slice(0, 120) || 'Nuevo comentario';
      exclude = data.author_id;
    }
  } catch {
    return send(500, 'db error');
  }

  const targetUrl = kind === 'event' ? '/?view=calendar' : '/?view=brainstorm';
  const payload = JSON.stringify({ title, body: bodyText, url: targetUrl });

  // Recipients: subscriptions whose owner has the category pref on, minus the
  // author. The pref lives on `profiles`, the device rows on `push_subscriptions`
  // — one inner-join query filters by both.
  const prefColumn = kind === 'event' ? 'notify_events' : 'notify_forum';
  let query = admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, profiles!inner(id)')
    .eq(`profiles.${prefColumn}`, true);
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
