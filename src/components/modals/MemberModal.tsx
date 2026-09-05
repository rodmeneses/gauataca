/**
 * Member profile modal (design lines 1309–1354): brand avatar + name/role header,
 * instrument proficiency bars, vocals chips and the email / since footer. Admins
 * (or the member themselves) can switch to an edit mode to change instruments,
 * proficiency and vocals.
 */
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { useBandSync } from '@/store';
import { Avatar, Button, CloseButton, Field, Modal } from '@/components/ui';
import { InstrumentPicker, VocalsPicker, type PickedInstrument } from './InstrumentPicker';
import type { VocalFlag } from '@/types';

export function MemberModal() {
  const { mb, mbRaw, me, isAdmin, t, closeModal, saveMemberInstruments, state } = useBandSync();
  const [editing, setEditing] = useState(() => state.modal?.kind === 'member' && !!state.modal.edit);
  const [instruments, setInstruments] = useState<PickedInstrument[]>(() => (mbRaw?.instruments ?? []).map((i) => ({ id: i.id, lv: i.lv })));
  const [vocals, setVocals] = useState<VocalFlag[]>(() => mbRaw?.vocals ?? []);
  if (!mb || !mbRaw) return null;

  const canEdit = isAdmin || mbRaw.id === me.id;

  const startEdit = () => {
    setInstruments(mbRaw.instruments.map((i) => ({ id: i.id, lv: i.lv })));
    setVocals(mbRaw.vocals);
    setEditing(true);
  };
  const cancel = () => setEditing(false);
  const save = async () => {
    await saveMemberInstruments(mbRaw.id, instruments.map((p) => ({ id: p.id, lv: p.lv ?? 'inter' })), vocals);
    setEditing(false);
  };

  return (
    <Modal onClose={closeModal} maxWidth={480}>
      {/* header */}
      <div className="p-6 flex gap-4 items-center border-b border-line-soft">
        <Avatar initial={mb.initial} size={58} radius={17} tone="brand" style={{ fontSize: 19 }} />
        <div className="min-w-0 flex-1">
          <h2 className="m-0 font-display font-semibold text-[19px] leading-[1.25] text-ink-bright">{mb.name}</h2>
          <div className="text-[12.5px] text-ink-muted mt-[6px]">{mb.title} · {mb.roleLabel}</div>
        </div>
        {canEdit && !editing && (
          <button
            type="button"
            onClick={startEdit}
            title={t.editInstruments}
            aria-label={t.editInstruments}
            className="grid place-items-center w-[32px] h-[32px] rounded-[9px] border border-line bg-raised text-ink-meta hover:text-ink-body hover:border-ink-faint cursor-pointer flex-none"
          >
            <Pencil size={14} strokeWidth={2} />
          </button>
        )}
        <CloseButton onClick={closeModal} size={32} />
      </div>

      {editing ? (
        <>
          <div className="p-[22px_24px] flex flex-col gap-[14px]">
            <Field label={t.instruments}>
              <InstrumentPicker selected={instruments} onChange={setInstruments} withLevel />
            </Field>
            <Field label={t.vocalsL}>
              <VocalsPicker selected={vocals} onChange={setVocals} />
            </Field>
          </div>
          <div className="p-[16px_24px] border-t border-line-soft flex gap-[10px] justify-end">
            <button type="button" onClick={cancel} className="p-[11px_17px] rounded-[10px] border border-line bg-surface text-ink-body font-sans font-semibold text-[13px] leading-[normal] cursor-pointer">
              {t.cancel}
            </button>
            <Button variant="primary" className="p-[11px_17px]" onClick={save}>
              {t.save}
            </Button>
          </div>
        </>
      ) : (
        /* body */
        <div className="p-[22px_24px] flex flex-col gap-5">
          {/* instruments */}
          <div>
            <div className="font-display font-semibold text-[10.5px] tracking-[.11em] uppercase text-ink-muted mb-3">{t.instruments}</div>
            <div className="flex flex-col gap-3">
              {mb.instruments.map((i) => (
                <div key={i.name}>
                  <div className="flex justify-between items-baseline mb-[7px]">
                    <span className="font-sans font-medium text-[13.5px] text-ink-base">{i.name}</span>
                    <span className="font-mono font-semibold text-[11px] text-ink-meta">{i.level}</span>
                  </div>
                  <div className="h-[6px] rounded-[3px] bg-line-soft overflow-hidden">
                    <div style={{ height: 6, borderRadius: 3, background: i.color, width: i.pct }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* vocals */}
          <div>
            <div className="font-display font-semibold text-[10.5px] tracking-[.11em] uppercase text-ink-muted mb-[10px]">{t.vocalsL}</div>
            <div className="flex gap-2 flex-wrap">
              {mb.vocals.map((v) => (
                <span key={v.label} className="font-sans font-medium text-[12px] text-ink-meta bg-surface border border-line p-[6px_12px] rounded-[20px]">
                  {v.label}
                </span>
              ))}
            </div>
          </div>

          {/* footer rows */}
          <div className="flex flex-col gap-[9px] border-t border-line-soft pt-[18px] text-[12.5px] text-ink-muted">
            <div className="flex justify-between">
              <span>Email</span>
              <span className="text-ink-meta font-mono text-[12px]">{mb.email}</span>
            </div>
            <div className="flex justify-between">
              <span>{mb.since}</span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
