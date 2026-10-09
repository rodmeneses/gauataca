import { describe, expect, it } from 'vitest';
import { classifySaveError, SAVE_FAILURE_KEY } from './errors';

describe('classifySaveError', () => {
  it('reports offline when the browser says so', () => {
    expect(classifySaveError(new Error('x'), false)).toBe('offline');
  });
  it('treats fetch failures as offline', () => {
    expect(classifySaveError(new TypeError('Failed to fetch'), true)).toBe('offline');
    expect(classifySaveError({ message: 'NetworkError when attempting' }, true)).toBe('offline');
  });
  it('detects expired sessions', () => {
    expect(classifySaveError({ status: 401 }, true)).toBe('session');
    expect(classifySaveError({ code: 'PGRST301' }, true)).toBe('session');
    expect(classifySaveError({ message: 'JWT expired' }, true)).toBe('session');
  });
  it('detects RLS / permission denials', () => {
    expect(classifySaveError({ code: '42501' }, true)).toBe('denied');
    expect(classifySaveError({ status: 403 }, true)).toBe('denied');
  });
  it('detects invalid data', () => {
    expect(classifySaveError({ code: '23505' }, true)).toBe('invalid');
    expect(classifySaveError({ code: '22P02' }, true)).toBe('invalid');
    expect(classifySaveError({ status: 400 }, true)).toBe('invalid');
  });
  it('falls back to unknown, including for non-objects', () => {
    expect(classifySaveError({ code: 'XX000' }, true)).toBe('unknown');
    expect(classifySaveError(undefined, true)).toBe('unknown');
    expect(classifySaveError('boom', true)).toBe('unknown');
    expect(classifySaveError({ code: 5, status: 'x', message: 7 }, true)).toBe('unknown');
  });
  it('defaults to the live navigator state', () => {
    expect(classifySaveError({ code: 'XX000' })).toBe('unknown');
  });
  it('maps every reason to a key', () => {
    expect(Object.keys(SAVE_FAILURE_KEY).sort()).toEqual(['denied', 'invalid', 'offline', 'session', 'unknown']);
  });
});
