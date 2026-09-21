/**
 * "Nueva idea" modal: opens a thread in the forum. Title + body composer (with
 * @-mentions), a structured song/event reference picker and photo attach. Photos
 * are compressed + uploaded on save, then attached to the new idea.
 */
import { useMemo, useRef, useState } from 'react';
import { BarChart3, ImagePlus, Plus, X } from 'lucide-react';
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

  // Optional poll, built at save time if the composer is on and complete.
  const [pollOn, setPollOn] = useState(false);
  const [pollQ, setPollQ] = useState('');
  const [pollOpts, setPollOpts] = useState<string[]>(['', '']);
  const poll = pollOn ? { question: pollQ, options: pollOpts } : null;

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
                saveThread(files, poll);
                setFiles([]);
              }
            }}
            sendLabel={t.save}
            placeholder={t.mentionHint}
            rows={3}
          />
        </Field>
        <RefPicker selected={form.threadRefs || []} onChange={setRefs} />

        {/* optional poll */}
        <div>
          <button
            type="button"
            onClick={() => setPollOn((v) => !v)}
            className="inline-flex items-center gap-[6px] py-[8px] px-[12px] rounded-[9px] border border-violet/40 bg-[var(--color-tint-violet)] text-violet-lighter font-sans font-semibold text-[12.5px] leading-[normal] cursor-pointer hover:bg-[var(--color-tint-violet)]"
          >
            <BarChart3 size={14} strokeWidth={2} />
            {t.addPoll}
          </button>
          {pollOn && (
            <div className="mt-[9px] flex flex-col gap-[8px] p-[12px] rounded-[12px] border border-line-soft bg-raised">
              <Field label={t.pollQuestion}>
                <Input value={pollQ} onChange={(e) => setPollQ(e.target.value)} placeholder={t.pollQuestionPh} />
              </Field>
              {pollOpts.map((o, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={o}
                    onChange={(e) => setPollOpts((cur) => cur.map((x, n) => (n === i ? e.target.value : x)))}
                    placeholder={t.pollOptionPh.replace('%d', String(i + 1))}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setPollOpts((cur) => (cur.length > 2 ? cur.filter((_, n) => n !== i) : cur))}
                    title={t.removeRef}
                    aria-label={t.removeRef}
                    disabled={pollOpts.length <= 2}
                    className="grid place-items-center flex-none w-[30px] h-[38px] rounded-[9px] border border-line bg-surface text-ink-muted hover:text-ink-body hover:border-rose/40 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    <X size={14} strokeWidth={2.2} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setPollOpts((cur) => [...cur, ''])}
                className="self-start inline-flex items-center gap-[6px] py-[7px] px-[11px] rounded-[9px] border border-emerald/40 bg-[var(--color-tint-emerald)] text-emerald-light font-sans font-semibold text-[12px] leading-[normal] cursor-pointer hover:bg-[var(--color-tint-emerald)]"
              >
                <Plus size={13} strokeWidth={2.2} />
                {t.addOption}
              </button>
            </div>
          )}
        </div>

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
            saveThread(files, poll);
            setFiles([]);
          }
        }}
      />
    </Modal>
  );
}
