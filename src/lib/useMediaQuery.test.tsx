import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from './useMediaQuery';

function mockMatchMedia(initial: boolean) {
  let listener: ((e: { matches: boolean }) => void) | null = null;
  const remove = vi.fn();
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: initial,
    addEventListener: (_: string, l: typeof listener) => { listener = l; },
    removeEventListener: remove,
  }));
  return { fire: (matches: boolean) => listener?.({ matches }), remove };
}

afterEach(() => vi.restoreAllMocks());

describe('useMediaQuery', () => {
  it('reads the initial match and follows changes', () => {
    const mm = mockMatchMedia(false);
    const { result, unmount } = renderHook(() => useMediaQuery('(max-width: 600px)'));
    expect(result.current).toBe(false);
    act(() => mm.fire(true));
    expect(result.current).toBe(true);
    unmount();
    expect(mm.remove).toHaveBeenCalled();
  });
});
