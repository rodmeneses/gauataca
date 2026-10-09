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
  class MemoryStorage {
    private store = new Map<string, string>();
    get length() { return this.store.size; }
    clear() { this.store.clear(); }
    getItem(k: string) { return this.store.get(k) ?? null; }
    key(i: number) { return [...this.store.keys()][i] ?? null; }
    removeItem(k: string) { this.store.delete(k); }
    setItem(k: string, v: string) { this.store.set(k, String(v)); }
  }
  const memory = new MemoryStorage();
  Object.defineProperty(window, 'localStorage', { value: memory, configurable: true });
  Object.defineProperty(globalThis, 'localStorage', { value: memory, configurable: true });
}
