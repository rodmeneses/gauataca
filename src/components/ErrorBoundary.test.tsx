import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import { T } from '../i18n';

function Boom(): never {
  throw new Error('render failed');
}

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(<ErrorBoundary><p>fine</p></ErrorBoundary>);
    expect(screen.getByText('fine')).toBeTruthy();
  });

  it('shows the localized fallback with a reload button when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(T.es.errorTitle)).toBeTruthy();
    expect(screen.getByRole('button', { name: T.es.errorReload })).toBeTruthy();
  });
});
