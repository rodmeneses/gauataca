/**
 * Vercel serverless function (`api/calendar.ts`) — a subscribable iCalendar feed.
 *
 * GET /api/calendar?token=<uuid> returns every event as `text/calendar`, so a
 * member can subscribe from Apple/Google/Outlook Calendar. The token comes from
 * the member's own `calendar_tokens` row (see V13 migration); it is resolved
 * server-side with the service-role key and never exposes member identity.
 *
 * Env vars (Vercel, server-only): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from '@supabase/supabase-js';
import { buildIcsFeed, type IcsEvent } from '../src/lib/icsFeed.js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const admin = createClient(url, key);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Res = { statusCode: number; setHeader: (k: string, v: string) => void; end: (s: string) => void };

export default async function handler(req: { method?: string; query?: Record<string, string | string[] | undefined> }, res: Res): Promise<void> {
  const fail = (status: number, msg: string) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(msg);
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') return fail(405, 'method not allowed');
  const raw = req.query?.token;
  const token = Array.isArray(raw) ? raw[0] : raw;
  if (!token || !UUID.test(token)) return fail(401, 'invalid token');

  try {
    const { data: owner } = await admin.from('calendar_tokens').select('profile_id').eq('token', token).maybeSingle();
    if (!owner) return fail(401, 'invalid token');

    const { data: rows, error } = await admin
      .from('events')
      .select('id, title_es, venue, note_es, starts_at, duration_hours, state')
      .order('starts_at');
    if (error) return fail(500, 'db error');

    const events: IcsEvent[] = (rows ?? []).map((e) => ({
      id: e.id,
      title: e.title_es,
      venue: e.venue ?? '',
      note: e.note_es ?? '',
      date: String(e.starts_at).slice(0, 10),
      time: String(e.starts_at).slice(11, 16),
      hours: e.duration_hours != null ? Number(e.duration_hours) : undefined,
      cancelled: e.state === 'cancelled',
    }));

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.end(buildIcsFeed(events, 'GUATACA'));
  } catch {
    fail(500, 'db error');
  }
}
