import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { T } from '../i18n';
import type {
  BandEvent, EventFeedback, Gear, Instrument, Member, Song, Take, Thread, Transaction,
} from '../types';
import {
  L, memberById, songVm, takeVm, rsvpLabel, eventVm, txVm, contributionVm, gearVm,
  threadVm, memberVm, feedbackVm, igCaption, tint, type Ctx,
} from './vm';

const admin: Member = {
  id: 'm1', name: 'Ana Perez', short: 'Ana', initial: 'A', role: 'admin',
  title: { es: 'Directora', en: 'Director' }, email: 'ana@x.com', joined: '2023-01-01',
  instruments: [{ id: 'cuatro', lv: 'expert' }], vocals: ['lead'],
};
const member: Member = {
  id: 'm2', name: 'Beto Ruiz', short: 'Beto', initial: 'B', role: 'member',
  title: { es: 'Músico', en: 'Musician' }, email: 'beto@x.com', joined: '2024-05-01',
  instruments: [{ id: 'maracas', lv: 'beg' }], vocals: ['none'],
};
const members = [admin, member];

const instruments: Instrument[] = [
  { id: 'cuatro', name: { es: 'Cuatro', en: 'Cuatro' }, isBasic: true },
  { id: 'maracas', name: { es: 'Maracas', en: 'Maracas' }, isBasic: true },
];

const s1: Song = {
  id: 's1', title: 'Alma Llanera', genre: 'joropo', key: 'D', bpm: 120, dur: '3:52',
  instruments: ['cuatro'],
  links: [
    { kind: 'youtube', label: { es: 'YT', en: 'YT' }, url: 'https://youtu.be/1' },
    { kind: 'chart', label: { es: 'Tab', en: 'Tab' }, url: 'https://x/tab.pdf' },
  ],
};
const s2: Song = { id: 's2', title: 'Nunca Ensayada', genre: 'gaita', key: 'C', bpm: 100, dur: '4:00', links: [] };
const s3: Song = { id: 's3', title: 'Muy Vieja', genre: 'vals', key: 'G', bpm: 90, dur: '2:30', links: [] };
const songs = [s1, s2, s3];

function baseEvent(overrides: Partial<BandEvent>): BandEvent {
  return {
    id: 'e', type: 'gig', state: 'active', date: '2026-09-01', time: '20:00',
    title: { es: 'Evento', en: 'Event' }, venue: 'Salon X', fee: 0, cost: 0,
    settled: false, setlist: [], attend: 0, note: { es: '', en: '' },
    ...overrides,
  };
}

// "Now" pinned so days()/rel()/staleness are deterministic.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-10T09:00:00'));
});
afterEach(() => {
  vi.useRealTimers();
});

function baseCtx(overrides: Partial<Ctx> = {}): Ctx {
  return {
    lang: 'en', t: T.en, staleDays: 14, meId: 'm1', isAdmin: true,
    members, events: [], gear: [], instruments, takes: [],
    ...overrides,
  };
}

describe('L', () => {
  it('picks the requested language', () => {
    expect(L('en', { es: 'Hola', en: 'Hello' })).toBe('Hello');
    expect(L('es', { es: 'Hola', en: 'Hello' })).toBe('Hola');
  });
  it('falls back to es when the requested language is missing', () => {
    expect(L('en', { es: 'Hola' } as any)).toBe('Hola');
  });
  it('passes through a plain string unchanged', () => {
    expect(L('en', 'plain')).toBe('plain');
  });
  it('returns "" for null/undefined', () => {
    expect(L('en', null)).toBe('');
    expect(L('en', undefined)).toBe('');
  });
});

describe('memberById', () => {
  it('finds the member by id', () => {
    expect(memberById(members, 'm2')).toBe(member);
  });
  it('falls back to the first member when not found', () => {
    expect(memberById(members, 'nope')).toBe(admin);
  });
  it('falls back to a blank member when the list is empty', () => {
    expect(memberById([], 'nope').id).toBe('');
  });
});

describe('tint', () => {
  it('wraps a color in a color-mix() wash', () => {
    expect(tint('red')).toBe('color-mix(in srgb, red 12%, transparent)');
  });
});

