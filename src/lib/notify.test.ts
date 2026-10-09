import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getSession = vi.fn();
vi.mock('./supabase', () => ({ supabase: { auth: { getSession: (...a: unknown[]) => getSession(...a) } } }));

import { notifyCreated } from './notify';

describe('notifyCreated', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    fetchMock.mockReset();
    getSession.mockReset();
  });

  it('POSTs the payload with the bearer token when signed in', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    await notifyCreated({ kind: 'event', id: 'e1' });
    expect(fetchMock).toHaveBeenCalledWith('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok' },
      body: JSON.stringify({ kind: 'event', id: 'e1' }),
    });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('omits Authorization without a session', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    await notifyCreated({ kind: 'thread', id: 't1' });
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('logs but does not throw on a non-ok response', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    await expect(notifyCreated({ kind: 'comment', id: 't1', commentId: 3 })).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith('Push notify failed:', 500);
  });

  it('logs but does not throw when the request fails', async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    fetchMock.mockRejectedValue(new Error('offline'));
    await expect(notifyCreated({ kind: 'reaction', commentId: 1 })).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalled();
  });
});
