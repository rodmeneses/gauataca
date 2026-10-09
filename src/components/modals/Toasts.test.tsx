import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { T } from '../../i18n';

const store = vi.hoisted(() => ({ toasts: [] as Array<Record<string, unknown>>, dismissToast: vi.fn() }));
vi.mock('@/store', () => ({ useGuataca: () => ({ t: T.en, toasts: store.toasts, dismissToast: store.dismissToast }) }));

import { Toasts } from './Toasts';

const toast = (over: Record<string, unknown> = {}) => ({ id: 'k1', msg: 'Saved', tone: 'ok', color: 'red', border: 'red', bg: 'red', leaving: false, ...over });

describe('Toasts', () => {
  it('keeps an empty polite live region mounted so announcements are not missed', () => {
    store.toasts = [];
    render(<Toasts />);
    const region = screen.getByRole('status');
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.children).toHaveLength(0);
  });

  it('announces errors as alerts and plain messages as status', () => {
    store.toasts = [toast(), toast({ id: 'k2', msg: 'Could not save', tone: 'err' })];
    render(<Toasts />);
    expect(screen.getByRole('alert').textContent).toContain('Could not save');
    expect(screen.getByText('Saved')).toBeTruthy();
  });

  it('dismisses on tap and runs a toast action (e.g. Undo) before dismissing', () => {
    const run = vi.fn();
    store.dismissToast.mockReset();
    store.toasts = [toast({ action: { label: 'Undo', run } })];
    render(<Toasts />);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(run).toHaveBeenCalledOnce();
    expect(store.dismissToast).toHaveBeenCalledWith('k1');
    store.dismissToast.mockReset();
    fireEvent.click(screen.getByTitle(T.en.dismiss));
    expect(store.dismissToast).toHaveBeenCalledWith('k1');
  });
});
