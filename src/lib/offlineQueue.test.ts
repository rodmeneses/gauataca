import { describe, expect, it, vi } from 'vitest';
import { createOfflineQueue } from './offlineQueue';

describe('offline queue', () => {
  it('replays jobs in order and empties itself', async () => {
    const q = createOfflineQueue();
    const order: number[] = [];
    expect(q.push(async () => { order.push(1); })).toBe(1);
    expect(q.push(async () => { order.push(2); })).toBe(2);
    expect(q.size()).toBe(2);
    expect(await q.flush()).toBe(0);
    expect(order).toEqual([1, 2]);
    expect(q.size()).toBe(0);
  });

  it('skips a failing job, counts it, and keeps going', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const q = createOfflineQueue();
    const ran = vi.fn();
    q.push(async () => { throw new Error('x'); });
    q.push(async () => { ran(); });
    expect(await q.flush()).toBe(1);
    expect(ran).toHaveBeenCalledOnce();
  });

  it('does not replay twice on overlapping flushes', async () => {
    const q = createOfflineQueue();
    const job = vi.fn(async () => {});
    q.push(job);
    const [a, b] = await Promise.all([q.flush(), q.flush()]);
    expect([a, b]).toEqual([0, 0]);
    expect(job).toHaveBeenCalledOnce();
  });

  it('can be flushed again after finishing', async () => {
    const q = createOfflineQueue();
    const job = vi.fn(async () => {});
    q.push(job);
    await q.flush();
    q.push(job);
    await q.flush();
    expect(job).toHaveBeenCalledTimes(2);
  });
});
