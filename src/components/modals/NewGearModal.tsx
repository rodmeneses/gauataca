/** New gear form. */
import { useRef, useState } from 'react';
import { ExternalLink, Upload } from 'lucide-react';
import { useGuataca } from '@/store';
import { DatePicker, Field, Input, Modal, Select, Textarea } from '@/components/ui';
import type { GearCondition } from '@/types';
import { FormHeader, FormBody, FormFooter } from './FormFrame';

/* --------------------------------------------------------------- new gear */
export function NewGearModal() {
  const { t, lang, form, setForm, closeModal, saveGear, members, uploadProof, toast } = useGuataca();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
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
    <Modal onClose={closeModal} maxWidth={520}>
      <FormHeader title={t.newGear} onClose={closeModal} />
      <FormBody>
        <Field label={t.titleL}>
          <Input value={form.name} onChange={(e) => setForm('name', e.target.value)} placeholder="Mezcladora Behringer Xenyx Q1202USB" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`${t.cost} (USD)`}>
            <Input mono value={form.cost} onChange={(e) => setForm('cost', e.target.value)} placeholder="305" />
          </Field>
          <Field label={t.date}>
            <DatePicker value={form.date} onChange={(v) => setForm('date', v)} lang={lang} placeholder={t.pickDate} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.custodian}>
            <Select value={form.custodian} onChange={(e) => setForm('custodian', e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          </Field>
          <Field label={t.condition}>
            <Select value={form.cond} onChange={(e) => setForm('cond', e.target.value as GearCondition)}>
              <option value="good">{t.good}</option>
              <option value="attention">{t.attention}</option>
            </Select>
          </Field>
        </div>
        <Field label={t.boughtBy}>
          <Select value={form.boughtBy} onChange={(e) => setForm('boughtBy', e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </Field>
        <Field label={t.notesL}>
          <Textarea
            value={form.note}
            onChange={(e) => setForm('note', e.target.value)}
            rows={2}
            placeholder="Funciona bien. Falta un XLR de repuesto."
            className="text-[13.5px]"
          />
        </Field>
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
      </FormBody>
      <FormFooter cancel={t.cancel} save={t.save} onCancel={closeModal} onSave={saveGear} />
    </Modal>
  );
}
