import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Badge, Button, Modal, Pill } from './index';
import { useConfirm } from './ConfirmDialog';
import { T } from '../../i18n';

vi.mock('@/store', () => ({ useGuataca: () => ({ t: T.en }) }));

describe('Button / Pill / Badge', () => {
  it('Button defaults to type=button and fires onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    const b = screen.getByRole('button', { name: 'Go' });
    expect(b).toHaveProperty('type', 'button');
    fireEvent.click(b);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('Pill renders its children', () => {
    render(<Pill active onClick={() => {}}>Rock</Pill>);
    expect(screen.getByRole('button', { name: 'Rock' })).toBeTruthy();
  });

  it('Badge renders text', () => {
    render(<Badge color="red">Live</Badge>);
    expect(screen.getByText('Live')).toBeTruthy();
  });
});

// jsdom has no layout, so offsetParent is always null; the focus trap uses it to skip hidden elements.
Object.defineProperty(HTMLElement.prototype, 'offsetParent', { configurable: true, get() { return this.parentNode; } });

describe('Modal', () => {
  it('is an accessible modal dialog named by its first heading', () => {
    render(<Modal onClose={() => {}} maxWidth={400}><h2>Edit song</h2><button>Save</button></Modal>);
    const dlg = screen.getByRole('dialog', { name: 'Edit song' });
    expect(dlg.getAttribute('aria-modal')).toBe('true');
  });

  it('closes on scrim click but not on card click', () => {
    const onClose = vi.fn();
    render(<Modal onClose={onClose} maxWidth={400}><h2>X</h2></Modal>);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('dialog').parentElement!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('locks body scroll while open and releases it on unmount', () => {
    const { unmount } = render(<Modal onClose={() => {}} maxWidth={400}><h2>X</h2></Modal>);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('traps Tab focus inside the card', () => {
    render(<Modal onClose={() => {}} maxWidth={400}><button>One</button><button>Two</button></Modal>);
    const [one, two] = [screen.getByText('One'), screen.getByText('Two')];
    expect(document.activeElement).toBe(one);
    two.focus();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' });
    expect(document.activeElement).toBe(one);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(two);
  });

  it('restores focus to the opener on close', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = render(<Modal onClose={() => {}} maxWidth={400}><button>In</button></Modal>);
    expect(document.activeElement).not.toBe(opener);
    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});

function Harness({ onConfirm }: { onConfirm: () => void }) {
  const { confirm, dialog } = useConfirm();
  return (
    <>
      <button onClick={() => confirm({ message: 'Really?', onConfirm })}>Delete it</button>
      {dialog}
    </>
  );
}

describe('useConfirm', () => {
  it('does nothing until asked, then shows the message', () => {
    render(<Harness onConfirm={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByText('Delete it'));
    expect(screen.getByText('Really?')).toBeTruthy();
  });

  it('Cancel closes without acting', () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Delete it'));
    fireEvent.click(screen.getByRole('button', { name: T.en.cancel }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('Escape closes without acting', () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Delete it'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('the confirm button runs the action and closes', async () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Delete it'));
    fireEvent.click(screen.getByRole('button', { name: T.en.delete }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
