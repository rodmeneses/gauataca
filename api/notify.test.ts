// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, unknown> | null;
const state = {
  rows: {} as Record<string, Row>, // keyed by table
  subs: [] as Array<{ endpoint: string; p256dh: string; auth: string }>,
  user: null as { id: string } | null,
  getUserThrows: false,
  selectThrows: false,
  deleted: [] as string[][],
  filters: [] as Array<[string, unknown]>,
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => {
        if (state.getUserThrows) throw new Error('boom');
        return state.user ? { data: { user: state.user }, error: null } : { data: { user: null }, error: new Error('bad') };
      },
    },
    from: (table: string) => {
      const q: Record<string, unknown> = {};
      q.select = () => { if (state.selectThrows) throw new Error('db'); return q; };
      q.eq = (c: string, v: unknown) => { state.filters.push([c, v]); return q; };
      q.neq = (c: string, v: unknown) => { state.filters.push([`!${c}`, v]); return q; };
      q.single = async () => ({ data: state.rows[table] ?? null });
      q.delete = () => q;
      q.in = async (_c: string, v: string[]) => { state.deleted.push(v); return {}; };
      q.then = (res: (v: unknown) => void) => res({ data: state.subs });
      return q;
    },
  }),
}));

const sendNotification = vi.fn();
vi.mock('web-push', () => ({ default: { setVapidDetails: vi.fn(), sendNotification: (...a: unknown[]) => sendNotification(...a) } }));

type Handler = (typeof import('./notify'))['default'];
type Req = Parameters<Handler>[0];

async function load(keys = true): Promise<Handler> {
  vi.resetModules();
  if (keys) { process.env.VAPID_PUBLIC_KEY = 'pub'; process.env.VAPID_PRIVATE_KEY = 'priv'; }
  else { delete process.env.VAPID_PUBLIC_KEY; delete process.env.VAPID_PRIVATE_KEY; }
  return (await import('./notify')).default;
}

async function run(handler: Handler, req: Req) {
  const res = { statusCode: 0, body: '', setHeader() {}, end(s: string) { this.body = s; } };
  await handler(req, res);
  return res;
}

const post = (body: Record<string, unknown>, headers: Record<string, string> = { authorization: 'Bearer t' }): Req => ({ method: 'POST', body, headers });

beforeEach(() => {
  state.rows = {}; state.subs = []; state.user = { id: 'u0' }; state.getUserThrows = false; state.selectThrows = false;
  state.deleted = []; state.filters = [];
  sendNotification.mockReset().mockResolvedValue({});
});

describe('api/notify validation', () => {
  it('rejects non-POST', async () => {
    expect((await run(await load(), { method: 'GET' })).statusCode).toBe(405);
  });
  it('rejects unknown kind and missing id', async () => {
    const h = await load();
    expect((await run(h, post({ kind: 'x', id: '1' }))).statusCode).toBe(400);
    expect((await run(h, post({ kind: 'event' }))).statusCode).toBe(400);
    expect((await run(h, { method: 'POST' })).statusCode).toBe(400);
  });
  it('rejects malformed ids', async () => {
    const h = await load();
    expect((await run(h, post({ kind: 'event', id: "x' or 1=1" }))).statusCode).toBe(400);
    expect((await run(h, post({ kind: 'event', id: { $ne: 1 } }))).statusCode).toBe(400);
    expect((await run(h, post({ kind: 'comment', commentId: -3 }))).statusCode).toBe(400);
    expect((await run(h, post({ kind: 'comment', commentId: '5' }))).statusCode).toBe(400);
  });
  it('requires a signed-in caller', async () => {
    const h = await load();
    expect((await run(h, post({ kind: 'thread', id: 't1' }, {}))).statusCode).toBe(401);
    state.user = null;
    expect((await run(h, post({ kind: 'thread', id: 't1' }))).statusCode).toBe(401);
    state.user = { id: 'u0' };
    state.getUserThrows = true;
    expect((await run(h, { method: 'POST', body: { kind: 'thread', id: 't1' } })).statusCode).toBe(401);
    expect((await run(h, post({ kind: 'thread', id: 't1' }))).statusCode).toBe(401);
  });
  it('rate-limits a caller after 30 pushes a minute', async () => {
    state.rows.threads = { title_es: 'Idea', author_id: 'a1' };
    const h = await load();
    for (let i = 0; i < 30; i++) expect((await run(h, post({ kind: 'thread', id: 't1' }))).statusCode).toBe(200);
    expect((await run(h, post({ kind: 'thread', id: 't1' }))).statusCode).toBe(429);
  });
  it('500s when VAPID keys are missing', async () => {
    expect((await run(await load(false), post({ kind: 'event', id: '1' }))).statusCode).toBe(500);
  });
});

