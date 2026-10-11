/** Tiny wrapper over the Vibration API (Android/Chrome; a silent no-op on iOS and desktop). */
export type HapticKind = 'tap' | 'success' | 'error';

const PATTERNS: Record<HapticKind, number | number[]> = {
  tap: 8,
  success: 14,
  error: [30, 40, 30],
};

export function haptic(kind: HapticKind = 'tap'): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    /* some browsers throw when vibration is blocked by policy */
  }
}
