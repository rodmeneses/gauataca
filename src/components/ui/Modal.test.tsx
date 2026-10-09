import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { stubBrowserApis } from '../../test/dom';
import { Modal } from './index';

beforeAll(stubBrowserApis);
afterEach(cleanup);

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>opener</button>
      {open && (
        <Modal onClose={() => setOpen(false)} maxWidth={400}>
          <h2>Title</h2>
          <button>first</button>
          <button>last</button>
        </Modal>
      )}
    </>
  );
}

const tab = (shift = false) => fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Tab', shiftKey: shift });

describe('Modal', () => {
  it('is a labelled modal dialog and focuses its first control', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('opener'));
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe(screen.getByText('Title').id);
    expect(document.activeElement).toBe(screen.getByText('first'));
  });

  it('wraps Tab and Shift+Tab inside the dialog', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('opener'));
    screen.getByText('last').focus();
    tab();
    expect(document.activeElement).toBe(screen.getByText('first'));
    tab(true);
    expect(document.activeElement).toBe(screen.getByText('last'));
  });

  it('pulls focus back in when it has escaped to the page', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('opener'));
    screen.getByText('opener').focus();
    tab();
    expect(document.activeElement).toBe(screen.getByText('first'));
    screen.getByText('opener').focus();
    tab(true);
    expect(document.activeElement).toBe(screen.getByText('last'));
  });

  it('returns focus to the opener and unlocks scroll on close', () => {
    const { unmount } = render(<Harness />);
    const opener = screen.getByText('opener');
    opener.focus();
    fireEvent.click(opener);
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.click(document.querySelector('.overlay')!);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(opener);
    unmount();
  });

  it('keeps focus on the card when it has nothing focusable', () => {
    render(<Modal onClose={() => {}} maxWidth={300}><p>just text</p></Modal>);
    const dialog = screen.getByRole('dialog');
    expect(document.activeElement).toBe(dialog);
    tab();
    expect(document.activeElement).toBe(dialog);
  });

  it('only the topmost of stacked dialogs traps focus', () => {
    render(
      <>
        <Modal onClose={() => {}} maxWidth={300}><button>outer-a</button><button>outer-b</button></Modal>
        <Modal onClose={() => {}} maxWidth={300}><button>inner-a</button><button>inner-b</button></Modal>
      </>,
    );
    expect(document.activeElement).toBe(screen.getByText('inner-a'));
    screen.getByText('inner-b').focus();
    tab();
    expect(document.activeElement).toBe(screen.getByText('inner-a'));
  });

  it('does not close when the card itself is clicked', () => {
    const onClose = vi.fn();
    render(<Modal onClose={onClose} maxWidth={300}><button>x</button></Modal>);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
