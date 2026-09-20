/**
 * Confirmation step for destructive actions. `useConfirm()` returns a `confirm(opts)`
 * trigger plus the `dialog` node to render once in the calling component:
 *
 *   const { confirm, dialog } = useConfirm();
 *   <button onClick={() => confirm({ message: t.confirmDeleteTx, onConfirm: () => deleteTx(id) })} />
 *   {dialog}
 *
 * Escape / scrim / Cancel dismiss without acting. Escape is swallowed in the capture
 * phase so the global Escape handler doesn't also close the modal underneath.
 */
import { useCallback, useEffect, useId, useState, type ReactNode } from 'react';
import { Modal, Button } from './index';
import { useGuataca } from '@/store';

export interface ConfirmOptions {
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}

function ConfirmDialog({ title, message, confirmLabel, onConfirm, onClose }: ConfirmOptions & { onClose: () => void }) {
  const { t } = useGuataca();
  const [busy, setBusy] = useState(false);
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const run = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      onClose();
    }
  };

  return (
    <Modal onClose={busy ? () => {} : onClose} maxWidth={400} z={90} labelledBy={titleId}>
      <div className="p-[22px]">
        <div id={titleId} className="font-display font-semibold text-[16px] leading-normal text-ink-bright mb-[7px]">{title ?? t.confirmDeleteTitle}</div>
        <div className="text-[13px] text-ink-muted leading-[1.6]">{message}</div>
        <div className="flex gap-[10px] justify-end mt-[18px]">
          <Button variant="surface" onClick={onClose} disabled={busy} className="p-[11px_17px]">{t.cancel}</Button>
          <Button
            variant="ghost"
            onClick={run}
            disabled={busy}
            className="p-[11px_17px]"
            style={{ borderColor: 'color-mix(in srgb, var(--color-rose) 40%, transparent)', background: 'color-mix(in srgb, var(--color-rose) 12%, transparent)', color: 'var(--color-rose)' }}
          >
            {confirmLabel ?? t.delete}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function useConfirm() {
  const [req, setReq] = useState<ConfirmOptions | null>(null);
  const close = useCallback(() => setReq(null), []);
  const confirm = useCallback((opts: ConfirmOptions) => setReq(opts), []);
  const dialog = req ? <ConfirmDialog {...req} onClose={close} /> : null;
  return { confirm, dialog };
}
