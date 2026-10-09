import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(cleanup);

// jsdom has no matchMedia; components use it for responsive/pointer checks.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

// Newer Node versions ship a global `localStorage` that shadows jsdom's and is
// unusable without --localstorage-file; fall back to an in-memory Storage.
if (typeof window !== 'undefined' && typeof window.localStorage?.clear !== 'function') {
  const store = new Map<string, string>();
  const memory: Storage = {
    get length() { return store.size; },
    clear: () => store.clear(),
    getItem: (k) => store.get(k) ?? null,
    key: (i) => [...store.keys()][i] ?? null,
    removeItem: (k) => { store.delete(k); },
    setItem: (k, v) => { store.set(k, String(v)); },
  };
  Object.defineProperty(window, 'localStorage', { value: memory, configurable: true });
  Object.defineProperty(globalThis, 'localStorage', { value: memory, configurable: true });
}
