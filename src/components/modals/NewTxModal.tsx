/** New / edit fund movement form. */
import { useGuataca } from '@/store';
import { DatePicker, Field, Input, Modal, Select } from '@/components/ui';
import type { ProofKind, TxCategory, TxKind } from '@/types';
import { useFormBind, FormHeader, FormBody, FormFooter, ProofField, useValidated } from './FormFrame';
import { validateTx } from '../../lib/validate';

/* ---------------------------------------------------------- new movement */
export function NewTxModal() {
  const { t, lang, form, setForm, closeModal, saveTx, events, gear, members, modal } = useGuataca();
  const bind = useFormBind();
  const editing = modal?.kind === 'newTx' && !!modal.id;
  const { err, save } = useValidated(validateTx(form), saveTx);



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
          <Field label={`${t.amount} (USD)`} error={err('amt', form.amt)}>
            <Input mono inputMode="decimal" enterKeyHint="next" autoComplete="off" aria-invalid={!!err('amt', form.amt) || undefined} {...bind('amt')} placeholder="450.00" />
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
                <Select {...bind('contributor')}>
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
          <Input {...bind('desc')} placeholder="Honorarios — Festival Latino de Fruitvale" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.linkEvent}>
            <Select {...bind('event')}>
              <option value="">{t.noLink}</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </Select>
          </Field>
          <Field label={t.linkGear}>
            <Select {...bind('gear')}>
              <option value="">{t.noLink}</option>
              {gear.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>
          </Field>
        </div>
        <ProofField />
      </FormBody>
      <FormFooter cancel={t.cancel} save={t.save} onCancel={closeModal} onSave={save} />
    </Modal>
  );
}
