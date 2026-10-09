/**
 * Last-resort fallback: a render error anywhere below shows a reload prompt
 * instead of a blank screen. Sits above the providers, so it reads the stored
 * language itself and uses only token classes (no theme/context dependencies).
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { T } from '../i18n';
import { readLangPref } from '../lib/prefs';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const t = T[readLangPref() ?? 'es'];
    return (
      <div role="alert" className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-base)] text-ink-bright font-sans">
        <div className="max-w-[380px] text-center">
          <h1 className="font-display font-semibold text-[18px] mb-2">{t.errorTitle}</h1>
          <p className="text-[13px] text-ink-muted leading-[1.6] mb-5">{t.errorBody}</p>
          <button type="button" className="btn btn-primary p-[11px_17px]" onClick={() => window.location.reload()}>{t.errorReload}</button>
        </div>
      </div>
    );
  }
}