describe('songVm', () => {
  const gig = baseEvent({ id: 'e1', date: '2026-09-01', settled: true, setlist: ['s1'] });
  const veryOldGig = baseEvent({ id: 'e2', date: '2026-01-01', settled: true, setlist: ['s3'] });
  const unsettledGig = baseEvent({ id: 'e3', date: '2026-09-09', settled: false, setlist: ['s2'] });
  const allEvents = [gig, veryOldGig, unsettledGig];

  it('marks a recently rehearsed song as not stale', () => {
    const vm = songVm(s1, allEvents, null, baseCtx());
    expect(vm.isStale).toBe(false);
    expect(vm.lastLabel).toBe('9 days ago');
    expect(vm.staleColor).toBe('var(--color-emerald)');
  });

  it('marks a song rehearsed long ago as very stale', () => {
    const vm = songVm(s3, allEvents, null, baseCtx());
    expect(vm.isStale).toBe(true);
    expect(vm.staleColor).toBe('var(--color-rose)');
  });

  it('treats a song with no settled rehearsal as never rehearsed', () => {
    const vm = songVm(s2, allEvents, null, baseCtx());
    expect(vm.lastLabel).toBe('Never rehearsed');
    expect(vm.lastDate).toBe('—');
    expect(vm.isStale).toBe(true);
  });

  it('splits streaming vs chart links and orders streaming by kind', () => {
    const vm = songVm(s1, allEvents, null, baseCtx());
    expect(vm.hasStreaming).toBe(true);
    expect(vm.streaming.map((l) => l.kind)).toEqual(['youtube']);
    expect(vm.hasCharts).toBe(true);
    expect(vm.charts.map((l) => l.kind)).toEqual(['chart']);
  });

  it('resolves required instrument names', () => {
    const vm = songVm(s1, allEvents, null, baseCtx());
    expect(vm.instruments).toEqual(['Cuatro']);
    expect(vm.hasInstruments).toBe(true);
  });

  it('has no instruments listed when the song requires none', () => {
    const vm = songVm(s2, allEvents, null, baseCtx());
    expect(vm.hasInstruments).toBe(false);
  });

  it('marks open === true only for the currently open song', () => {
    expect(songVm(s1, allEvents, 's1', baseCtx()).open).toBe(true);
    expect(songVm(s1, allEvents, 's2', baseCtx()).open).toBe(false);
  });

  it('attaches takes for this song, oldest first', () => {
    const take1: Take = { id: 't2', eventId: 'e1', songId: 's1', url: 'https://x/2', n: 2 };
    const take2: Take = { id: 't1', eventId: 'e1', songId: 's1', url: 'https://x/1', n: 1 };
    const vm = songVm(s1, allEvents, null, baseCtx({ takes: [take1, take2] }));
    expect(vm.hasTakes).toBe(true);
    expect(vm.takeCount).toBe(2);
    expect(vm.takes.map((t) => t.label)).toEqual(['Take 1', 'Take 2']);
  });
});

describe('takeVm', () => {
  it('labels the take with its number and carries the song/date context', () => {
    const tk: Take = { id: 't1', eventId: 'e1', songId: 's1', url: 'https://x', n: 3 };
    const vm = takeVm(tk, 'Alma Llanera', 'Sep 1 2026', baseCtx());
    expect(vm).toEqual({ id: 't1', songId: 's1', songTitle: 'Alma Llanera', url: 'https://x', label: 'Take 3', dateStr: 'Sep 1 2026' });
  });
});

describe('rsvpLabel', () => {
  it('maps each status to its label', () => {
    expect(rsvpLabel('going', T.en)).toBe('Going');
    expect(rsvpLabel('maybe', T.en)).toBe('Maybe');
    expect(rsvpLabel('no', T.en)).toBe('Not going');
  });
});

