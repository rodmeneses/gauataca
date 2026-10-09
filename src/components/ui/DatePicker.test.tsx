import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DatePicker } from './DatePicker';
import { T } from '../../i18n';

describe('DatePicker', () => {
  it('shows the formatted value and announces the popup', () => {
    render(<DatePicker value="2026-11-07" onChange={() => {}} lang="en" />);
    const trigger = screen.getByRole('button', { expanded: false });
    expect(trigger.textContent).toContain('Sat Nov 7 2026');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('picks a day and closes', () => {
    const onChange = vi.fn();
    render(<DatePicker value="2026-11-07" onChange={onChange} lang="en" />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByRole('dialog', { name: /Nov.* 2026/i })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '15' }));
    expect(onChange).toHaveBeenCalledWith('2026-11-15');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('navigates months with localized button labels', () => {
    render(<DatePicker value="2026-11-07" onChange={() => {}} lang="es" />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    fireEvent.click(screen.getByRole('button', { name: T.es.nextMonth }));
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toMatch(/dic.* 2026/i);
    fireEvent.click(screen.getByRole('button', { name: T.es.prevMonth }));
    fireEvent.click(screen.getByRole('button', { name: T.es.prevMonth }));
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toMatch(/oct.* 2026/i);
  });

  it('Escape closes only the popup, not whatever sits beneath it', () => {
    const outer = vi.fn();
    window.addEventListener('keydown', outer);
    render(<DatePicker value="" onChange={() => {}} lang="en" placeholder="pick" />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(outer).not.toHaveBeenCalled();
    window.removeEventListener('keydown', outer);
  });

  it('clicking elsewhere closes it', () => {
    render(<DatePicker value="" onChange={() => {}} lang="en" />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
