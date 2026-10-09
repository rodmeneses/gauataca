import { lazy, type ComponentType } from 'react';

/** `React.lazy` for a named export: `lazyNamed(() => import('./Ledger'), 'Ledger')`. */
export function lazyNamed<M, K extends keyof M>(load: () => Promise<M>, name: K) {
  type C = M[K] extends ComponentType<infer P> ? ComponentType<P> : never;
  return lazy(() => load().then((m) => ({ default: m[name] as unknown as C })));
}
