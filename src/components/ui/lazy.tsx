/**
 * Code-splitting helpers. `lazyNamed` lazy-loads a named export; `LazyBoundary`
 * supplies the Suspense fallback and catches a failed chunk load (e.g. a stale
 * tab after a deploy) with a reload prompt instead of a blank screen.
 */
import { Component, lazy, Suspense, type ComponentType, type ErrorInfo, type ReactNode } from 'react';
import { logError } from '../../lib/log';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>;
type ComponentKeys<M> = { [P in keyof M]: M[P] extends AnyComponent ? P : never }[keyof M];

export function lazyNamed<M, K extends ComponentKeys<M>>(load: () => Promise<M>, name: K) {
  return lazy(() => load().then((m) => ({ default: m[name] as AnyComponent }))) as unknown as M[K];
}

class ChunkErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: Error, info: ErrorInfo) { logError('Lazy chunk failed to load', { err, info }); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="p-6 text-[14px] text-ink-dim flex flex-wrap items-center gap-3">
        <span>No se pudo cargar esta sección · Couldn't load this section.</span>
        <button type="button" className="underline text-emerald" onClick={() => window.location.reload()}>Recargar · Reload</button>
      </div>
    );
  }
}

export function LazyBoundary({ fallback = null, children }: { fallback?: ReactNode; children: ReactNode }) {
  return (
    <ChunkErrorBoundary>
      <Suspense fallback={fallback}>{children}</Suspense>
    </ChunkErrorBoundary>
  );
}
