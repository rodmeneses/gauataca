import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Programmable supabase fake for the multi-step writes: `reply(table, ops)` supplies the row(s) a
 * query resolves with, `failOn(table, ops)` makes it resolve `{ error }` (and reject under throwOnError).
 */
type Call = { table: string; ops: string[]; args: Record<string, unknown[]> };
const calls: Call[] = [];
let reply: (table: string, ops: string[]) => unknown = () => null;
let failOn: (table: string, ops: string[]) => boolean = () => false;
const storage = { uploads: [] as string[], removed: [] as string[][], uploadError: null as unknown };

function chain(table: string) {
  const rec: Call = { table, ops: [], args: {} };
  calls.push(rec);
  let threw = false;
  const proxy: unknown = new Proxy(function () {}, {
    get(_t, prop: string) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void, reject: (e: unknown) => void) => {
          const error = failOn(table, rec.ops) ? new Error('boom') : null;
          if (error && threw) return reject(error);
          resolve({ data: error ? null : reply(table, rec.ops), error });
        };
      }
      if (prop === 'throwOnError') return () => { threw = true; return proxy; };
      return (...a: unknown[]) => { rec.ops.push(prop); rec.args[prop] = a; return proxy; };
    },
  });
  return proxy;
}

vi.mock('../supabase', () => ({
  supabase: {
    from: (t: string) => chain(t),
    storage: {
      from: () => ({
        upload: async (p: string) => { storage.uploads.push(p); return { error: storage.uploadError }; },
        remove: async (paths: string[]) => { storage.removed.push(paths); return { error: null }; },
        getPublicUrl: (p: string) => ({ data: { publicUrl: 'https://cdn/' + p } }),
      }),
    },
  },
}));
vi.mock('../notify', () => ({ notifyCreated: vi.fn() }));

import * as band from './index';
import * as forum from './forum';

const by = (table: string, op: string) => calls.filter((c) => c.table === table && c.ops.includes(op));
const ev = { title: 't', venue: 'v', date: '2026-11-07', time: '', hours: 0, fee: 10, cost: 5, note: 'n', type: 'gig' as const };

beforeEach(() => {
  calls.length = 0;
  reply = () => null;
  failOn = () => false;
  storage.uploads = [];
  storage.removed = [];
  storage.uploadError = null;
});

