import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { stubBrowserApis } from '../../test/dom';

vi.mock('@/store', () => ({ useGuataca: () => ({ t: { confirmDeleteTitle: 'Delete?', cancel: 'Cancel', delete: 'Delete' } }) }));

import { useConfirm } from './ConfirmDialog';

beforeAll(stubBrowserApis);
afterEach(cleanup);

function Harness({ onConfirm }: { onConfirm: () => void }) {
  const { confirm, dialog } = useConfirm();
  return (
    <>
      <button onClick={() => confirm({ message: 'Sure?', onConfirm })}>trash</button>
      {dialog}
    </>
  );
}

describe('useConfirm', () => {
  it('renders nothing until asked', () => {
    render(<Harness onConfirm={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Cancel dismisses without acting', () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('trash'));
    expect(screen.getByText('Sure?')).toBeTruthy();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('Escape dismisses without acting', () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('trash'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirming runs the action, then closes', async () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('trash'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
