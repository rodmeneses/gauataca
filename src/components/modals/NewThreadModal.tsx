/**
 * "Nueva idea" modal: opens a thread in the forum. Title + body composer (with
 * @-mentions), a structured song/event reference picker and photo attach. Photos
 * are compressed + uploaded on save, then attached to the new idea.
 */
import { useMemo, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { useGuataca } from '@/store';
import { Field, Input, Modal } from '@/components/ui';
import { FormBody, FormFooter, FormHeader } from './FormModals';
import { Composer } from './Composer';
import { RefPicker, type PickedRef } from './RefPicker';

export function NewThreadModal() {
  const { t, form, setForm, closeModal, saveThread } = useGuataca();
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!picked.length) return;
    setFiles((cur) => [...cur, ...picked]);
  };

  const setRefs = (refs: PickedRef[]) => setForm('threadRefs', refs);
  const canSave = (form.threadTitle || '').trim() !== '' || (form.threadBody || '').trim() !== '';

  return (
    <Modal onClose={closeModal} maxWidth={560}>
      <FormHeader title={t.newThread} onClose={closeModal} />
      <FormBody>
        <Field label={t.ideaTitle}>
          <Input
            value={form.threadTitle}
            onChange={(e) => setForm('threadTitle', e.target.value)}
            placeholder="Tocar en la feria…"
            autoFocus
          />
        </Field>
        <Field as="div" label={t.ideaBody} labelClassName="mb-[8px]">
          <Composer
            value={form.threadBody}
            onChange={(v) => setForm('threadBody', v)}
            onSend={() => {
              if (canSave) {
                saveThread(files);
                setFiles([]);
              }
            }}
            sendLabel={t.save}
            placeholder={t.mentionHint}
            rows={3}
          />
        </Field>
        <RefPicker selected={form.threadRefs || []} onChange={setRefs} />

        {/* photo attach */}
        <div>
          <div className="font-display font-semibold text-[10.5px] leading-[normal] tracking-[.11em] uppercase text-ink-muted mb-[9px]">{t.addPhotos}</div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onPick} />
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {previews.map((url, i) => (
                <div key={i} className="relative aspect-[4/3] rounded-[9px] overflow-hidden border border-line-soft bg-raised">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setFiles((cur) => cur.filter((_, n) => n !== i));
                    }}
                    aria-label={t.removeRef}
                    className="absolute top-1 right-1 grid place-items-center w-[22px] h-[22px] rounded-full bg-black/55 text-white cursor-pointer p-0 border-none hover:bg-black/75"
                  >
                    <X size={13} strokeWidth={2.4} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-[6px] py-[8px] px-[12px] rounded-[9px] border border-emerald/40 bg-[var(--color-tint-emerald)] text-emerald-light font-sans font-semibold text-[12.5px] leading-[normal] cursor-pointer hover:bg-[var(--color-tint-emerald)]"
          >
            <ImagePlus size={14} strokeWidth={2} />
            {t.attachPhoto}
          </button>
        </div>
      </FormBody>
      <FormFooter
        cancel={t.cancel}
        save={t.save}
        onCancel={closeModal}
        onSave={() => {
          if (canSave) {
            saveThread(files);
            setFiles([]);
          }
        }}
      />
    </Modal>
  );
}
