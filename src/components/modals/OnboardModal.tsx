/**
 * Sign-up onboarding: the first thing a new member sees. Asks which instruments
 * they play (with proficiency) and their vocal role, then persists it and marks
 * the profile `onboarded`. "Skip" closes without saving.
 */
import { useState } from 'react';
import { useGuataca } from '@/store';
import { Button, Field, Modal } from '@/components/ui';
import { InstrumentPicker, VocalsPicker, type PickedInstrument } from './InstrumentPicker';
import type { VocalFlag } from '@/types';

export function OnboardModal() {
  const { t, closeModal, onboard, skipOnboard } = useGuataca();
  const [instruments, setInstruments] = useState<PickedInstrument[]>([]);
  const [vocals, setVocals] = useState<VocalFlag[]>([]);

  const finish = () => onboard(instruments.map((p) => ({ id: p.id, lv: p.lv ?? 'inter' })), vocals);

  return (
    <Modal onClose={closeModal} maxWidth={520}>
      <div className="p-[20px_22px] border-b border-line-soft">
        <h2 className="m-0 font-display font-semibold text-[17px] leading-[normal] text-ink-bright">{t.onboardingTitle}</h2>
        <p className="m-0 mt-[6px] font-sans font-normal text-[13px] leading-[1.5] text-ink-dim">{t.onboardingSub}</p>
      </div>
      <div className="p-[20px_22px] flex flex-col gap-[14px]">
        <Field as="div" label={t.instruments}>
          <InstrumentPicker selected={instruments} onChange={setInstruments} withLevel />
        </Field>
        <Field as="div" label={t.vocalsL}>
          <VocalsPicker selected={vocals} onChange={setVocals} />
        </Field>
      </div>
      <div className="p-[16px_22px] border-t border-line-soft flex gap-[10px] justify-end">
        <button type="button" onClick={skipOnboard} className="p-[11px_17px] rounded-[10px] border border-line bg-surface text-ink-body font-sans font-semibold text-[13px] leading-[normal] cursor-pointer">
          {t.skip}
        </button>
        <Button variant="primary" className="p-[11px_17px]" onClick={finish}>
          {t.finish}
        </Button>
      </div>
    </Modal>
  );
}
