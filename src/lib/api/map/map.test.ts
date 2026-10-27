import { describe, expect, it } from 'vitest';
import { mapAvailability } from './availability';
import { buildFeedback, mapEvents } from './events';
import { mapThreads, tallyReactions } from './forum';
import { mapGear, mapTransactions } from './ledger';
import { mapInstruments, mapMembers } from './members';
import { mapSongs, mapTakes } from './songs';

describe('mapAvailability', () => {
  it('sorts slots, trims times, drops unknown answers and orders polls newest first', () => {
    const out = mapAvailability(
      [{ id: 1, title: 'a', closed: null, created_by: 'm1' }, { id: 2, title: 'b', closed: true, created_by: 'm2' }],
      [
        { id: 10, poll_id: 1, date: '2026-02-02', start_time: null, end_time: null },
        { id: 11, poll_id: 1, date: '2026-01-01', start_time: '19:00:00', end_time: '22:30:00' },
        { id: 12, poll_id: 1, date: '2026-01-01', start_time: null, end_time: null },
      ],
      [{ poll_id: 1, slot_id: 11, profile_id: 'm1', answer: 'yes' }, { poll_id: 1, slot_id: 11, profile_id: 'm2', answer: 'bogus' }],
    );
    expect(out.map((p) => p.id)).toEqual([2, 1]);
    expect(out[1].slots).toEqual([
      { id: 12, date: '2026-01-01', start: null, end: null },
      { id: 11, date: '2026-01-01', start: '19:00', end: '22:30' },
      { id: 10, date: '2026-02-02', start: null, end: null },
    ]);
    expect(out[1].votes).toEqual([{ slotId: 11, profileId: 'm1', answer: 'yes' }]);
    expect(out[1].closed).toBe(false);
    expect(out[0].closed).toBe(true);
    expect(out[0].slots).toEqual([]);
  });
});

describe('events mapping', () => {
  const fb = [
    { event_id: 'e1', profile_id: 'm1', anonymous: false, sound: 4, performance: 5, logistics: 3, energy: 2, went_well_es: 'bien', went_well_en: '', improve_es: '', improve_en: '' },
    { event_id: 'e1', profile_id: 'm2', anonymous: true, sound: 2, performance: 3, logistics: 1, energy: 4, went_well_es: '', went_well_en: '', improve_es: 'x', improve_en: 'y' },
    { event_id: 'e1', profile_id: 'zz', anonymous: false, sound: null, performance: 0, logistics: 0, energy: 0, went_well_es: null, went_well_en: 'ok', improve_es: '', improve_en: '' },
  ];
  const members = [{ id: 'm1', short: 'Ana' }] as never[];

  it('averages feedback and builds poll options', () => {
    const out = buildFeedback(
      fb, { id: 'p1', question_es: 'q', question_en: 'Q' },
      new Map([['p1', [{ id: 'o1', label_es: 'si', label_en: 'yes' }, { id: 'o2', label_es: 'no', label_en: 'no' }]]]),
      new Map([['o1', [{}, {}]]]),
      new Map([['m1', 'Ana']]),
    );
    expect(out.responses).toBe(3);
    expect(out.sound).toBe(2);
    expect(out.well.map((w) => w.by)).toEqual(['Ana', null]);
    expect(out.well[0].text).toEqual({ es: 'bien', en: '' });
    expect(out.improve[0]).toEqual({ by: null, anon: true, text: { es: 'x', en: 'y' } });
    expect(out.poll.q).toEqual({ es: 'q', en: 'Q' });
    expect(out.poll.options.map((o) => o.v)).toEqual([2, 0]);
  });

  it('handles feedback without a poll', () => {
    const out = buildFeedback([fb[0]], undefined, new Map(), new Map(), new Map());
    expect(out.poll).toEqual({ q: { es: '', en: '' }, options: [] });
    const noOpts = buildFeedback([fb[0]], { id: 'p9', question_es: 'q', question_en: 'Q' }, new Map(), new Map(), new Map());
    expect(noOpts.poll.options).toEqual([]);
  });

  it('maps a full event and a sparse one', () => {
    const events = [
      {
        id: 'e1', type: 'gig', state: 'confirmed', starts_at: '2026-05-01T20:30:00Z', duration_hours: 2, title_es: 't', title_en: 'T',
        venue: 'v', fee_cents: 5000, cost_cents: 1000, settled: true, attend: 3, note_es: 'n', note_en: 'N', flyer_url: 'f',
        previous_starts_at: '2026-04-01T10:00:00Z', pinned: true,
      },
      { id: 'e2', type: 'practice', state: 'draft', title_es: 't', title_en: 'T', venue: 'v' },
    ];
    const out = mapEvents(
      events,
      [{ event_id: 'e1', position: 2, song_id: 's2' }, { event_id: 'e1', position: 1, song_id: 's1' }],
      [{ event_id: 'e1', id: 1, kind: 'photo', label_es: 'a', label_en: 'b', url: 'u' }],
      [{ event_id: 'e1', position: 2, label: 'b', url: 'ub' }, { event_id: 'e1', position: 1, label: 'a', url: 'ua' }],
      [{ event_id: 'e1', profile_id: 'm1', status: 'yes' }],
      fb, [{ id: 'p1', event_id: 'e1', question_es: 'q', question_en: 'Q' }], [], [], members,
    );
    expect(out[0]).toMatchObject({
      date: '2026-05-01', time: '20:30', hours: 2, fee: 50, cost: 10, settled: true, setlist: ['s1', 's2'],
      attendance: { m1: 'yes' }, flyer: 'f', prevDate: '2026-04-01', pinned: true,
    });
    expect(out[0].links?.map((l) => l.label)).toEqual(['a', 'b']);
    expect(out[0].feedback?.responses).toBe(3);
    expect(out[1]).toMatchObject({
      date: '', time: '', hours: undefined, fee: 0, cost: 0, settled: false, attend: 0, attendance: undefined,
      flyer: undefined, prevDate: undefined, feedback: undefined, pinned: false, note: { es: '', en: '' },
    });
  });
});

