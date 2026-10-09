// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = {
  owner: null as { profile_id: string } | null,
  rows: [] as Array<Record<string, unknown>>,
  eventsError: false,
  throws: false,
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (state.throws) throw new Error('boom');
      const q: Record<string, unknown> = {};
      q.select = () => q;
      q.eq = () => q;
      q.maybeSingle = async () => ({ data: state.owner });
      q.order = async () => (state.eventsError ? { data: null, error: new Error('x') } : { data: state.rows, error: null });
      void table;
      return q;
    },
  }),
}));

import handler from './calendar';
import { resetRateLimits } from './_rateLimit';

const TOKEN = '123e4567-e89b-12d3-a456-426614174000';

async function get(query?: Record<string, string | string[] | undefined>, method = 'GET', headers?: Record<string, string>) {
  const res = { statusCode: 0, body: '', headers: {} as Record<string, string>, setHeader(k: string, v: string) { this.headers[k] = v; }, end(s: string) { this.body = s; } };
  await handler({ method, query, headers }, res);
  return res;
}

beforeEach(() => {
  resetRateLimits();
  state.owner = { profile_id: 'p1' };
  state.rows = [];
  state.eventsError = false;
  state.throws = false;
});

describe('api/calendar', () => {
  it('throttles a client after 60 requests a minute (per forwarded address)', async () => {
    for (let i = 0; i < 60; i++) expect((await get({ token: TOKEN }, 'GET', { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' })).statusCode).toBe(200);
    expect((await get({ token: TOKEN }, 'GET', { 'x-forwarded-for': '1.2.3.4' })).statusCode).toBe(429);
    expect((await get({ token: TOKEN }, 'GET', { 'x-forwarded-for': '5.6.7.8' })).statusCode).toBe(200);
  });
  it('rejects other methods', async () => {
    expect((await get({ token: TOKEN }, 'POST')).statusCode).toBe(405);
  });
  it('rejects missing or malformed tokens', async () => {
    expect((await get()).statusCode).toBe(401);
    expect((await get({ token: 'nope' })).statusCode).toBe(401);
  });
  it('rejects an unknown token', async () => {
    state.owner = null;
    expect((await get({ token: TOKEN })).statusCode).toBe(401);
  });
  it('serves events as text/calendar (first value when the token repeats; HEAD allowed)', async () => {
    state.rows = [
      { id: 'e1', title_es: 'Gala', venue: 'Teatro', note_es: 'Traer trajes', starts_at: '2026-11-07T20:00:00+00:00', duration_hours: '3', state: 'active' },
      { id: 'e2', title_es: 'Ensayo', venue: null, note_es: null, starts_at: '2026-11-08T18:30:00+00:00', duration_hours: null, state: 'cancelled' },
    ];
    const res = await get({ token: [TOKEN, 'x'] }, 'HEAD');
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toContain('text/calendar');
    expect(res.body).toContain('SUMMARY:Gala');
    expect(res.body).toContain('DTSTART:20261107T200000');
    expect(res.body).toContain('DTEND:20261107T230000');
    expect(res.body).toContain('STATUS:CANCELLED');
    expect(res.body).not.toContain('LOCATION:\r\n');
  });
  it('handles a null event list', async () => {
    state.rows = null as unknown as [];
    expect((await get({ token: TOKEN })).statusCode).toBe(200);
  });
  it('500s on db errors', async () => {
    state.eventsError = true;
    expect((await get({ token: TOKEN })).statusCode).toBe(500);
    state.eventsError = false;
    state.throws = true;
    expect((await get({ token: TOKEN })).statusCode).toBe(500);
  });
});