describe('eventVm', () => {
  it('builds a past settled gig: no attendance tracking, has setlist/runtime', () => {
    const e = baseEvent({
      id: 'e1', date: '2026-09-01', settled: true, setlist: ['s1'], fee: 600, cost: 50,
      media: [{ id: 1, kind: 'photo', label: { es: '', en: '' }, url: 'https://img/1.jpg' }],
    });
    const vm = eventVm(e, songs, baseCtx());
    expect(vm.past).toBe(true);
    expect(vm.hasAttendance).toBe(false);
    expect(vm.canRsvp).toBe(false);
    expect(vm.hasSetlist).toBe(true);
    expect(vm.setlistCount).toBe('1');
    expect(vm.runtime).toBe('3 min');
    expect(vm.feeStr).toBe('$600');
    expect(vm.costStr).toBe('$50');
    expect(vm.settled).toBe(true);
    expect(vm.canSettle).toBe(false); // already settled
    expect(vm.hasMedia).toBe(true);
    expect(vm.photos).toEqual([{ id: 1, url: 'https://img/1.jpg' }]);
  });

  it('builds an upcoming unsettled gig: tracks RSVPs and can be settled by an admin', () => {
    const e = baseEvent({
      id: 'e2', date: '2026-09-20', settled: false, fee: 400, cost: 0,
      attendance: { m1: 'going' },
    });
    const vm = eventVm(e, songs, baseCtx());
    expect(vm.past).toBe(false);
    expect(vm.hasAttendance).toBe(true);
    expect(vm.canRsvp).toBe(true);
    expect(vm.canSettle).toBe(true);
    expect(vm.rsvp).toBe('going');
    expect(vm.rsvpLabel).toBe('Going');
    expect(vm.going.map((p) => p.id)).toEqual(['m1']);
    expect(vm.pending.map((p) => p.id)).toEqual(['m2']);
    expect(vm.goingCount).toBe(1);
    expect(vm.pendingCount).toBe(1);
    expect(vm.attend).toBe('1');
    expect(vm.total).toBe('2');
  });

  it('does not track RSVPs or allow answering on a cancelled event', () => {
    const e = baseEvent({ id: 'e3', date: '2026-09-25', state: 'cancelled' });
    const vm = eventVm(e, songs, baseCtx());
    expect(vm.hasAttendance).toBe(false);
    expect(vm.canRsvp).toBe(false);
    expect(vm.cancelled).toBe(true);
    expect(vm.showState).toBe(true);
    expect(vm.stateLabel).toBe('Cancelled');
  });

  it('a non-admin can never settle, regardless of amounts', () => {
    const e = baseEvent({ id: 'e2', date: '2026-09-20', fee: 400 });
    const vm = eventVm(e, songs, baseCtx({ isAdmin: false }));
    expect(vm.canSettle).toBe(false);
  });

  it('cannot be settled when there is no fee or cost', () => {
    const e = baseEvent({ id: 'e2', date: '2026-09-20', fee: 0, cost: 0 });
    const vm = eventVm(e, songs, baseCtx());
    expect(vm.canSettle).toBe(false);
  });

  it('surfaces a reschedule note built from prevDate', () => {
    const e = baseEvent({ id: 'e4', date: '2026-09-22', state: 'rescheduled', prevDate: '2026-09-05' });
    const vm = eventVm(e, songs, baseCtx());
    expect(vm.movedFrom).toBe('Moved from Sat Sep 5 2026');
  });

  it('is null when there is no prevDate', () => {
    const e = baseEvent({ id: 'e5', date: '2026-09-22' });
    expect(eventVm(e, songs, baseCtx()).movedFrom).toBeNull();
  });

  it('labels a practice setlist as "rehearsed" instead of "setlist"', () => {
    const e = baseEvent({ id: 'e6', type: 'studio', date: '2026-09-20' });
    const vm = eventVm(e, songs, baseCtx());
    expect(vm.isGig).toBe(false);
    expect(vm.isPractice).toBe(true);
    expect(vm.setlistLabel).toBe('Songs rehearsed');
  });

  it('attaches takes recorded during this event', () => {
    const tk: Take = { id: 't1', eventId: 'e7', songId: 's1', url: 'https://x', n: 1 };
    const e = baseEvent({ id: 'e7', type: 'studio', date: '2026-09-05' });
    const vm = eventVm(e, songs, baseCtx({ takes: [tk] }));
    expect(vm.hasTakes).toBe(true);
    expect(vm.takes[0].songTitle).toBe('Alma Llanera');
  });

  it('splits media into photos and videos', () => {
    const e = baseEvent({
      id: 'e8', date: '2026-09-01', media: [
        { id: 1, kind: 'photo', label: { es: '', en: '' }, url: 'https://img/1.jpg' },
        { id: 2, kind: 'video', label: { es: 'Aftermovie', en: 'Aftermovie' }, url: 'https://drive/vid' },
      ],
    });
    const vm = eventVm(e, songs, baseCtx());
    expect(vm.photos).toEqual([{ id: 1, url: 'https://img/1.jpg' }]);
    expect(vm.videos).toEqual([{ id: 2, label: 'Aftermovie', url: 'https://drive/vid' }]);
    expect(vm.hasMedia).toBe(true);
  });

  it('reports hasFeedback based on the presence of feedback', () => {
    const withFb: EventFeedback = {
      sound: 4, perf: 4, log: 4, energy: 4, responses: 1, well: [], improve: [],
      poll: { q: { es: '', en: '' }, options: [] },
    };
    expect(eventVm(baseEvent({ id: 'e9', feedback: withFb }), songs, baseCtx()).hasFeedback).toBe(true);
    expect(eventVm(baseEvent({ id: 'e10' }), songs, baseCtx()).hasFeedback).toBe(false);
  });
});

