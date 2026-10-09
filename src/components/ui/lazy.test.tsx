import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AppSkeleton, ViewSkeleton } from './index';
import { LazyBoundary, lazyNamed } from './lazy';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}); });

describe('lazyNamed + LazyBoundary', () => {
  it('shows the fallback, then the named export', async () => {
    const Hello = lazyNamed(async () => ({ Hello: () => <p>hello</p> }), 'Hello');
    render(<LazyBoundary fallback={<span>loading</span>}><Hello /></LazyBoundary>);
    expect(screen.getByText('loading')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('hello')).toBeTruthy());
  });

  it('shows a reload prompt when the chunk fails to load', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    const Broken = lazyNamed(() => Promise.reject(new Error('chunk 404')) as Promise<{ Broken: () => null }>, 'Broken');
    render(<LazyBoundary><Broken /></LazyBoundary>);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/Reload/);
    fireEvent.click(screen.getByRole('button'));
    expect(reload).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('skeletons', () => {
  it('ViewSkeleton is an aria-busy status region', () => {
    render(<ViewSkeleton />);
    expect(screen.getByRole('status').getAttribute('aria-busy')).toBe('true');
  });

  it('AppSkeleton wraps the view skeleton', () => {
    render(<AppSkeleton />);
    expect(screen.getByRole('status')).toBeTruthy();
  });
});
