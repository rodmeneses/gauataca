import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';

const snapshot = { songs: [], events: [], transactions: [], gear: [], threads: [], links: [], members: [], instruments: [], takes: [], myPollPicks: {} };

vi.mock('./auth', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));
vi.mock('./api', async (orig) => ({
  ...(await orig<typeof import('./api')>()),
  fetchRaw: vi.fn(async (tables: readonly string[]) => Object.fromEntries(tables.map((t) => [t, []]))),
  buildSnapshot: vi.fn(() => snapshot),
  createEvent: vi.fn(async () => 'e1'),
  addTake: vi.fn(async () => undefined),
  setRsvp: vi.fn(async () => undefined),
}));

import * as api from './api';
import { DataProvider, useData } from './data';

let data: ReturnType<typeof useData>;
function Probe() { data = useData(); return null; }

async function mount() {
  render(<DataProvider><Probe /></DataProvider>);
  await waitFor(() => expect(data.loading).toBe(false));
}

const fetchRaw = vi.mocked(api.fetchRaw);
const lastTables = () => [...(fetchRaw.mock.calls.at(-1)?.[0] ?? [])];

beforeEach(() => { fetchRaw.mockClear(); vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('DataProvider scoped refetch', () => {
  it('loads every table on first render', async () => {
    await mount();
    expect(lastTables()).toEqual([...api.TABLES]);
  });

  it('a write refetches only the tables it touched', async () => {
    await mount();
    await act(async () => { await data.createEvent({ title: 't', venue: '', date: '2026-01-01', time: '19:00', hours: 1, fee: 0, cost: 0, note: '', type: 'gig' }); });
    expect(lastTables()).toEqual([...api.SCOPES.events]);
    await act(async () => { await data.addTake('e1', 's1', 'u'); });
    expect(lastTables()).toEqual(['takes']);
  });

  it('an explicit reload() with no scope refetches everything', async () => {
    await mount();
    await act(async () => { await data.reload({ silent: true }); });
    expect(lastTables()).toEqual([...api.TABLES]);
  });

  it('reports a failed write without tearing the screen down', async () => {
    await mount();
    vi.mocked(api.addTake).mockRejectedValueOnce(new Error('nope'));
    const seen = vi.fn();
    window.addEventListener('guataca:mutation-error', seen);
    await act(async () => { await data.addTake('e1', 's1', 'u'); });
    expect(seen).toHaveBeenCalled();
    expect(data.error).toBeNull();
    window.removeEventListener('guataca:mutation-error', seen);
  });

  it('queues a write made offline instead of sending it', async () => {
    await mount();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const queued = vi.fn();
    window.addEventListener('guataca:offline-write', queued);
    vi.mocked(api.setRsvp).mockClear();
    await act(async () => { await data.setRsvp('e1', 'going'); });
    expect(queued).toHaveBeenCalled();
    expect(api.setRsvp).not.toHaveBeenCalled();
    window.removeEventListener('guataca:offline-write', queued);
  });
});
