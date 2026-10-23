import { afterEach, describe, expect, it, vi } from 'vitest';
import { logError, logWarn } from './log';

afterEach(() => vi.restoreAllMocks());

describe('log', () => {
  it('forwards warnings to console.warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logWarn('w', 1, 2);
    expect(spy).toHaveBeenCalledWith('w', 1, 2);
  });
  it('forwards errors to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logError('e', 'x');
    expect(spy).toHaveBeenCalledWith('e', 'x');
  });
});
