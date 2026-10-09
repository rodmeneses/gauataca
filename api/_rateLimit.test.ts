// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { allow, clientKey, resetRateLimits } from './_rateLimit';

beforeEach(resetRateLimits);

describe('allow', () => {
  it('permits up to max calls per window, then refuses', () => {
    expect([1, 2, 3].map(() => allow('k', 3, 1000, 0))).toEqual([true, true, true]);
    expect(allow('k', 3, 1000, 10)).toBe(false);
  });
  it('lets calls through again once the window has passed', () => {
    for (let i = 0; i < 2; i++) allow('k', 2, 1000, 0);
    expect(allow('k', 2, 1000, 500)).toBe(false);
    expect(allow('k', 2, 1000, 1500)).toBe(true);
  });
  it('tracks keys independently', () => {
    allow('a', 1, 1000, 0);
    expect(allow('a', 1, 1000, 1)).toBe(false);
    expect(allow('b', 1, 1000, 1)).toBe(true);
  });
  it('stays bounded when many distinct keys arrive', () => {
    for (let i = 0; i < 6000; i++) allow(`k${i}`, 1, 60_000, 0);
    expect(allow('k5999', 1, 60_000, 1)).toBe(false);
    expect(allow('k0', 1, 60_000, 1)).toBe(true);
  });
});

describe('clientKey', () => {
  it('uses the first x-forwarded-for hop', () => {
    expect(clientKey({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' })).toBe('1.1.1.1');
    expect(clientKey({ 'x-forwarded-for': ['3.3.3.3'] })).toBe('3.3.3.3');
  });
  it('falls back to "unknown"', () => {
    expect(clientKey(undefined)).toBe('unknown');
    expect(clientKey({ 'x-forwarded-for': '' })).toBe('unknown');
  });
});
