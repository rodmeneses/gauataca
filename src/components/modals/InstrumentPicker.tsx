/**
 * Instrument + vocals pickers shared by the member form, sign-up onboarding and
 * the song form. The instrument picker shows the catalog (basic + custom) and
 * lets the user create a new instrument inline; `withLevel` adds a proficiency
 * selector per pick (members) vs. a plain tag list (songs).
 */
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { useGuataca } from '@/store';
import type { Proficiency, VocalFlag } from '@/types';

export interface PickedInstrument {
  id: string;
  lv?: Proficiency;
}

export function InstrumentPicker({ selected, onChange, withLevel }: {
  selected: PickedInstrument[];
  onChange: (next: PickedInstrument[]) => void;
  withLevel: boolean;
}) {
  const { t, L, instruments, createInstrument } = useGuataca();
  const [draft, setDraft] = useState('');

  const nameOf = (id: string) => {
    const inst = instruments.find((i) => i.id === id);
    return inst ? L(inst.name) : id;
  };

  const selectedIds = new Set(selected.map((s) => s.id));
  const available = instruments.filter((i) => !selectedIds.has(i.id));

  const add = (id: string) => onChange([...selected, withLevel ? { id, lv: 'inter' } : { id }]);
  const remove = (id: string) => onChange(selected.filter((s) => s.id !== id));
  const setLevel = (id: string, lv: Proficiency) => onChange(selected.map((s) => (s.id === id ? { ...s, lv } : s)));

  const create = async () => {
    const name = draft.trim();
    if (!name) return;
    const id = await createInstrument(name);
    setDraft('');
    add(id);
  };

  return (
    <div className="flex flex-col gap-[10px]">
      {selected.length > 0 && (
        <div className="flex flex-col gap-[6px]">
          {selected.map((s) => (
            <div key={s.id} className="flex items-center gap-[10px] py-[8px] px-[12px] rounded-[10px] bg-[#0f172a] border border-[#172033]">
              <span className="flex-1 min-w-0 font-sans font-semibold text-[13px] text-[#e2e8f0]">{nameOf(s.id)}</span>
              {withLevel && (
                <Select value={s.lv ?? 'inter'} onChange={(e) => setLevel(s.id, e.target.value as Proficiency)} className="w-auto py-[5px] px-[8px] text-[12px]">
                  <option value="beg">{t.beg}</option>
                  <option value="inter">{t.inter}</option>
                  <option value="expert">{t.expert}</option>
                </Select>
              )}
              <button type="button" onClick={() => remove(s.id)} aria-label={t.removeSong} className="grid place-items-center w-[24px] h-[24px] rounded-[7px] border border-[#1e293b] bg-[#0b1220] text-[#64748b] hover:text-[#cbd5e1] cursor-pointer flex-none">
                <X size={13} strokeWidth={2.2} />
              </button>
            </div>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div className="flex flex-wrap gap-[6px]">
          {available.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => add(i.id)}
              className="inline-flex items-center gap-[6px] py-[6px] px-[11px] rounded-[9px] border border-[#1e293b] bg-[#0b1220] text-[#cbd5e1] font-sans font-medium text-[12.5px] cursor-pointer hover:border-[#34d39955]"
            >
              <Plus size={13} strokeWidth={2.2} style={{ color: '#34d399' }} />
              {nameOf(i.id)}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} placeholder={t.newInstrument} className="flex-1 text-[13px]" />
        <Button variant="surface" className="py-[9px] px-[12px]" onClick={create}>
          {t.addInstrument}
        </Button>
      </div>
    </div>
  );
}

export function VocalsPicker({ selected, onChange }: { selected: VocalFlag[]; onChange: (next: VocalFlag[]) => void }) {
  const { t } = useGuataca();
  const toggle = (flag: VocalFlag) => {
    if (flag === 'none') {
      onChange(selected.includes('none') ? [] : ['none']);
      return;
    }
    const next = selected.includes(flag) ? selected.filter((v) => v !== flag) : [...selected.filter((v) => v !== 'none'), flag];
    onChange(next);
  };
  const flags: VocalFlag[] = ['lead', 'chorus', 'none'];
  const labels: Record<VocalFlag, string> = { lead: t.lead, chorus: t.chorus, none: t.none };
  return (
    <div className="flex flex-wrap gap-[6px]">
      {flags.map((f) => {
        const active = selected.includes(f);
        return (
          <button
            key={f}
            type="button"
            onClick={() => toggle(f)}
            className={`py-[6px] px-[12px] rounded-[9px] border font-sans font-semibold text-[12.5px] cursor-pointer ${
              active ? 'border-[#34d39955] bg-[#34d3991c] text-[#6ee7b7]' : 'border-[#1e293b] bg-[#0b1220] text-[#64748b] hover:text-[#cbd5e1]'
            }`}
          >
            {labels[f]}
          </button>
        );
      })}
    </div>
  );
}
