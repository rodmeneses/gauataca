import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * supabase-js never throws on a rejected write — it resolves `{ error }` — so every write in the
 * data layer must opt in with `.throwOnError()`, or an RLS denial would look like a success.
 * This fake mirrors that contract: a chain only rejects when `throwOnError()` was called.
 */
const calls: Array<{ table: string; ops: string[]; threw: boolean }> = [];
const fail = { on: false };
const dbError = Object.assign(new Error('new row violates row-level security policy'), { code: '42501', status: 403 });

function chain(table: string) {
  const rec = { table, ops: [] as string[], threw: false };
  calls.push(rec);
  const proxy: unknown = new Proxy(function () {}, {
    get(_t, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void, reject: (e: unknown) => void) => {
          if (fail.on && rec.threw) return reject(dbError);
          resolve({ data: fail.on ? null : rows(table, rec.ops), error: fail.on ? dbError : null });
        };
      }
      if (prop === 'throwOnError') return () => { rec.threw = true; return proxy; };
      return (..._a: unknown[]) => { rec.ops.push(prop); return proxy; };
    },
  });
  return proxy;
}

/** Plausible rows so multi-step writes (settle, rsvp, polls…) can run to completion. */
function rows(table: string, ops: string[]): unknown {
  const single = ops.includes('single') || ops.includes('maybeSingle');
  if (table === 'thread_polls') return { id: 1, multiple: false };
  if (table === 'thread_poll_options' && single) return { poll_id: 1 };
  if (table === 'thread_comments') return single ? { id: 7 } : [];
  if (table === 'events') return single ? { settled: false, fee_cents: 0, cost_cents: 0 } : [];
  if (table === 'gear') return single ? { custodian_id: 'm1' } : [];
  if (table === 'transactions') return [];
  return single ? { id: 1 } : [];
}

vi.mock('../supabase', () => ({
  supabase: {
    from: (t: string) => chain(t),
    rpc: () => chain('rpc'),
    storage: { from: () => ({ remove: async () => ({ error: null }), upload: async () => ({ error: null }), getPublicUrl: () => ({ data: { publicUrl: 'u' } }) }) },
    auth: { getSession: async () => ({ data: { session: null } }) },
  },
}));
vi.mock('../notify', () => ({ notifyCreated: vi.fn() }));

import * as band from './band';
import * as forum from './forum';
import * as feed from './calendarFeed';

const ev = { title: 't', venue: 'v', date: '2026-11-07', time: '19:00', hours: 2, fee: 10, cost: 5, note: 'n', type: 'gig' as const };
const song = { title: 's', genre: 'joropo' as const, key: 'Am', bpm: 120, dur: '3:30' };
const tx = { kind: 'in' as const, amt: 10, date: '2026-11-07', desc: 'd', proof: null, proofKind: 'receipt' as const };
const gear = { name: 'g', cost: 10, date: '2026-11-07', custodian: 'm1', cond: 'good' as const, note: '', boughtBy: 'm1', proof: null, proofKind: 'receipt' as const };
const fb = { sound: 1, perf: 2, log: 3, energy: 4, well: '', improve: '', anon: false };

const writes: Array<[string, () => Promise<unknown>]> = [
  ['createEvent', () => band.createEvent(ev, 'u')],
  ['setEventPinned', () => band.setEventPinned('e', true)],
  ['setEventState', () => band.setEventState('e', 'cancelled')],
  ['createSong', () => band.createSong(song, 'u')],
  ['updateSong', () => band.updateSong('s', song, 'u')],
  ['setSongLinks', () => band.setSongLinks('s', [{ kind: 'youtube', label: 'l', url: 'https://y' }])],
  ['createInstrument', () => band.createInstrument('cuatro')],
  ['onboard', () => band.onboard('u', [{ id: 'i1', lv: 'expert' }], ['lead'])],
  ['setSongInstruments', () => band.setSongInstruments('s', ['i1'])],
  ['addTake', () => band.addTake('e', 's', 'https://t')],
  ['deleteTake', () => band.deleteTake('k')],
  ['createTransaction', () => band.createTransaction(tx, 'u')],
  ['updateTransaction', () => band.updateTransaction('t', tx, 'u')],
  ['deleteTransaction', () => band.deleteTransaction('t')],
  ['deleteEventMedia', () => band.deleteEventMedia(1)],
  ['createGear', () => band.createGear(gear, 'u')],
  ['setRsvp', () => band.setRsvp('e', 'going', 'u')],
  ['submitFeedback', () => band.submitFeedback('e', fb, 'u')],
  ['setEventSetlist', () => band.setEventSetlist('e', ['s1'], 'u')],
  ['transferCustody', () => band.transferCustody('g', 'm2', 'u')],
  ['createThread', () => forum.createThread({ title: 't', body: 'b' }, 'u')],
  ['createLink', () => forum.createLink({ title: 't', url: 'https://x', category: 'docs' }, 'u')],
  ['deleteLink', () => forum.deleteLink(1)],
  ['setThreadPinned', () => forum.setThreadPinned('t', true)],
  ['setThreadArchived', () => forum.setThreadArchived('t', true)],
  ['addComment', () => forum.addComment('t', 'hi', 'u')],
  ['setThreadReaction', () => forum.setThreadReaction('t', 'like', 'u')],
  ['setCommentReaction', () => forum.setCommentReaction(1, 'like', 'u')],
  ['deleteThreadMedia', () => forum.deleteThreadMedia(1)],
  ['rotateCalendarToken', () => feed.rotateCalendarToken('u')],
];

beforeEach(() => {
  calls.length = 0;
  fail.on = false;
});

describe('data-layer writes', () => {
  it.each(writes)('%s rejects when the database refuses the write', async (_name, run) => {
    fail.on = true;
    await expect(run()).rejects.toMatchObject({ code: '42501' });
  });

  it.each(writes)('%s resolves when the write succeeds', async (_name, run) => {
    await expect(run()).resolves.not.toThrow();
  });

  it('opts every insert/update/delete/upsert it issues into throwOnError', async () => {
    for (const [, run] of writes) await run().catch(() => {});
    const writeVerbs = ['insert', 'update', 'delete', 'upsert'];
    const unchecked = calls.filter((c) => c.ops.some((o) => writeVerbs.includes(o)) && !c.threw);
    expect(unchecked).toEqual([]);
  });
});
