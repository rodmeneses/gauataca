/** Shared frame for the form-style modals: header, scrolling body and footer. */
import { type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useGuataca } from '@/store';
import { Button } from '@/components/ui';

/* ------------------------------------------------------------ shared frame */
export function FormHeader({ title, onClose }: { title: string; onClose: () => void }) {
  const { t } = useGuataca();
  return (
    <div className="p-[20px_22px] border-b border-line-soft flex items-center gap-[14px]">
      <h2 className="m-0 flex-1 font-display font-semibold text-[17px] leading-[normal] text-ink-bright">{title}</h2>
      {/* Inline (not CloseButton): the design's 32px close in these modals has no hover state. */}
      <button type="button" onClick={onClose} aria-label={t.close} className="grid place-items-center w-8 h-8 rounded-[9px] border border-line bg-surface text-ink-meta cursor-pointer">
        <X size={15} strokeWidth={2.2} />
      </button>
    </div>
  );
}

export function FormBody({ children }: { children: ReactNode }) {
  return <div className="p-[20px_22px] flex flex-col gap-[14px]">{children}</div>;
}

export function FormFooter({ cancel, save, onCancel, onSave, saveDisabled }: { cancel: string; save: string; onCancel: () => void; onSave: () => void; saveDisabled?: boolean }) {
  return (
    <div className="p-[16px_22px] border-t border-line-soft flex gap-[10px] justify-end">
      {/* Inline (not Button surface): the design's cancel has no hover; `.btn-surface` adds one. */}
      <button type="button" onClick={onCancel} className="min-h-[44px] p-[11px_17px] rounded-[10px] border border-line bg-surface text-ink-body font-sans font-semibold text-[13px] leading-[normal] cursor-pointer">
        {cancel}
      </button>
      <Button variant="primary" className="p-[11px_17px] disabled:opacity-45 disabled:cursor-not-allowed" onClick={onSave} disabled={saveDisabled}>
        {save}
      </Button>
    </div>
  );
}
