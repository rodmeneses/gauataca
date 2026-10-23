import { describe, expect, it, vi } from 'vitest';

const tables: Record<string, unknown[]> = {};
vi.mock('../supabase', () => ({
  supabase: {
    from: (t: string) => {
      const res = Promise.resolve({ data: tables[t] ?? null, error: null });
      return { select: () => Object.assign(res, { order: () => res }) };
    },
  },
}));

import { fetchAll } from './fetch';

describe('fetchAll', () => {
  it('returns an empty snapshot when every table is empty', async () => {
    const snap = await fetchAll(null);
    expect(snap).toMatchObject({ songs: [], events: [], transactions: [], gear: [], threads: [], links: [], members: [], takes: [], availability: [], myPollPicks: {} });
  });

  it("maps the user's event-poll picks to option indexes and ignores orphan votes", async () => {
    Object.assign(tables, {
      polls: [{ id: 'p1', event_id: 'e1' }],
      poll_options: [{ id: 12, poll_id: 'p1' }, { id: 11, poll_id: 'p1' }, { id: 99, poll_id: 'gone' }],
      poll_votes: [
        { profile_id: 'me', option_id: 12 }, { profile_id: 'other', option_id: 11 },
        { profile_id: 'me', option_id: 404 }, { profile_id: 'me', option_id: 99 },
      ],
      links: [{ id: 'l1', title: 't', url: 'u', category: 'press', created_by: 'm' }],
    });
    const snap = await fetchAll('me');
    expect(snap.myPollPicks).toEqual({ e1: 1 });
    expect(snap.links).toEqual([{ id: 'l1', title: 't', url: 'u', category: 'press', createdBy: 'm' }]);
    expect((await fetchAll(null)).myPollPicks).toEqual({});
  });
});
