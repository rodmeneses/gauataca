/**
 * Single sink for runtime errors. Everything that would `console.error` goes
 * through here so a reporter (Sentry, etc.) can be plugged in at one place.
 */
type Reporter = (message: string, err: unknown) => void;

let reporter: Reporter | null = null;

export function setErrorReporter(r: Reporter | null): void {
  reporter = r;
}

export function logError(message: string, err?: unknown): void {
  console.error(message, err);
  try { reporter?.(message, err); } catch { /* a broken reporter must never break the app */ }
}
