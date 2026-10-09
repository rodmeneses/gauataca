import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';

const toast = vi.fn();
const t = { offline: 'OFFLINE', backOnline: 'BACK', offlineWriteQueued: 'QUEUED', queuedWritesSynced: 'SYNCED', queuedWritesFailed: 'FAILED' };
vi.mock('@/store', () => ({ useGuataca: () => ({ t, toast }) }));

import { OfflineBanner } from './OfflineBanner';

const setOnLine = (v: boolean) => Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => v });

beforeEach(() => { toast.mockReset(); setOnLine(true); });
afterEach(cleanup);

describe('OfflineBanner', () => {
  it('renders nothing while online', () => {
    render(<OfflineBanner />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('starts visible when the page loads offline', () => {
    setOnLine(false);
    render(<OfflineBanner />);
    expect(screen.getByRole('status').textContent).toContain('OFFLINE');
  });

  it('shows on offline and hides with a toast on reconnect', () => {
    render(<OfflineBanner />);
    act(() => { window.dispatchEvent(new Event('offline')); });
    expect(screen.getByRole('status')).toBeTruthy();
    act(() => { window.dispatchEvent(new Event('online')); });
    expect(screen.queryByRole('status')).toBeNull();
    expect(toast).toHaveBeenCalledWith('BACK');
  });

  it('toasts when a write is queued', () => {
    render(<OfflineBanner />);
    act(() => { window.dispatchEvent(new Event('guataca:offline-write')); });
    expect(toast).toHaveBeenCalledWith('QUEUED', 'violet');
  });

  it('toasts the flush result, success or failure', () => {
    render(<OfflineBanner />);
    act(() => { window.dispatchEvent(new CustomEvent('guataca:queue-flushed', { detail: { failed: 0 } })); });
    expect(toast).toHaveBeenLastCalledWith('SYNCED', 'ok');
    act(() => { window.dispatchEvent(new CustomEvent('guataca:queue-flushed', { detail: { failed: 2 } })); });
    expect(toast).toHaveBeenLastCalledWith('FAILED', 'err');
    act(() => { window.dispatchEvent(new Event('guataca:queue-flushed')); });
    expect(toast).toHaveBeenLastCalledWith('SYNCED', 'ok');
  });
});