describe('forum mapping', () => {
  it('tallies reactions and flags the current user', () => {
    const r = tallyReactions([{ kind: 'like', profile_id: 'a' }, { kind: 'dislike', profile_id: 'b' }], 'b');
    expect(r.tally).toEqual({ like: 1, dislike: 1, likedBy: ['a'], dislikedBy: ['b'] });
    expect(r.mine).toBe('dislike');
    expect(tallyReactions([{ kind: 'like', profile_id: 'a' }], null).mine).toBeNull();
  });

  it('builds threads with comments, replies, media, refs and polls', () => {
    const out = mapThreads(
      [
        { id: 't1', author_id: 'a', created_at: '2026-01-01T00:00:00Z', title_es: 'a', title_en: 'A', body_es: 'b', body_en: 'B', pinned: true, archived: null },
        { id: 't2', author_id: 'a', created_at: '2026-02-01T00:00:00Z', title_es: 'a', title_en: 'A', body_es: 'b', body_en: 'B' },
        { id: 't3', author_id: 'a', title_es: 'a', title_en: 'A', body_es: 'b', body_en: 'B' },
      ],
      [{ thread_id: 't1', kind: 'like', profile_id: 'me' }],
      [{ comment_id: 'c1', kind: 'dislike', profile_id: 'me' }],
      [
        { id: 2, thread_id: 't1', parent_id: 'c1', author_id: 'a', body_es: 'r', body_en: 'R', created_at: 'x' },
        { id: 1, thread_id: 't1', parent_id: null, author_id: 'a', body_es: 'c', body_en: 'C', created_at: 'y' },
      ].map((c) => ({ ...c, id: c.id === 1 ? 'c1' : 'c2' })),
      [{ thread_id: 't1', comment_id: null, id: 'm1', url: 'u', author_id: 'a' }, { thread_id: 't1', comment_id: 'c1', id: 'm2', url: 'u2', author_id: 'a' }],
      [{ thread_id: 't1', comment_id: null, id: 'r1', ref_kind: 'event', ref_id: 'e1' }, { thread_id: 't1', comment_id: 'c1', id: 'r2', ref_kind: 'song', ref_id: 's1' }],
      [{ id: 'p1', thread_id: 't1', question_es: 'q', question_en: 'Q', multiple: 1 }],
      [{ id: 2, poll_id: 'p1', label_es: 'b', label_en: 'B' }, { id: 1, poll_id: 'p1', label_es: 'a', label_en: 'A' }],
      [{ option_id: 1, profile_id: 'me' }, { option_id: 1, profile_id: 'x' }],
      'me',
    );
    expect(out.map((t) => t.id)).toEqual(['t2', 't1', 't3']);
    const t1 = out[1];
    expect(t1.myReaction).toBe('like');
    expect(t1.pinned).toBe(true);
    expect(t1.archived).toBe(false);
    expect(t1.media).toHaveLength(1);
    expect(t1.refs).toEqual([{ id: 'r1', kind: 'event', refId: 'e1' }]);
    expect(t1.comments).toHaveLength(1);
    expect(t1.comments[0].replies).toHaveLength(1);
    expect(t1.comments[0].myReaction).toBe('dislike');
    expect(t1.comments[0].media[0].id).toBe('m2');
    expect(t1.comments[0].refs[0].refId).toBe('s1');
    expect(t1.poll?.options.map((o) => o.id)).toEqual([1, 2]);
    expect(t1.poll?.myOptionIds).toEqual([1]);
    expect(t1.poll?.multiple).toBe(true);
    expect(out[0].poll).toBeUndefined();
    expect(out[2].date).toBe('');
  });

  it('builds a poll with no options or voter', () => {
    const [t] = mapThreads(
      [{ id: 't1', created_at: '2026-01-01' }], [], [], [], [], [], [{ id: 'p1', thread_id: 't1', multiple: false }], [], [], null,
    );
    expect(t.poll?.options).toEqual([]);
  });
});