describe('events', () => {
  it('defaults the start time and omits zero durations', async () => {
    await band.createEvent(ev, 'u');
    expect(by('events', 'insert')[0].args.insert[0]).toMatchObject({ starts_at: '2026-11-07T19:00:00Z', duration_hours: null });
  });

  it('only re-syncs ledger movements for settled events', async () => {
    reply = (t, ops) => (t === 'events' && ops.includes('single') ? { settled: false } : []);
    await band.updateEvent('e', ev, 'u');
    expect(by('transactions', 'select')).toHaveLength(0);
    calls.length = 0;
    reply = (t, ops) => (t === 'events' && ops.includes('single') ? { settled: true, starts_at: '2026-11-07T00:00:00Z' } : []);
    await band.updateEvent('e', ev, 'u');
    expect(by('transactions', 'select').length).toBeGreaterThan(0);
  });

  it('tolerates a missing event row when updating', async () => {
    await band.updateEvent('e', { ...ev, time: '20:00', hours: 3 }, 'u');
    expect(by('events', 'update')[0].args.update[0]).toMatchObject({ starts_at: '2026-11-07T20:00:00Z', duration_hours: 3 });
  });

  it('adds media with or without a submitter', async () => {
    await band.addEventMedia('e', { kind: 'video', labelEs: 'a', labelEn: 'b', url: 'u' }, '');
    await band.addEventMedia('e', { kind: 'photo', labelEs: 'a', labelEn: 'b', url: 'u' }, 'me');
    const rows = by('event_media', 'insert').map((c) => c.args.insert[0]);
    expect(rows.map((r) => (r as { submitted_by: unknown }).submitted_by)).toEqual([null, 'me']);
  });

  it('adds photos, and cleans up storage when the rows are refused', async () => {
    expect(await band.addEventPhotos('e', [], 'u')).toBe(false);
    expect(await band.addEventPhotos('e', ['https://cdn/a.jpg'], '')).toBe(true);
    failOn = (t) => t === 'event_media';
    const url = 'https://x.supabase.co/storage/v1/object/public/event-photos/a.jpg';
    expect(await band.addEventPhotos('e', [url], 'u')).toBe(false);
    expect(storage.removed).toEqual([['a.jpg', expect.any(String)]]);
  });

  it('removes the stored file when deleting uploaded media', async () => {
    reply = (_t, ops) => (ops.includes('single') ? { url: 'https://x.supabase.co/storage/v1/object/public/event-photos/a.jpg' } : null);
    await band.deleteEventMedia(1);
    expect(storage.removed).toHaveLength(1);
    storage.removed = [];
    reply = () => null;
    await band.deleteEventMedia(2);
    expect(storage.removed).toHaveLength(0);
  });

  it('uploads an event photo with and without a thumbnail', async () => {
    expect(await band.uploadEventPhoto(new Blob(['x']))).toMatch(/^https:\/\/cdn\/.*\.jpg$/);
    expect(storage.uploads).toHaveLength(1);
    await band.uploadEventPhoto(new Blob(['x']), new Blob(['t']));
    expect(storage.uploads).toHaveLength(3);
    storage.uploadError = new Error('nope');
    await expect(band.uploadEventPhoto(new Blob(['x']))).rejects.toThrow('nope');
  });

  it('numbers takes after the highest existing one', async () => {
    reply = (t) => (t === 'takes' ? [{ n: 4 }] : null);
    await band.addTake('e', 's', 'u');
    expect(by('takes', 'insert')[0].args.insert[0]).toMatchObject({ n: 5 });
  });

  describe('pickPoll', () => {
    it('does nothing without a poll or a matching option', async () => {
      await band.pickPoll('e', 0, 'u');
      reply = (t) => (t === 'polls' ? [{ id: 'p' }] : []);
      await band.pickPoll('e', 0, 'u');
      expect(by('poll_votes', 'insert')).toHaveLength(0);
    });
    it('replaces the member vote with the chosen option', async () => {
      reply = (t) => (t === 'polls' ? [{ id: 'p' }] : t === 'poll_options' ? [{ id: 1 }, { id: 2 }] : null);
      await band.pickPoll('e', 1, 'u');
      expect(by('poll_votes', 'delete')).toHaveLength(1);
      expect(by('poll_votes', 'insert')[0].args.insert[0]).toEqual({ option_id: 2, profile_id: 'u' });
    });
  });

  it('skips the setlist insert when it is empty', async () => {
    await band.setEventSetlist('e', [], 'u');
    expect(by('event_songs', 'insert')).toHaveLength(0);
    await band.setEventLinks('e', []);
    expect(by('event_links', 'insert')).toHaveLength(0);
  });
});