describe('api/notify fan-out', () => {
  const sub = { endpoint: 'https://push/1', p256dh: 'k', auth: 'a' };

  it('pushes an event to subscribers, excluding the actor', async () => {
    state.rows.events = { title_es: 'Gala', starts_at: '2026-11-07T20:00:00Z', venue: 'Teatro' };
    state.subs = [sub];
    state.user = { id: 'u1' };
    const res = await run(await load(), post({ kind: 'event', id: 'e1' }, { authorization: 'Bearer t' }));
    expect(res.statusCode).toBe(200);
    expect(sendNotification).toHaveBeenCalledOnce();
    expect(JSON.parse(sendNotification.mock.calls[0][1])).toMatchObject({ title: 'Gala', url: '/?view=calendar&event=e1' });
    expect(state.filters).toContainEqual(['!profiles.id', 'u1']);
    expect(state.filters).toContainEqual(['profiles.notify_events', true]);
  });

  it('copes with a missing venue and title', async () => {
    state.rows.events = { title_es: '', starts_at: '2026-11-07T20:00:00Z', venue: '' };
    state.subs = [sub];
    const res = await run(await load(), post({ kind: 'event', id: 'e1' }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(sendNotification.mock.calls[0][1]).title).toBe('GUATACA');
  });

  it('404s when the row is missing', async () => {
    const h = await load();
    for (const kind of ['event', 'thread', 'comment']) {
      expect((await run(h, post({ kind, id: 'x' }))).statusCode).toBe(404);
    }
    expect((await run(h, post({ kind: 'reaction', id: 'x' }))).statusCode).toBe(404);
    expect((await run(h, post({ kind: 'reaction', commentId: 9 }))).statusCode).toBe(404);
  });

  it('pushes a thread excluding its author', async () => {
    state.rows.threads = { title_es: 'Idea', author_id: 'a1' };
    state.subs = [sub];
    expect((await run(await load(), post({ kind: 'thread', id: 't1' }))).statusCode).toBe(200);
    expect(state.filters).toContainEqual(['!profiles.id', 'a1']);
    expect(state.filters).toContainEqual(['profiles.notify_forum', true]);
  });

  it('pushes a comment (by commentId or id), truncating the body', async () => {
    state.rows.thread_comments = { author_id: 'a2', body_es: 'x'.repeat(200), thread_id: 't1', threads: { title_es: 'Idea' } };
    state.subs = [sub];
    const h = await load();
    expect((await run(h, post({ kind: 'comment', id: 't1', commentId: 5 }))).statusCode).toBe(200);
    expect((await run(h, post({ kind: 'comment', id: 7 }))).statusCode).toBe(200);
    expect(JSON.parse(sendNotification.mock.calls[0][1]).body).toHaveLength(120);
  });

  it('falls back to default comment text and title', async () => {
    state.rows.thread_comments = { author_id: 'a2', body_es: '', thread_id: 't1', threads: null };
    state.subs = [sub];
    await run(await load(), post({ kind: 'comment', id: 7 }));
    expect(JSON.parse(sendNotification.mock.calls[0][1])).toMatchObject({ title: 'GUATACA', body: 'Nuevo comentario' });
  });

  it('targets only the author on reactions', async () => {
    state.subs = [sub];
    const h = await load();
    state.rows.threads = { title_es: '', author_id: 'a3' };
    expect((await run(h, post({ kind: 'reaction', id: 't1' }))).statusCode).toBe(200);
    expect(state.filters).toContainEqual(['profiles.id', 'a3']);
    state.rows.thread_comments = { author_id: 'a4', thread_id: 't1', threads: { title_es: 'Idea' } };
    expect((await run(h, post({ kind: 'reaction', commentId: 2 }))).statusCode).toBe(200);
    expect(state.filters).toContainEqual(['profiles.id', 'a4']);
  });

  it('skips reaction pushes with no target author', async () => {
    state.rows.threads = { title_es: 'Idea', author_id: null };
    state.subs = [sub];
    expect((await run(await load(), post({ kind: 'reaction', id: 't1' }))).statusCode).toBe(200);
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('returns 200 with no subscribers', async () => {
    state.rows.threads = { title_es: 'Idea', author_id: 'a1' };
    expect((await run(await load(), post({ kind: 'thread', id: 't1' }))).statusCode).toBe(200);
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('prunes expired subscriptions only', async () => {
    state.rows.threads = { title_es: 'Idea', author_id: 'a1' };
    state.subs = [sub, { ...sub, endpoint: 'gone' }, { ...sub, endpoint: 'err' }];
    sendNotification
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce({ statusCode: 410 })
      .mockRejectedValueOnce({ statusCode: 500 });
    await run(await load(), post({ kind: 'thread', id: 't1' }));
    expect(state.deleted).toEqual([['gone']]);
  });

  it('500s on a database error', async () => {
    state.selectThrows = true;
    expect((await run(await load(), post({ kind: 'thread', id: 't1' }))).statusCode).toBe(500);
  });
});
