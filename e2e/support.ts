/** In-memory Supabase stand-in for the smoke tests: auth session + PostgREST tables. */
import type { Page, Request } from '@playwright/test';

export const SUPABASE = 'http://localhost:54321';
const USER = { id: 'u-e2e', email: 'e2e@example.com' };

type Row = Record<string, unknown>;

export interface FakeBackend {
  tables: Record<string, Row[]>;
  /** Every write the app sent: method + table + parsed body. */
  writes: Array<{ method: string; table: string; body: unknown }>;
}

/** A syntactically valid JWT (header.payload.signature) that never expires. */
function fakeJwt(): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: USER.id, role: 'authenticated', exp: 4102444800 })}.sig`;
}

const session = () => ({
  access_token: fakeJwt(),
  refresh_token: 'e2e-refresh',
  token_type: 'bearer',
  expires_in: 3600 * 24 * 365,
  expires_at: 4102444800,
  user: { id: USER.id, email: USER.email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
});

export async function mockSupabase(page: Page, opts: { signedIn?: boolean; tables?: Record<string, Row[]> } = {}): Promise<FakeBackend> {
  const backend: FakeBackend = {
    tables: {
      profiles: [{ id: USER.id, name: 'E2E Tester', email: USER.email, role: 'admin', onboarded: true, joined_at: '2026-01-01' }],
      ...opts.tables,
    },
    writes: [],
  };

  if (opts.signedIn !== false) {
    await page.addInitScript((s) => {
      localStorage.setItem('sb-localhost-auth-token', JSON.stringify(s));
      // Skip the first-run tour and "what's new" so tests start from a clean screen.
      localStorage.setItem('guataca.tour', 'done');
    }, session());
  }

  await page.route(`${SUPABASE}/auth/v1/**`, async (route) => {
    const url = route.request().url();
    if (url.includes('/token')) return route.fulfill({ json: session() });
    if (url.includes('/user')) return route.fulfill({ json: session().user });
    return route.fulfill({ json: {} });
  });

  await page.route(`${SUPABASE}/rest/v1/**`, async (route) => {
    const req: Request = route.request();
    const table = new URL(req.url()).pathname.split('/').pop() ?? '';
    const method = req.method();
    if (method === 'GET' || method === 'HEAD') {
      const rows = backend.tables[table] ?? [];
      // `.single()` / `.maybeSingle()` ask for one object.
      const wantsOne = (req.headers()['accept'] ?? '').includes('vnd.pgrst.object');
      if (wantsOne) {
        return rows[0] ? route.fulfill({ json: rows[0] }) : route.fulfill({ status: 406, json: { code: 'PGRST116', message: 'no rows' } });
      }
      return route.fulfill({ json: rows });
    }
    if (method === 'OPTIONS') return route.fulfill({ status: 204 });
    const body = req.postDataJSON?.() ?? null;
    backend.writes.push({ method, table, body });
    if (method === 'POST') {
      const inserted = (Array.isArray(body) ? body : [body]) as Row[];
      (backend.tables[table] ??= []).push(...inserted);
      return route.fulfill({ status: 201, json: Array.isArray(body) ? inserted : inserted[0] });
    }
    return route.fulfill({ status: 204 });
  });

  // Everything else on the Supabase origin (storage, realtime) is out of scope.
  await page.route(`${SUPABASE}/storage/**`, (route) => route.fulfill({ json: {} }));
  return backend;
}

export const futureEvent = (over: Row = {}): Row => ({
  id: 'e-gala',
  type: 'gig',
  state: 'active',
  starts_at: '2099-11-07T20:00:00+00:00',
  duration_hours: 3,
  venue: 'Teatro E2E',
  fee_cents: 50000,
  cost_cents: 10000,
  settled: false,
  pinned: false,
  title_es: 'Gala E2E',
  title_en: 'Gala E2E',
  note_es: '',
  note_en: '',
  ...over,
});
