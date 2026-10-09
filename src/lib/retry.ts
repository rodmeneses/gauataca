/**
 * Network resilience helpers: a timeout so a dead connection can't hang the UI,
 * and a retry for idempotent reads. Writes get a timeout only — retrying a
 * non-idempotent insert could duplicate it.
 */
export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

export function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

export interface RetryOptions {
  /** Total attempts, including the first. */
  tries?: number;
  /** Delay before the first retry; doubles each time. */
  delayMs?: number;
  timeoutMs?: number;
}

export async function retry<T>(fn: () => PromiseLike<T>, { tries = 2, delayMs = 400, timeoutMs }: RetryOptions = {}): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < tries; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, delayMs * 2 ** (attempt - 1)));
    try {
      return await (timeoutMs ? withTimeout(fn(), timeoutMs) : fn());
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}
