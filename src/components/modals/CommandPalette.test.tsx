import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { T } from '../../i18n';

const store = vi.hoisted(() => ({
  results: [] as Array<{ idx: string; group: string; label: string; sub: string; run: () => void }>,
  setPq: vi.fn(),
  closePalette: vi.fn(),
  pq: '',
}));
vi.mock('@/store', () => ({
  useGuataca: () => ({ t: T.en, state: { pq: store.pq }, setPq: store.setPq, closePalette: store.closePalette, paletteResults: store.results }),
}));

import { CommandPalette } from './CommandPalette';

const item = (n: number) => ({ idx: String(n), group: 'Go', label: `Item ${n}`, sub: '', run: vi.fn() });

beforeEach(() => {
  store.results = [item(1), item(2), item(3)];
  store.pq = '';
  store.setPq.mockReset();
  store.closePalette.mockReset();
});

describe('CommandPalette', () => {
  it('exposes a combobox wired to a listbox of options', () => {
    render(<CommandPalette />);
    const input = screen.getByRole('combobox');
    const list = screen.getByRole('listbox');
    expect(input.getAttribute('aria-controls')).toBe(list.id);
    expect(input.getAttribute('aria-expanded')).toBe('true');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);
  });

  it('moves the active option with the arrow keys (wrapping) and runs it on Enter', () => {
    render(<CommandPalette />);
    const input = screen.getByRole('combobox');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')[1].getAttribute('aria-selected')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[1].id);
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(screen.getAllByRole('option')[2].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(store.results[2].run).toHaveBeenCalledOnce();
    expect(store.results[0].run).not.toHaveBeenCalled();
  });

  it('hovering an option makes it the one Enter runs', () => {
    render(<CommandPalette />);
    fireEvent.mouseMove(screen.getAllByRole('option')[1]);
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
    expect(store.results[1].run).toHaveBeenCalledOnce();
  });

  it('typing updates the query and resets the active option', () => {
    render(<CommandPalette />);
    const input = screen.getByRole('combobox');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.change(input, { target: { value: 'it' } });
    expect(store.setPq).toHaveBeenCalledWith('it');
    expect(screen.getAllByRole('option')[0].getAttribute('aria-selected')).toBe('true');
  });

  it('shows the empty state and ignores keys when nothing matches', () => {
    store.results = [];
    store.pq = 'zzz';
    render(<CommandPalette />);
    const input = screen.getByRole('combobox');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.getAttribute('aria-activedescendant')).toBeNull();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText(T.en.noResults)).toBeTruthy();
  });

  it('clicking the scrim closes it, clicking inside does not', () => {
    const { container } = render(<CommandPalette />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(store.closePalette).not.toHaveBeenCalled();
    fireEvent.click(container.firstElementChild!);
    expect(store.closePalette).toHaveBeenCalledOnce();
  });
});
