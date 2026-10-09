/**
 * Turns a thrown write error (Supabase/PostgREST or fetch) into one of a few
 * user-facing reasons, so a failed save can say *why* instead of staying silent.
 */
export type SaveFailure = 'offline' | 'denied' | 'invalid' | 'session' | 'unknown';

export function classifySaveError(err: unknown, online = typeof navigator === 'undefined' || navigator.onLine !== false): SaveFailure {
  if (!online) return 'offline';
  const e = (err ?? {}) as { code?: unknown; status?: unknown; message?: unknown };
  const code = typeof e.code === 'string' ? e.code : '';
  const status = typeof e.status === 'number' ? e.status : 0;
  const msg = typeof e.message === 'string' ? e.message : '';
  if (err instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(msg)) return 'offline';
  if (status === 401 || code === 'PGRST301' || code === 'PGRST303' || /jwt/i.test(msg)) return 'session';
  if (status === 403 || code === '42501') return 'denied';
  if (code.startsWith('22') || code.startsWith('23') || status === 400 || status === 422) return 'invalid';
  return 'unknown';
}

/** i18n key for each failure reason. */
export const SAVE_FAILURE_KEY = {
  offline: 'saveFailedOffline',
  denied: 'saveFailedDenied',
  invalid: 'saveFailedInvalid',
  session: 'saveFailedSession',
  unknown: 'saveFailed',
} as const satisfies Record<SaveFailure, string>;
