/** Shared frame for the form-style modals: header, scrolling body and footer. */
import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { ExternalLink, Upload, X } from 'lucide-react';
import { useGuataca } from '@/store';
import { Button, Field, Input } from '@/components/ui';
import type { FormVm } from '@/store';
import { haptic } from '../../lib/haptics';
import { isValidUpload, MAX_PROOF_BYTES, type FormErrors } from '../../lib/validate';

/**
 * Inline validation for a form modal. A field's error shows once it holds a bad
 * value, or for every bad field after a save attempt; saving with errors is blocked.
 */
export function useValidated(errors: FormErrors, onSave: () => void | Promise<void>) {
  const { t } = useGuataca();
  const [tried, setTried] = useState(false);
  const err = (field: string, value: string | undefined): string | undefined => {
    const key = errors[field];
    return key && (tried || (value ?? '').trim() !== '') ? t[key] : undefined;
  };
  const save = () => {
    if (Object.keys(errors).length > 0) {
      setTried(true);
      haptic('error');
      return;
    }
    void onSave();
  };
  return { err, save };
}

/** Props (`value` + `onChange`) that wire a text input to a string field of the form draft. */
export function useFormBind() {
  const { form, setForm } = useGuataca();
  return <K extends { [P in keyof FormVm]: FormVm[P] extends string ? P : never }[keyof FormVm]>(key: K) => ({
    value: form[key] as string,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(key, e.target.value as never),
  });
}

/** Proof of a movement: a URL input plus a receipt/invoice upload (max 5 MB) with an image preview. */
export function ProofField() {
  const { t, form, setForm, uploadProof, toast } = useGuataca();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!isValidUpload(file, MAX_PROOF_BYTES, true)) {
      toast(t.uploadFailed, 'err');
      return;
    }
    setUploading(true);
    const url = await uploadProof(file);
    setUploading(false);
    if (url) {
      setForm('proof', url);
      setForm('proofKind', file.type.startsWith('image/') ? 'photo' : 'invoice');
    }
  };

  const isImage = /\.(png|jpe?g|webp|gif|heic)(\?|$)/i.test(form.proof);

  return (
    <Field
      label={
        <>
          <ExternalLink size={12} strokeWidth={2.2} />
          {t.proof}
        </>
      }
      labelClassName="flex items-center gap-2 text-emerald-light"
    >
      <div className="flex gap-2">
        <Input
          mono
          value={form.proof}
          onChange={(e) => setForm('proof', e.target.value)}
          placeholder="https://drive.google.com/file/d/…"
          className="text-[13px] border-emerald/40 focus:border-emerald/40 flex-1"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex-none inline-flex items-center gap-[6px] py-[9px] px-[12px] rounded-[10px] border border-emerald/40 bg-[var(--color-tint-emerald)] text-emerald-light font-sans font-semibold text-[12.5px] leading-[normal] cursor-pointer hover:bg-[var(--color-tint-emerald)] disabled:opacity-50 disabled:cursor-wait"
        >
          <Upload size={14} strokeWidth={2} />
          {uploading ? t.uploading : t.upload}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onPick} />
      {isImage && (
        <img src={form.proof} alt={t.proofPreview} className="mt-2 max-h-[120px] rounded-[8px] border border-line" />
      )}
      <span className="block text-[11.5px] text-ink-dim mt-2 leading-[1.5]">{t.proofHint}</span>
    </Field>
  );
}

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