describe('ledger / members / songs mapping', () => {
  it('maps transactions with defaults', () => {
    const [a, b] = mapTransactions([
      { id: 1, kind: 'in', amount_cents: 1250, occurred_on: 'd', created_by: 'm', description_es: 'a', description_en: 'b', proof_url: 'p', proof_kind: 'image', event_id: 'e', gear_id: 'g', category: 'c', contributor_id: 'k' },
      { id: 2 },
    ]);
    expect(a).toMatchObject({ amt: 12.5, proof: 'p', event: 'e', gear: 'g', category: 'c', contributor: 'k' });
    expect(b).toMatchObject({ amt: 0, proof: null, event: undefined, gear: undefined, category: undefined, contributor: undefined });
  });

  it('maps gear and links purchase transactions', () => {
    const [a, b] = mapGear(
      [{ id: 'g1', name_es: 'a', name_en: 'b', cost_cents: 10000, purchased_on: 'd', custodian_id: 'm', condition: 'good', note_es: 'n', note_en: 'N', purchased_by: 'p' }, { id: 'g2' }],
      [{ id: 9, gear_id: 'g1' }, { id: 10, gear_id: null }],
    );
    expect(a).toMatchObject({ cost: 100, tx: 9, boughtBy: 'p', note: { es: 'n', en: 'N' } });
    expect(b).toMatchObject({ cost: 0, tx: undefined, boughtBy: undefined, note: { es: '', en: '' } });
  });

  it('maps members and instruments', () => {
    const [m, bare] = mapMembers(
      [{ id: 'm1', name: 'Ana Maria Lopez', role: 'admin', title_es: 't', title_en: 'T', email: 'e', joined_at: '2024-03-04T00:00:00Z' }, { id: 'm2', name: 'Bo' }],
      [{ profile_id: 'm1', instrument_id: 'cuatro', proficiency: 3 }],
      [{ profile_id: 'm1', flag: 'lead' }],
    );
    expect(m).toMatchObject({ short: 'Ana', initial: 'AM', joined: '2024-03-04', instruments: [{ id: 'cuatro', lv: 3 }], vocals: ['lead'] });
    expect(bare).toMatchObject({ email: '', joined: '', title: { es: '', en: '' }, instruments: [], vocals: [] });
    expect(mapInstruments([{ id: 'i', name_es: 'a', name_en: 'b', is_basic: 1 }, { id: 'j' }]).map((i) => i.isBasic)).toEqual([true, false]);
  });

  it('maps songs and takes', () => {
    const [s, s2] = mapSongs(
      [{ id: 's1', title_es: 'Es', title_en: 'En', genre: 'g', key: 'C', bpm: 100, duration: '3:00' }, { id: 's2', title_en: 'Only' }],
      [{ song_id: 's1', instrument_id: 'i1' }],
      [{ song_id: 's1', position: 2, kind: 'audio', label_es: 'b', label_en: 'B', url: 'u2' }, { song_id: 's1', position: 1, kind: 'video', label_es: 'a', label_en: 'A', url: 'u1' }],
    );
    expect(s.links.map((l) => l.url)).toEqual(['u1', 'u2']);
    expect(s.instruments).toEqual(['i1']);
    expect(s2.title).toBe('Only');
    expect(mapTakes([{ id: 1, event_id: 'e', song_id: 's', url: 'u', n: 2 }])).toEqual([{ id: 1, eventId: 'e', songId: 's', url: 'u', n: 2 }]);
  });
});
