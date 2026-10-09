/** New / edit event form. */
import { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { useGuataca } from '@/store';
import { DatePicker, Field, Input, Modal, Select, Textarea } from '@/components/ui';
import type { EventType } from '@/types';
import { FormHeader, FormBody, FormFooter } from './FormFrame';

/* -------------------------------------------------------------- new event */
export function NewEventModal() {
  const { t, lang, form, setForm, closeModal, saveEvent, songs, modal } = useGuataca();
  const editing = modal?.kind === 'newEvent' && !!modal.id;
  const [query, setQuery] = useState('');

  const byId = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);
  const selected = (form.setlist || []).map((id) => byId.get(id)).filter((s): s is NonNullable<typeof s> => !!s);
  const q = query.trim().toLowerCase();
  const available = songs.filter(
    (s) => !(form.setlist || []).includes(s.id) && (!q || s.title.toLowerCase().includes(q) || s.key.toLowerCase() === q),
  );

  const add = (id: string) => setForm('setlist', [...(form.setlist || []), id]);
  const remove = (id: string) => setForm('setlist', (form.setlist || []).filter((x) => x !== id));

  return (
    <Modal onClose={closeModal} maxWidth={560}>
      <FormHeader title={editing ? t.editEvent : t.newEvent} onClose={closeModal} />
      <FormBody>
        <Field label={t.titleL}>
          <Input value={form.title} onChange={(e) => setForm('title', e.target.value)} placeholder="Festival Latino de Fruitvale" />
        </Field>
        <Field label={t.type}>
          <Select value={form.type} onChange={(e) => setForm('type', e.target.value as EventType)}>
            <option value="gig">{t.gig}</option>
            <option value="studio">{t.studio}</option>
            <option value="garage">{t.garage}</option>
          </Select>
        </Field>
        <div className="grid grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr] gap-3">
          <Field label={t.date} className="col-span-2 md:col-span-1">
            <DatePicker value={form.date} onChange={(v) => setForm('date', v)} lang={lang} placeholder={t.pickDate} />
          </Field>
          <Field label={t.hourL}>
            <Input mono type="time" value={form.time} onChange={(e) => setForm('time', e.target.value)} />
          </Field>
          <Field label={t.hoursL}>
            <Input mono type="number" min="0.5" step="0.5" value={form.hours} onChange={(e) => setForm('hours', e.target.value)} placeholder="2.5" />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-3">
          <Field label={t.venueL}>
            <Input value={form.venue} onChange={(e) => setForm('venue', e.target.value)} placeholder="Oakland, CA" />
          </Field>
          <Field label={`${t.fee} (USD)`}>
            <Input mono value={form.fee} onChange={(e) => setForm('fee', e.target.value)} placeholder="600" />
          </Field>
          <Field label={`${t.costLabel} (USD)`}>
            <Input mono value={form.cost} onChange={(e) => setForm('cost', e.target.value)} placeholder="50" />
          </Field>
        </div>
        <Field label={t.notesL}>
          <Textarea
            value={form.note}
            onChange={(e) => setForm('note', e.target.value)}
            rows={3}
            placeholder="Set de 45 min. Llegar 17:30 para prueba de sonido."
            className="text-[13.5px]"
          />
        </Field>

        {/* setlist picker */}
        <div>
          <div className="font-display font-semibold text-[10.5px] leading-[normal] tracking-[.11em] uppercase text-ink-muted mb-[9px]">{t.setlist}</div>
          {selected.length > 0 && (
            <div className="flex flex-col gap-[5px] mb-[9px]">
              {selected.map((s, i) => (
                <div key={s.id} className="flex items-center gap-[12px] py-[9px] px-[12px] rounded-[10px] bg-surface border border-line-soft">
                  <span className="font-mono font-semibold text-[12px] leading-[normal] text-ink-dim flex-none">{String(i + 1).padStart(2, '0')}</span>
                  <span className="w-[3px] h-[18px] rounded-[2px] flex-none" style={{ background: s.genreColor }} />
                  <span className="flex-1 min-w-0 font-sans font-semibold text-[13.5px] leading-[normal] text-ink-base">{s.title}</span>
                  <span className="font-mono font-medium text-[11px] leading-[normal] text-ink-muted flex-none">{s.key} · {s.dur}</span>
                  <button type="button" onClick={() => remove(s.id)} title={t.removeSong} aria-label={t.removeSong} className="grid place-items-center w-[24px] h-[24px] rounded-[7px] border border-line bg-raised text-ink-muted hover:text-ink-body hover:border-emerald/40 cursor-pointer flex-none">
                    <X size={13} strokeWidth={2.2} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="relative mb-[9px]">
            <Search size={15} strokeWidth={1.9} className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-ink-dim)' }} />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchSongs} className="pl-[36px]" />
          </div>
          <div className="max-h-[160px] overflow-y-auto flex flex-col gap-[4px]">
            {available.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => add(s.id)}
                className="flex items-center gap-[12px] py-[9px] px-[12px] rounded-[10px] border border-line bg-raised text-left cursor-pointer hover:border-emerald/40"
              >
                <span className="w-[3px] h-[18px] rounded-[2px] flex-none" style={{ background: s.genreColor }} />
                <span className="flex-1 min-w-0 font-sans font-medium text-[13px] leading-[normal] text-ink-body">{s.title}</span>
                <span className="font-mono font-medium text-[11px] leading-[normal] text-ink-muted flex-none">{s.key} · {s.dur}</span>
                <Plus size={15} strokeWidth={2.2} className="flex-none" style={{ color: 'var(--color-emerald)' }} />
              </button>
            ))}
            {available.length === 0 && (
              <p className="m-0 font-sans font-normal text-[12.5px] leading-[normal] text-ink-dim">{t.noResults}</p>
            )}
          </div>
        </div>
      </FormBody>
      <FormFooter cancel={t.cancel} save={t.save} onCancel={closeModal} onSave={saveEvent} />
    </Modal>
  );
}
