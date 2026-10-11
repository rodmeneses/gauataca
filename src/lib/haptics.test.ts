import { describe, it, expect, vi, afterEach } from 'vitest';
import { haptic } from './haptics';

const original = Object.getOwnPropertyDescriptor(navigator, 'vibrate');
afterEach(() => {
  if (original) Object.defineProperty(navigator, 'vibrate', original);
  else delete (navigator as unknown as Record<string, unknown>).vibrate;
});

describe('haptic', () => {
  it('vibrates with the pattern for each kind', () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
    haptic();
    haptic('success');
    haptic('error');
    expect(vibrate.mock.calls).toEqual([[8], [14], [[30, 40, 30]]]);
  });

  it('is a no-op without the Vibration API', () => {
    Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true });
    expect(() => haptic('tap')).not.toThrow();
  });

  it('swallows a throwing vibrate', () => {
    Object.defineProperty(navigator, 'vibrate', { value: () => { throw new Error('blocked'); }, configurable: true });
    expect(() => haptic('tap')).not.toThrow();
  });
});
