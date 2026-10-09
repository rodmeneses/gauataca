/**
 * Best-effort in-memory rate limiter for the serverless handlers.
 *
 * State lives in the function instance, so it is per warm instance rather than global —
 * enough to blunt a script hammering one endpoint, not a substitute for edge/WAF limits.
 * (The leading underscore keeps Vercel from exposing this file as a route.)
 */
const hits = new Map<string, number[]>();
const MAX_KEYS = 5000;

/** Returns true when `key` is still within `max` calls per `windowMs`, and records the call. */
export function allow(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  // Keep memory bounded on a long-lived instance: drop the oldest keys first.
  if (hits.size > MAX_KEYS) {
    for (const k of hits.keys()) {
      hits.delete(k);
      if (hits.size <= MAX_KEYS * 0.8) break;
    }
  }
  return true;
}

/** Test hook. */
export function resetRateLimits(): void {
  hits.clear();
}

/** Client address from the proxy headers Vercel sets (first hop of x-forwarded-for). */
export function clientKey(headers: Record<string, string | string[] | undefined> | undefined): string {
  const fwd = headers?.['x-forwarded-for'];
  const v = Array.isArray(fwd) ? fwd[0] : fwd;
  return (v?.split(',')[0] ?? 'unknown').trim() || 'unknown';
}