describe('txVm', () => {
  const events = [baseEvent({ id: 'e1', title: { es: 'Fiesta', en: 'Party' } })];
  const gearList: Gear[] = [{ id: 'g1', name: { es: 'Cuatro viejo', en: 'Old cuatro' }, cost: 100, date: '2026-01-01', holder: 'm1', cond: 'good', note: { es: '', en: '' } }];

  it('formats income with a + sign and emerald color', () => {
    const x: Transaction = { id: 'x1', kind: 'in', amt: 450, date: '2026-09-01', by: 'm1', desc: { es: '', en: 'Gig fee' }, proof: null, proofKind: 'zelle' };
    const vm = txVm(x, baseCtx({ events, gear: gearList }));
    expect(vm.amountStr).toBe('+$450.00');
    expect(vm.isIn).toBe(true);
    expect(vm.arrow).toBe('↑');
    expect(vm.color).toBe('var(--color-emerald)');
    expect(vm.kindLabel).toBe('Income');
    expect(vm.hasProof).toBe(false);
    expect(vm.proofKind).toBe('Zelle');
  });

  it('formats expenses with a minus sign and red color', () => {
    const x: Transaction = { id: 'x2', kind: 'out', amt: 47.3, date: '2026-09-01', by: 'm2', desc: { es: '', en: 'Strings' }, proof: null, proofKind: 'invoice' };
    const vm = txVm(x, baseCtx({ events, gear: gearList }));
    expect(vm.amountStr).toBe('−$47.30');
    expect(vm.isIn).toBe(false);
    expect(vm.arrow).toBe('↓');
    expect(vm.color).toBe('var(--color-red)');
  });

  it('detects an image proof url and exposes the raw proof', () => {
    const x: Transaction = { id: 'x3', kind: 'out', amt: 10, date: '2026-09-01', by: 'm1', desc: { es: '', en: '' }, proof: 'https://x/receipt.PNG', proofKind: 'photo' };
    const vm = txVm(x, baseCtx({ events, gear: gearList }));
    expect(vm.hasProof).toBe(true);
    expect(vm.proofIsImage).toBe(true);
    expect(vm.proofKind).toBe('Photo');
  });

  it('does not flag a non-image proof url as an image', () => {
    const x: Transaction = { id: 'x4', kind: 'out', amt: 10, date: '2026-09-01', by: 'm1', desc: { es: '', en: '' }, proof: 'https://x/receipt.pdf', proofKind: 'receipt' };
    expect(txVm(x, baseCtx({ events, gear: gearList })).proofIsImage).toBe(false);
  });

  it('resolves linked event and gear labels', () => {
    const x: Transaction = { id: 'x5', kind: 'out', amt: 10, date: '2026-09-01', by: 'm1', desc: { es: '', en: '' }, proof: null, proofKind: 'receipt', event: 'e1', gear: 'g1' };
    const vm = txVm(x, baseCtx({ events, gear: gearList }));
    expect(vm.eventLabel).toBe('Party');
    expect(vm.gearLabel).toBe('Old cuatro');
  });

  it('has null event/gear labels when unlinked', () => {
    const x: Transaction = { id: 'x6', kind: 'in', amt: 10, date: '2026-09-01', by: 'm1', desc: { es: '', en: '' }, proof: null, proofKind: 'zelle' };
    const vm = txVm(x, baseCtx({ events, gear: gearList }));
    expect(vm.eventLabel).toBeNull();
    expect(vm.gearLabel).toBeNull();
  });

  it.each([
    ['fee', 'Fee'], ['tip', 'Tip'], ['donation', 'Donation'], ['contribution', 'Contribution'], ['DTV', 'DTV'],
  ] as const)('labels category %s as %s', (category, label) => {
    const x: Transaction = { id: 'xc', kind: 'in', amt: 10, date: '2026-09-01', by: 'm1', desc: { es: '', en: '' }, proof: null, proofKind: 'zelle', category };
    expect(txVm(x, baseCtx({ events, gear: gearList })).categoryLabel).toBe(label);
  });

  it('has a null category label when no category is set', () => {
    const x: Transaction = { id: 'x7', kind: 'out', amt: 10, date: '2026-09-01', by: 'm1', desc: { es: '', en: '' }, proof: null, proofKind: 'receipt' };
    expect(txVm(x, baseCtx({ events, gear: gearList })).categoryLabel).toBeNull();
  });
});

