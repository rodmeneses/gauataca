/**
 * Manual-copy fallback for when the Clipboard API is blocked: a dialog with the text
 * pre-selected so it can be copied by hand (replaces the old `window.prompt`).
 *
 *   const { copyOrShow, dialog } = useCopyFallback();
 *   copyOrShow(label, url, () => toast(t.linkCopied));
 *   {dialog}
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Modal, Button, Input } from './index';
import { useGuataca } from '@/store';

function CopyDialog({ label, text, onClose }: { label: string; text: string; onClose: () => void }) {
  const { t } = useGuataca();
  const titleId = useId();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.select(); }, []);

  return (
    <Modal onClose={onClose} maxWidth={440} z={120} labelledBy={titleId}>
      <div className="p-[20px_22px] flex flex-col gap-3">
        <h2 id={titleId} className="m-0 font-display font-semibold text-[16px] leading-normal text-ink-bright">{label}</h2>
        <p className="m-0 font-sans text-[13px] leading-[1.5] text-ink-dim">{t.copyManualHint}</p>
        <Input ref={ref} mono readOnly value={text} onFocus={(e) => e.currentTarget.select()} className="text-[13px]" />
        <div className="flex justify-end">
          <Button variant="primary" onClick={onClose}>{t.close}</Button>
        </div>
      </div>
    </Modal>
  );
}

export function useCopyFallback() {
  const [shown, setShown] = useState<{ label: string; text: string } | null>(null);
  const copyOrShow = useCallback(async (label: string, text: string, onCopied: () => void) => {
    try {
      await navigator.clipboard.writeText(text);
      onCopied();
    } catch {
      setShown({ label, text });
    }
  }, []);
  const dialog = shown ? <CopyDialog label={shown.label} text={shown.text} onClose={() => setShown(null)} /> : null;
  return { copyOrShow, dialog };
}
