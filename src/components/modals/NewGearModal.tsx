/** New gear form. */
import { useGuataca } from '@/store';
import { DatePicker, Field, Input, Modal, Select, Textarea } from '@/components/ui';
import type { GearCondition } from '@/types';
import { useFormBind, FormHeader, FormBody, FormFooter, ProofField, useValidated } from './FormFrame';
import { LIMITS, validateGear } from '../../lib/validate';

/* --------------------------------------------------------------- new gear */
export function NewGearModal() {
  const { t, lang, form, setForm, closeModal, saveGear, members } = useGuataca();
  const bind = useFormBind();
  const { err, save } = useValidated(validateGear(form), saveGear);



  return (
    <Modal onClose={closeModal} maxWidth={520}>
      <FormHeader title={t.newGear} onClose={closeModal} />
      <FormBody>
        <Field label={t.titleL} error={err('name', form.name)}>
          <Input maxLength={LIMITS.title} aria-invalid={!!err('name', form.name) || undefined} {...bind('name')} placeholder="Mezcladora Behringer Xenyx Q1202USB" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`${t.cost} (USD)`} error={err('cost', form.cost)}>
            <Input mono inputMode="decimal" aria-invalid={!!err('cost', form.cost) || undefined} {...bind('cost')} placeholder="305" />
          </Field>
          <Field label={t.date}>
            <DatePicker value={form.date} onChange={(v) => setForm('date', v)} lang={lang} placeholder={t.pickDate} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.custodian}>
            <Select {...bind('custodian')}>
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
          <Select {...bind('boughtBy')}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </Field>
        <Field label={t.notesL} error={err('note', form.note)}>
          <Textarea
            maxLength={LIMITS.note}
            {...bind('note')}
            rows={2}
            placeholder="Funciona bien. Falta un XLR de repuesto."
            className="text-[13.5px]"
          />
        </Field>
        <ProofField />
      </FormBody>
      <FormFooter cancel={t.cancel} save={t.save} onCancel={closeModal} onSave={save} />
    </Modal>
  );
}
