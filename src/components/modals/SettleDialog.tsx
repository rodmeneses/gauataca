/**
 * Settle event dialog: confirm whether the event happened and record the real
 * income/cost before the ledger transactions are created. Modeled on
 * CustodyDialog — the scrim does not close on click.
 */
import { useState } from 'react';
import { useBandSync } from '@/store';
import { Button, Field, Input } from '@/components/ui';

export function SettleDialog() {
  const { t, settle, settleEvent, closeSettle } = useBandSync();
  const [happened, setHappened] = useState(true);
  const [fee, setFee] = useState(() => (settle ? String(settle.fee || '') : ''));
  const [cost, setCost] = useState(() => (settle ? String(settle.cost || '') : ''));
  if (!settle) return null;

  const toggle = (on: boolean) => setHappened(on);

  return (
    <div className="fixed inset-0 z-[85] bg-[#020617cc] backdrop-blur-[6px] flex items-center justify-center p-[32px_20px] animate-fade-fast">
      <div role="dialog" aria-modal="true" className="w-full max-w-[420px] bg-raised border border-line rounded-[18px] p-[22px] animate-rise">
        <div className="font-display font-semibold text-[16px] leading-normal text-ink-bright mb-[7px]">{t.settleTitle}</div>
        <div className="text-[12.5px] text-ink-muted leading-[1.6] mb-[18px]">{settle.title}</div>

        <Field label={t.happened}>
          <div className="grid grid-cols-2 gap-[8px]">
            <button
              type="button"
              onClick={() => toggle(true)}
              aria-pressed={happened}
              className="p-[11px] rounded-[10px] border font-sans font-semibold text-[13px] leading-normal cursor-pointer"
              style={{ borderColor: happened ? '#34d39966' : '#1e293b', background: happened ? '#34d3991a' : '#0b1220', color: happened ? '#34d399' : '#94a3b8' }}
            >
              {t.happenedYes}
            </button>
            <button
              type="button"
              onClick={() => toggle(false)}
              aria-pressed={!happened}
              className="p-[11px] rounded-[10px] border font-sans font-semibold text-[13px] leading-normal cursor-pointer"
              style={{ borderColor: !happened ? '#f43f5e66' : '#1e293b', background: !happened ? '#f43f5e1a' : '#0b1220', color: !happened ? '#f43f5e' : '#94a3b8' }}
            >
              {t.happenedNo}
            </button>
          </div>
        </Field>

        {happened && (
          <Field label={`${t.fee} (USD)`}>
            <Input mono value={fee} onChange={(e) => setFee(e.target.value)} placeholder="600" />
          </Field>
        )}
        <Field label={`${t.costLabel} (USD)`}>
          <Input mono value={cost} onChange={(e) => setCost(e.target.value)} placeholder="50" />
        </Field>

        <div className="flex gap-[10px] justify-end mt-[18px]">
          <button
            type="button"
            onClick={closeSettle}
            className="p-[11px_17px] rounded-[10px] border border-line bg-surface text-ink-body font-sans font-semibold text-[13px] leading-normal cursor-pointer"
          >
            {t.cancel}
          </button>
          <Button variant="primary" className="p-[11px_17px]" onClick={() => settleEvent(settle.id, { happened, fee: +(fee || 0), cost: +(cost || 0) })}>
            {t.settle}
          </Button>
        </div>
      </div>
    </div>
  );
}
