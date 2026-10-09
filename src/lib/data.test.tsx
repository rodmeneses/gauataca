import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  fetchAll: vi.fn(),
  createEvent: vi.fn(),
  deleteLink: vi.fn(),
}));
// Every other api function is an inert stub; `then`/`__esModule` must stay undefined or the module looks thenable.
vi.mock('./api', () => new Proxy(api, { get: (t, k) => (k in t ? t[k as keyof typeof t] : typeof k === 'symbol' || k === 'then' || k === '__esModule' ? undefined : vi.fn()) }));
vi.mock('./auth', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));

import { DataProvider, useData } from './data';

type Data = ReturnType<typeof useData>;
let latest: Data;
function Probe() {
  latest = useData();
  return null;
}
const mount = () => render(<DataProvider><Probe /></DataProvider>);
const snapshot = (over: Record<string, unknown> = {}) => ({ songs: [], events: [], transactions: [], gear: [], threads: [], links: [], members: [], instruments: [], takes: [], myPollPicks: {}, ...over });
const input = { title: 't', venue: 'v', date: '2026-11-07', time: '19:00', hours: 1, fee: 0, cost: 0, note: '', type: 'gig' as const };

const events: string[] = [];
const listen = (name: string) => window.addEventListener(name, (e) => events.push(`${name}:${JSON.stringify((e as CustomEvent).detail ?? null)}`));
const setOnline = (v: boolean) => Object.defineProperty(window.navigator, 'onLine', { value: v, configurable: true });

beforeEach(() => {
  events.length = 0;
  api.fetchAll.mockReset().mockResolvedValue(snapshot());
  api.createEvent.mockReset().mockResolvedValue('e1');
  setOnline(true);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  ['guataca:mutation-error', 'guataca:offline-write', 'guataca:queue-flushed'].forEach(listen);
});
afterEach(() => {
  vi.restoreAllMocks();
  setOnline(true);
});

describe('DataProvider', () => {
  it('loads the snapshot for the signed-in user', async () => {
    api.fetchAll.mockResolvedValue(snapshot({ songs: [{ id: 's1' }] }));
    mount();
    await waitFor(() => expect(latest.loading).toBe(false));
    expect(api.fetchAll).toHaveBeenCalledWith('u1');
    expect(latest.songs).toEqual([{ id: 's1' }]);
    expect(latest.error).toBeNull();
  });

  it('exposes the error and an empty snapshot when the first load fails', async () => {
    api.fetchAll.mockRejectedValue(new Error('schema missing'));
    mount();
    await waitFor(() => expect(latest.loading).toBe(false));
    expect(latest.error).toBe('schema missing');
    expect(latest.songs).toEqual([]);
  });

  it('writes, then silently refetches and returns the result', async () => {
    mount();
    await waitFor(() => expect(latest.loading).toBe(false));
    let id: string | undefined;
    await act(async () => { id = await latest.createEvent(input); });
    expect(id).toBe('e1');
    expect(api.createEvent).toHaveBeenCalledWith(input, 'u1');
    expect(api.fetchAll).toHaveBeenCalledTimes(2);
    expect(latest.loading).toBe(false);
    expect(latest.mutating).toBe(false);
  });

  it('reports a failed write with its reason instead of pretending it saved', async () => {
    api.createEvent.mockRejectedValue(Object.assign(new Error('rls'), { code: '42501' }));
    mount();
    await waitFor(() => expect(latest.loading).toBe(false));
    let id: string | undefined = 'sentinel';
    await act(async () => { id = await latest.createEvent(input); });
    expect(id).toBeUndefined();
    expect(events).toContain('guataca:mutation-error:{"reason":"denied"}');
    expect(api.fetchAll).toHaveBeenCalledTimes(1);
    expect(latest.mutating).toBe(false);
  });

  it('reports a failed background refetch without tearing the screen down', async () => {
    api.fetchAll.mockResolvedValueOnce(snapshot({ songs: [{ id: 's1' }] })).mockRejectedValueOnce(new Error('boom'));
    mount();
    await waitFor(() => expect(latest.loading).toBe(false));
    await act(async () => { await latest.createEvent(input); });
    expect(events.some((e) => e.startsWith('guataca:mutation-error'))).toBe(true);
    expect(latest.songs).toEqual([{ id: 's1' }]);
    expect(latest.error).toBeNull();
  });

  it('queues writes made offline and replays them on reconnect', async () => {
    mount();
    await waitFor(() => expect(latest.loading).toBe(false));
    setOnline(false);
    await act(async () => { await latest.createEvent(input); });
    expect(api.createEvent).not.toHaveBeenCalled();
    expect(events).toContain('guataca:offline-write:null');

    setOnline(true);
    await act(async () => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(api.createEvent).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(events).toContain('guataca:queue-flushed:{"failed":0}'));
  });

  it('hides a deleted link right away and cancels the delete on undo', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    api.fetchAll.mockResolvedValue(snapshot({ links: [{ id: 5, title: 'x' }] }));
    mount();
    await vi.waitFor(() => expect(latest.links).toHaveLength(1));
    let undo = () => {};
    act(() => { undo = latest.deleteLink(5); });
    expect(latest.links).toHaveLength(0);
    act(() => undo());
    expect(latest.links).toHaveLength(1);
    await act(async () => { vi.advanceTimersByTime(60_000); });
    expect(api.deleteLink).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
