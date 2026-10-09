import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { retry, TimeoutError, withTimeout } from './retry';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('withTimeout', () => {
  it('resolves when the promise wins', async () => {
    await expect(withTimeout(Promise.resolve(1), 100)).resolves.toBe(1);
  });

  it('propagates rejections', async () => {
    await expect(withTimeout(Promise.reject(new Error('x')), 100)).rejects.toThrow('x');
  });

  it('rejects with TimeoutError when too slow', async () => {
    const p = withTimeout(new Promise(() => {}), 100);
    const assertion = expect(p).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(100);
    await assertion;
  });
});

describe('retry', () => {
  it('returns the first success without waiting', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(retry(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries after a failure with backoff', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('a')).mockRejectedValueOnce(new Error('b')).mockResolvedValue('ok');
    const p = retry(fn, { tries: 3, delayMs: 100 });
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);
    await expect(p).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws the last error when attempts run out', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('nope'));
    const p = retry(fn, { tries: 2, delayMs: 10 });
    const assertion = expect(p).rejects.toThrow('nope');
    await vi.advanceTimersByTimeAsync(10);
    await assertion;
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('applies a per-attempt timeout', async () => {
    const fn = vi.fn().mockImplementationOnce(() => new Promise(() => {})).mockResolvedValue('ok');
    const p = retry(fn, { tries: 2, delayMs: 10, timeoutMs: 50 });
    await vi.advanceTimersByTimeAsync(50);
    await vi.advanceTimersByTimeAsync(10);
    await expect(p).resolves.toBe('ok');
  });
});