describe('contributionVm', () => {
  it('formats cent totals into dollar strings', () => {
    const vm = contributionVm(member, 123456, 5000);
    expect(vm.memberId).toBe('m2');
    expect(vm.name).toBe('Beto');
    expect(vm.totalStr).toBe('$1,234.56');
    expect(vm.monthStr).toBe('$50.00');
  });
});

describe('gearVm', () => {
  it('marks good condition in emerald and no purchaser when unset', () => {
    const g: Gear = { id: 'g1', name: { es: '', en: 'Old cuatro' }, cost: 100, date: '2026-01-01', holder: 'm1', cond: 'good', note: { es: '', en: '' } };
    const vm = gearVm(g, 'm2', baseCtx());
    expect(vm.condLabel).toBe('Good condition');
    expect(vm.condColor).toBe('var(--color-emerald)');
    expect(vm.holderId).toBe('m2');
    expect(vm.holder).toBe('Beto');
    expect(vm.boughtBy).toBeNull();
    expect(vm.hasTx).toBe(false);
  });

  it('marks attention-needed condition in amber and resolves the purchaser', () => {
    const g: Gear = { id: 'g2', name: { es: '', en: 'Amp' }, cost: 300, date: '2026-01-01', holder: 'm1', cond: 'attention', note: { es: '', en: '' }, boughtBy: 'm2', tx: 'x1' };
    const vm = gearVm(g, 'm1', baseCtx());
    expect(vm.condLabel).toBe('Needs attention');
    expect(vm.condColor).toBe('var(--color-amber)');
    expect(vm.boughtBy).toBe('Beto');
    expect(vm.boughtByInitial).toBe('B');
    expect(vm.hasTx).toBe(true);
  });
});

describe('threadVm', () => {
  it('resolves the author, comment authors and vote state', () => {
    const th: Thread = {
      id: 'th1', by: 'm1', date: '2026-09-01', votes: 3,
      title: { es: '', en: 'New venue idea' }, body: { es: '', en: 'What about downtown?' },
      comments: [{ by: 'm2', text: { es: '', en: 'Love it' } }],
    };
    const vm = threadVm(th, true, baseCtx());
    expect(vm.author).toBe('Ana');
    expect(vm.title).toBe('New venue idea');
    expect(vm.voted).toBe(true);
    expect(vm.votes).toBe('3');
    expect(vm.commentCount).toBe('1');
    expect(vm.comments).toEqual([{ by: 'Beto', initial: 'B', text: 'Love it' }]);
  });
});

