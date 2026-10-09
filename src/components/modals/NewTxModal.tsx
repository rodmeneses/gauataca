/** New / edit fund movement form. */
import { useRef, useState } from 'react';
import { ExternalLink, Upload } from 'lucide-react';
import { useGuataca } from '@/store';
import { DatePicker, Field, Input, Modal, Select } from '@/components/ui';
import type { ProofKind, TxCategory, TxKind } from '@/types';
import { FormHeader, FormBody, FormFooter } from './FormFrame';

/* ---------------------------------------------------------- new movement */
export function NewTxModal() {
  const { t, lang, form, setForm, closeModal, saveTx, events, gear, members, uploadProof, toast, modal } = useGuataca();
  const editing = modal?.kind === 'newTx' && !!modal.id;
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
      <FormHeader title={editing ? t.editTx : t.newTx} onClose={closeModal} />
      <FormBody>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.type}>
            <Select value={form.kind} onChange={(e) => setForm('kind', e.target.value as TxKind)}>
              <option value="in">{t.income}</option>
              <option value="out">{t.expense}</option>
            </Select>
          </Field>
          <Field label={`${t.amount} (USD)`}>
            <Input mono value={form.amt} onChange={(e) => setForm('amt', e.target.value)} placeholder="450.00" />
          </Field>
        </div>
        {form.kind === 'in' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.category} className={form.category === 'DTV' ? 'col-span-2' : ''}>
              <Select
                value={form.category}
                onChange={(e) => {
                  const cat = e.target.value as TxCategory;
                  setForm('category', cat);
                  // DTV income is the org's, not a member's — clear any contributor.
                  if (cat === 'DTV') setForm('contributor', '');
                }}
              >
                <option value="fee">{t.fee}</option>
                <option value="tip">{t.tip}</option>
                <option value="donation">{t.donation}</option>
                <option value="contribution">{t.contribution}</option>
                <option value="DTV">{t.dtv}</option>
              </Select>
            </Field>
            {form.category !== 'DTV' && (
              <Field label={t.contributor}>
                <Select value={form.contributor} onChange={(e) => setForm('contributor', e.target.value)}>
                  <option value="">{t.noLink}</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </Select>
              </Field>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.proofKind}>
            <Select value={form.proofKind} onChange={(e) => setForm('proofKind', e.target.value as ProofKind)}>
              <option value="zelle">{t.zelle}</option>
              <option value="invoice">{t.invoice}</option>
              <option value="photo">{t.photo}</option>
              <option value="receipt">{t.receipt}</option>
            </Select>
          </Field>
          <Field label={t.date}>
            <DatePicker value={form.date} onChange={(v) => setForm('date', v)} lang={lang} placeholder={t.pickDate} />
          </Field>
        </div>
        <Field label={t.desc}>
          <Input value={form.desc} onChange={(e) => setForm('desc', e.target.value)} placeholder="Honorarios — Festival Latino de Fruitvale" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.linkEvent}>
            <Select value={form.event} onChange={(e) => setForm('event', e.target.value)}>
              <option value="">{t.noLink}</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </Select>
          </Field>
          <Field label={t.linkGear}>
            <Select value={form.gear} onChange={(e) => setForm('gear', e.target.value)}>
              <option value="">{t.noLink}</option>
              {gear.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>
          </Field>
        </div>
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
      <FormFooter cancel={t.cancel} save={t.save} onCancel={closeModal} onSave={saveTx} />
    </Modal>
  );
}
