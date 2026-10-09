import { afterEach, describe, expect, it, vi } from 'vitest';
import { logError, setErrorReporter } from './log';

afterEach(() => { setErrorReporter(null); vi.restoreAllMocks(); });

describe('logError', () => {
  it('logs to the console', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logError('boom', 1);
    expect(spy).toHaveBeenCalledWith('boom', 1);
  });

  it('forwards to the reporter and survives one that throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = vi.fn();
    setErrorReporter(r);
    logError('a', 'x');
    expect(r).toHaveBeenCalledWith('a', 'x');
    setErrorReporter(() => { throw new Error('bad'); });
    expect(() => logError('b')).not.toThrow();
  });
});