describe('memberVm', () => {
  it('builds an admin member vm with resolved instruments and vocals', () => {
    const vm = memberVm(admin, baseCtx());
    expect(vm.isAdminRole).toBe(true);
    expect(vm.roleLabel).toBe('Admin');
    expect(vm.since).toBe('Since Sun Jan 1 2023');
    expect(vm.instruments).toEqual([{ name: 'Cuatro', level: 'Expert', pct: '100%', color: 'var(--color-emerald)' }]);
    expect(vm.vocals).toEqual([{ label: 'Lead vocals', isNone: false }]);
  });

  it('builds a non-admin member vm and flags "no vocals"', () => {
    const vm = memberVm(member, baseCtx());
    expect(vm.isAdminRole).toBe(false);
    expect(vm.roleLabel).toBe('Band member');
    expect(vm.vocals).toEqual([{ label: 'No vocals', isNone: true }]);
  });

  it('falls back to the raw instrument id when not found in the catalog', () => {
    const weirdMember: Member = { ...member, instruments: [{ id: 'ghost', lv: 'beg' }] };
    const vm = memberVm(weirdMember, baseCtx());
    expect(vm.instruments[0].name).toBe('ghost');
  });
});

describe('feedbackVm', () => {
  it('builds rating rows, poll percentages and rounds well/improve authorship', () => {
    const f: EventFeedback = {
      sound: 4.5, perf: 3.8, log: 2.0, energy: 4.2, responses: 4,
      well: [{ by: 'Ana', anon: false, text: { es: '', en: 'Great energy' } }, { by: null, anon: true, text: { es: '', en: 'Solid set' } }],
      improve: [{ by: null, anon: true, text: { es: '', en: 'Start on time' } }],
      poll: { q: { es: '', en: 'Next venue?' }, options: [{ label: { es: '', en: 'Downtown' }, v: 3 }, { label: { es: '', en: 'Uptown' }, v: 1 }] },
    };
    const vm = feedbackVm(f, 0, baseCtx());
    expect(vm.responses).toBe('4');
    expect(vm.rows.map((r) => r.key)).toEqual(['sound', 'perf', 'log', 'energy']);
    expect(vm.rows[0]).toMatchObject({ val: '4.5', pct: '90%', color: 'var(--color-emerald)' });
    expect(vm.rows[1]).toMatchObject({ val: '3.8', color: 'var(--color-amber)' });
    expect(vm.rows[2]).toMatchObject({ val: '2.0', color: 'var(--color-red)' });
    expect(vm.well).toEqual([
      { text: 'Great energy', by: 'Ana', anon: false },
      { text: 'Solid set', by: 'Anonymous', anon: true },
    ]);
    expect(vm.pollQ).toBe('Next venue?');
    expect(vm.pollOpts).toEqual([
      { i: 0, label: 'Downtown', v: '3', pct: '75%', picked: true },
      { i: 1, label: 'Uptown', v: '1', pct: '25%', picked: false },
    ]);
    expect(vm.pollTotal).toBe('4');
  });

  it('avoids a divide-by-zero pollTotal when there are no votes yet', () => {
    const f: EventFeedback = {
      sound: 4, perf: 4, log: 4, energy: 4, responses: 0, well: [], improve: [],
      poll: { q: { es: '', en: '' }, options: [{ label: { es: '', en: 'Only option' }, v: 0 }] },
    };
    const vm = feedbackVm(f, null, baseCtx());
    expect(vm.pollOpts[0].pct).toBe('0%');
    expect(vm.pollOpts[0].picked).toBe(false);
  });
});

describe('igCaption', () => {
  it('builds an English caption with venue, date and time', () => {
    const e = baseEvent({ id: 'e1', date: '2026-09-12', time: '20:00', venue: 'Salon X' });
    expect(igCaption(e, 'en')).toContain('Salon X');
    expect(igCaption(e, 'en')).toContain('Sat Sep 12 2026');
    expect(igCaption(e, 'en')).toContain('#VenezuelanMusic');
  });

  it('builds a Spanish caption', () => {
    const e = baseEvent({ id: 'e1', date: '2026-09-12', time: '20:00', venue: 'Salon X' });
    expect(igCaption(e, 'es')).toContain('#MúsicaVenezolana');
  });
});
