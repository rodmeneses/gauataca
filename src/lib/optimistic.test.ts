import { describe, expect, it } from 'vitest';
import type { DataSnapshot } from './api';
import type { BandEvent, Thread } from '../types';
import { archiveThread, hideDeleted, NO_PENDING_DELETES, pinEvent, pinThread, reactToThread, retally, rsvp } from './optimistic';

const ev = (id: string, extra: Partial<BandEvent> = {}) => ({ id, pinned: false, ...extra }) as BandEvent;
const th = (id: string, extra: Partial<Thread> = {}) =>
  ({ id, pinned: false, archived: false, myReaction: null, reactions: { like: 0, dislike: 0, likedBy: [], dislikedBy: [] }, ...extra }) as Thread;
const snap = (events: BandEvent[], threads: Thread[]) => ({ events, threads }) as unknown as DataSnapshot;

describe('optimistic patches', () => {
  it('pins an event without touching others', () => {
    const out = pinEvent('a', true)(snap([ev('a'), ev('b')], []));
    expect(out.events.map((e) => e.pinned)).toEqual([true, false]);
  });
  it('pins and archives a thread', () => {
    const s = snap([], [th('a'), th('b')]);
    expect(pinThread('a', true)(s).threads.map((t) => t.pinned)).toEqual([true, false]);
    expect(archiveThread('b', true)(s).threads.map((t) => t.archived)).toEqual([false, true]);
  });
  it('sets, changes and clears an RSVP', () => {
    const s = snap([ev('a'), ev('b', { attendance: { u1: 'going', u2: 'no' } })], []);
    expect(rsvp('a', 'going', 'u1')(s).events[0].attendance).toEqual({ u1: 'going' });
    expect(rsvp('b', 'maybe', 'u1')(s).events[1].attendance).toEqual({ u1: 'maybe', u2: 'no' });
    expect(rsvp('b', null, 'u1')(s).events[1].attendance).toEqual({ u2: 'no' });
    expect(rsvp('zzz', 'going', 'u1')(s).events).toEqual(s.events);
  });
  it('retallies a reaction', () => {
    const base = { like: 1, dislike: 1, likedBy: ['u1'], dislikedBy: ['u2'] };
    expect(retally(base, null, 'like', 'u3')).toEqual({ like: 2, dislike: 1, likedBy: ['u1', 'u3'], dislikedBy: ['u2'] });
    expect(retally(base, 'like', 'dislike', 'u1')).toEqual({ like: 0, dislike: 2, likedBy: [], dislikedBy: ['u2', 'u1'] });
    expect(retally(base, 'dislike', null, 'u2')).toEqual({ like: 1, dislike: 0, likedBy: ['u1'], dislikedBy: [] });
    expect(retally({ like: 0, dislike: 0, likedBy: [], dislikedBy: [] }, 'like', null, 'x').like).toBe(0);
  });
  it('reacts to a thread', () => {
    const out = reactToThread('a', 'like', 'u1')(snap([], [th('a'), th('b')]));
    expect(out.threads[0]).toMatchObject({ myReaction: 'like', reactions: { like: 1, likedBy: ['u1'] } });
    expect(out.threads[1].myReaction).toBeNull();
  });
});

describe('hideDeleted', () => {
  const comment = (id: number, replies: { id: number }[] = []) => ({ id, replies }) as unknown as Thread['comments'][number];
  const s = {
    links: [{ id: 1 }, { id: 2 }],
    threads: [th('a', { comments: [comment(10, [{ id: 11 }, { id: 12 }]), comment(20)] })],
  } as unknown as DataSnapshot;

  it('returns the same snapshot when nothing is pending', () => {
    expect(hideDeleted(s, NO_PENDING_DELETES)).toBe(s);
  });
  it('hides pending links', () => {
    expect(hideDeleted(s, { links: [2], comments: [] }).links.map((l) => l.id)).toEqual([1]);
  });
  it('hides a pending comment together with its replies', () => {
    const out = hideDeleted(s, { links: [], comments: [10] });
    expect(out.threads[0].comments.map((c) => c.id)).toEqual([20]);
    expect(out.links).toEqual(s.links);
  });
  it('hides a pending reply only', () => {
    const out = hideDeleted(s, { links: [], comments: [11] });
    expect(out.threads[0].comments[0].replies.map((r) => r.id)).toEqual([12]);
  });
});
