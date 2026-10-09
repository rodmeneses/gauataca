/**
 * In-memory queue for writes attempted while offline. They are replayed in order
 * once the browser reconnects (see `run` in data.tsx). Not persisted: closing the
 * tab drops anything still queued, which the UI says plainly when it queues.
 */
export interface OfflineQueue {
  push: (job: () => Promise<unknown>) => number;
  size: () => number;
  /** Run queued jobs in order; a failing job is skipped, not retried. Returns how many failed. */
  flush: () => Promise<number>;
}

export function createOfflineQueue(): OfflineQueue {
  let jobs: Array<() => Promise<unknown>> = [];
  let flushing: Promise<number> | null = null;
  return {
    push: (job) => jobs.push(job),
    size: () => jobs.length,
    flush: () => {
      // Concurrent `online` events must not replay the same jobs twice.
      if (flushing) return flushing;
      flushing = (async () => {
        let failed = 0;
        while (jobs.length) {
          const [job, ...rest] = jobs;
          jobs = rest;
          try { await job(); } catch (err) { failed += 1; console.error('Queued write failed:', err); }
        }
        flushing = null;
        return failed;
      })();
      return flushing;
    },
  };
}