describe('forum', () => {
  it('creates a poll with its options, or none', async () => {
    reply = (t) => (t === 'thread_polls' ? { id: 3 } : null);
    await forum.createThreadPoll('t', 'q', ['a', 'b'], true, 'u');
    expect(by('thread_poll_options', 'insert')[0].args.insert[0]).toEqual([
      { poll_id: 3, label_es: 'a', label_en: 'a' }, { poll_id: 3, label_es: 'b', label_en: 'b' },
    ]);
    calls.length = 0;
    await forum.createThreadPoll('t', 'q', [], false, 'u');
    expect(by('thread_poll_options', 'insert')).toHaveLength(0);
    reply = () => null;
    await forum.createThreadPoll('t', 'q', ['a'], false, 'u');
    expect(by('thread_poll_options', 'insert')).toHaveLength(0);
  });

  it('adds a poll option only when the idea has a poll', async () => {
    await forum.addThreadPollOption('t', 'x');
    expect(by('thread_poll_options', 'insert')).toHaveLength(0);
    reply = () => ({ id: 9 });
    await forum.addThreadPollOption('t', 'x');
    expect(by('thread_poll_options', 'insert')[0].args.insert[0]).toMatchObject({ poll_id: 9 });
  });

  describe('voteThreadPoll', () => {
    const setup = (multiple: boolean, mine: number[]) => {
      reply = (t, ops) => {
        if (t === 'thread_poll_options') return ops.includes('single') ? { poll_id: 5 } : [{ id: 1 }, { id: 2 }];
        if (t === 'thread_polls') return { multiple };
        if (t === 'thread_poll_votes') return mine.map((option_id) => ({ option_id }));
        return null;
      };
    };
    it('ignores an unknown option', async () => {
      reply = () => null;
      await forum.voteThreadPoll(1, 'u');
      expect(by('thread_poll_votes', 'insert')).toHaveLength(0);
    });
    it('toggles on and off in multiple-choice polls', async () => {
      setup(true, []);
      await forum.voteThreadPoll(1, 'u');
      expect(by('thread_poll_votes', 'insert')).toHaveLength(1);
      calls.length = 0;
      setup(true, [1]);
      await forum.voteThreadPoll(1, 'u');
      expect(by('thread_poll_votes', 'insert')).toHaveLength(0);
      expect(by('thread_poll_votes', 'delete')).toHaveLength(1);
    });
    it('moves or removes the vote in single-choice polls', async () => {
      setup(false, [2]);
      await forum.voteThreadPoll(1, 'u');
      expect(by('thread_poll_votes', 'delete')).toHaveLength(1);
      expect(by('thread_poll_votes', 'insert')).toHaveLength(1);
      calls.length = 0;
      setup(false, [1]);
      await forum.voteThreadPoll(1, 'u');
      expect(by('thread_poll_votes', 'insert')).toHaveLength(0);
    });
    it('treats a missing poll or vote list as single-choice with no votes', async () => {
      reply = (t, ops) => (t === 'thread_poll_options' && ops.includes('single') ? { poll_id: 5 } : null);
      await forum.voteThreadPoll(1, 'u');
      expect(by('thread_poll_votes', 'insert')).toHaveLength(1);
    });
  });

  it('deletes a comment and its stored photos, or throws', async () => {
    reply = (t) => (t === 'thread_comments' ? [{ id: 1 }, { id: 2 }] : t === 'thread_media' ? [{ url: 'https://x.supabase.co/storage/v1/object/public/forum-photos/p.jpg' }, { url: null }] : null);
    await forum.deleteComment(1);
    expect(storage.removed).toHaveLength(1);
    reply = () => null;
    await forum.deleteComment(2);
    failOn = (t, ops) => t === 'thread_comments' && ops.includes('delete');
    await expect(forum.deleteComment(3)).rejects.toThrow('boom');
  });

  it('attaches thread media, cleaning up when refused', async () => {
    expect(await forum.addThreadMedia('t', [], 'u')).toBe(false);
    expect(await forum.addThreadMedia('t', ['u'], 'u', 4)).toBe(true);
    failOn = (t) => t === 'thread_media';
    expect(await forum.addThreadMedia('t', ['https://x.supabase.co/storage/v1/object/public/forum-photos/p.jpg'], 'u')).toBe(false);
    expect(storage.removed).toHaveLength(1);
  });

  it('attaches refs, skipping the ones already there', async () => {
    expect(await forum.addThreadRefs('t', [], 'u')).toBe(false);
    reply = () => [{ ref_kind: 'song', ref_id: 's1' }];
    expect(await forum.addThreadRefs('t', [{ kind: 'song', id: 's1' }], 'u')).toBe(true);
    expect(by('thread_refs', 'insert')).toHaveLength(0);
    expect(await forum.addThreadRefs('t', [{ kind: 'song', id: 's1' }, { kind: 'event', id: 'e1' }], 'u', 2)).toBe(true);
    expect(by('thread_refs', 'insert')[0].args.insert[0]).toHaveLength(1);
    failOn = (_t, ops) => ops.includes('insert');
    expect(await forum.addThreadRefs('t', [{ kind: 'event', id: 'e2' }], 'u')).toBe(false);
    reply = () => null;
    failOn = () => false;
    expect(await forum.addThreadRefs('t', [{ kind: 'event', id: 'e2' }], 'u')).toBe(true);
  });

  it('uploads a forum photo and handles a comment with no returned id', async () => {
    expect(await forum.uploadForumPhoto(new Blob(['x']))).toMatch(/^https:\/\/cdn\//);
    expect(await forum.addComment('t', 'hi', 'u')).toBe(0);
    reply = () => null;
    await forum.setThreadReaction('t', null, 'u');
    await forum.setCommentReaction(1, null, 'u');
    await forum.setThreadReaction('t', 'dislike', 'u');
    await forum.setCommentReaction(1, 'dislike', 'u');
    expect(by('thread_reactions', 'upsert')).toHaveLength(1);
  });
});

describe('ledger', () => {
  it('uploads proof with the file extension (or .bin)', async () => {
    expect(await band.uploadProof(new File(['x'], 'Receipt.PNG'))).toMatch(/\.png$/);
    expect(await band.uploadProof(new File(['x'], 'noext'))).toMatch(/\.noext$/);
    expect(await band.uploadProof(new File(['x'], 'trailing.'))).toMatch(/\.bin$/);
    storage.uploadError = new Error('denied');
    await expect(band.uploadProof(new File(['x'], 'a.png'))).rejects.toThrow('denied');
  });

  describe('syncEventTransactions', () => {
    const ev = { starts_at: '2026-11-07T20:00:00Z', title_es: 'Fiesta', title_en: 'Party' };
    const withTx = (fee: boolean, cost: boolean) => {
      reply = (t, ops) => {
        if (t === 'events') return ev;
        if (t === 'transactions' && ops.includes('select')) return (ops.join().includes('eq') ? [] : []).concat(
          [] as never[],
        );
        return null;
      };
      let n = 0;
      reply = (t) => {
        if (t === 'events') return ev;
        if (t === 'transactions') { n += 1; return (n === 1 ? fee : cost) ? [{ id: 'tx' + n }] : []; }
        return null;
      };
    };

    it('inserts missing income and expense movements', async () => {
      withTx(false, false);
      await band.syncEventTransactions('e', 100, 40, 'u');
      const rows = by('transactions', 'insert').map((c) => c.args.insert[0]);
      expect(rows).toMatchObject([
        { kind: 'in', amount_cents: 10000, category: 'fee', occurred_on: '2026-11-07', description_es: 'Honorarios — Fiesta' },
        { kind: 'out', amount_cents: 4000, description_en: 'Cost — Party' },
      ]);
    });
    it('updates existing movements', async () => {
      withTx(true, true);
      await band.syncEventTransactions('e', 100, 40, 'u');
      expect(by('transactions', 'update').map((c) => c.args.update[0])).toEqual([{ amount_cents: 10000 }, { amount_cents: 4000 }]);
    });
    it('deletes movements whose amount dropped to zero, and ignores absent ones', async () => {
      withTx(true, true);
      await band.syncEventTransactions('e', 0, 0, 'u');
      expect(by('transactions', 'delete')).toHaveLength(2);
      calls.length = 0;
      withTx(false, false);
      await band.syncEventTransactions('e', 0, 0, 'u');
      expect(by('transactions', 'delete')).toHaveLength(0);
    });
    it('copes with a missing event row', async () => {
      reply = () => null;
      await band.syncEventTransactions('e', 1, 1, 'u');
      expect(by('transactions', 'insert')[0].args.insert[0]).toMatchObject({ occurred_on: '' });
    });
  });

  it('settles an event, dropping the fee when it did not happen', async () => {
    reply = (t) => (t === 'events' ? { starts_at: '2026-11-07T00:00:00Z' } : null);
    await band.settleEvent('e', { happened: true, fee: 10, cost: 0 }, 'u');
    expect(by('transactions', 'insert')).toHaveLength(1);
    calls.length = 0;
    await band.settleEvent('e', { happened: false, fee: 10, cost: 5 }, 'u');
    expect(by('transactions', 'insert').map((c) => (c.args.insert[0] as { kind: string }).kind)).toEqual(['out']);
    expect(by('events', 'update')[0].args.update[0]).toEqual({ settled: true });
  });
});

describe('availability / calendar feed', () => {
  it('returns undefined when the poll insert yields no id', async () => {
    expect(await band.createAvailabilityPoll({ title: 't', dates: ['d'] }, 'u')).toBeUndefined();
    expect(by('availability_dates', 'insert')).toHaveLength(0);
  });
  it('dedupes candidate dates', async () => {
    reply = (t) => (t === 'availability_polls' ? { id: 4 } : null);
    expect(await band.createAvailabilityPoll({ title: 't', dates: ['a', 'a', 'b'] }, 'u')).toBe(4);
    expect(by('availability_dates', 'insert')[0].args.insert[0]).toHaveLength(2);
  });
  it('returns an existing calendar token without creating one', async () => {
    reply = () => ({ token: 'abc' });
    expect(await band.getCalendarToken('u')).toBe('abc');
    expect(by('calendar_tokens', 'insert')).toHaveLength(0);
  });
  it('returns null when no token can be read after creating', async () => {
    expect(await band.getCalendarToken('u')).toBeNull();
  });
});
