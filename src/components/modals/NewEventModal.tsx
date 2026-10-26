/** New / edit event form. */
import { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { useGuataca } from '@/store';
import { DatePicker, Field, Input, Modal, Select, Textarea } from '@/components/ui';
import type { EventType } from '@/types';
import { useFormBind, FormHeader, FormBody, FormFooter, useValidated } from './FormFrame';
import { LIMITS, validateEvent } from '../../lib/validate';

/* --------------------------------------------------------- event link editor */
function EventLinksEditor({ err }: { err: (field: string, value: string | undefined) => string | undefined }) {
  const { t, form, setForm } = useGuataca();
  const links = form.eventLinks || [];
  const set = (next: { label: string; url: string }[]) => setForm('eventLinks', next);
  const update = (i: number, patch: Partial<{ label: string; url: string }>) =>
    set(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const remove = (i: number) => set(links.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="font-display font-semibold text-[10.5px] leading-[normal] tracking-[.11em] uppercase text-ink-muted mb-[9px]">{t.links}</div>
      <div className="flex flex-col gap-[8px]">
        {links.map((l, i) => (
          <div key={i} className="flex flex-col gap-[6px] p-[10px] rounded-[10px] border border-line-soft bg-surface">
            <div className="flex gap-2 items-center">
              <Input value={l.label} maxLength={LIMITS.label} onChange={(e) => update(i, { label: e.target.value })} placeholder={t.linkLabel} className="flex-1" />
              <button type="button" onClick={() => remove(i)} title={t.removeLink} aria-label={t.removeLink} className="grid place-items-center w-[28px] h-[28px] rounded-[8px] border border-line bg-raised text-ink-muted hover:text-ink-body hover:border-rose/40 cursor-pointer flex-none">
                <X size={13} strokeWidth={2.2} />
              </button>
            </div>
            <Input mono inputMode="url" autoCapitalize="none" autoCorrect="off" maxLength={LIMITS.url} aria-invalid={!!err(`link${i}`, l.url || l.label) || undefined} value={l.url} onChange={(e) => update(i, { url: e.target.value })} placeholder="https://…" className="text-[13px]" />
            {err(`link${i}`, l.url || l.label) && <p role="alert" className="m-0 text-[12px] leading-[1.4] text-red">{err(`link${i}`, l.url || l.label)}</p>}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => set([...links, { label: '', url: '' }])}
        className="mt-[9px] inline-flex items-center gap-[6px] py-[8px] px-[12px] rounded-[9px] border border-emerald/40 bg-[var(--color-tint-emerald)] text-emerald-light font-sans font-semibold text-[12.5px] leading-[normal] cursor-pointer hover:bg-[var(--color-tint-emerald)]"
      >
        <Plus size={14} strokeWidth={2.2} />
        {t.addLink}
      </button>
    </div>
  );
}

/* -------------------------------------------------------------- new event */
export function NewEventModal() {
  const { t, lang, form, setForm, closeModal, saveEvent, songs, modal } = useGuataca();
  const bind = useFormBind();
  const editing = modal?.kind === 'newEvent' && !!modal.id;
  const [query, setQuery] = useState('');
  const { err, save } = useValidated(validateEvent(form), saveEvent);

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
        <Field label={t.titleL} error={err('title', form.title)}>
          <Input maxLength={LIMITS.title} aria-invalid={!!err('title', form.title) || undefined} {...bind('title')} placeholder="Festival Latino de Fruitvale" />
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
          <Field label={t.hourL} error={err('time', form.time)}>
            <Input mono type="time" aria-invalid={!!err('time', form.time) || undefined} {...bind('time')} />
          </Field>
          <Field label={t.hoursL} error={err('hours', form.hours || form.mins)}>
            <div className="flex items-center gap-[6px]">
              <Input mono type="number" inputMode="numeric" min="0" step="1" aria-label={t.hoursUnit} aria-invalid={!!err('hours', form.hours || form.mins) || undefined} {...bind('hours')} placeholder="2" className="min-w-0" />
              <span className="font-mono text-[12px] text-ink-muted">h</span>
              <Input mono type="number" inputMode="numeric" min="0" max="59" step="5" aria-label={t.minsUnit} aria-invalid={!!err('hours', form.hours || form.mins) || undefined} {...bind('mins')} placeholder="30" className="min-w-0" />
              <span className="font-mono text-[12px] text-ink-muted">min</span>
            </div>
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-3">
          <Field label={t.venueL} error={err('venue', form.venue)}>
            <Input maxLength={LIMITS.title} {...bind('venue')} placeholder="Oakland, CA" />
          </Field>
          <Field label={`${t.fee} (USD)`} error={err('fee', form.fee)}>
            <Input mono inputMode="decimal" aria-invalid={!!err('fee', form.fee) || undefined} {...bind('fee')} placeholder="600" />
          </Field>
          <Field label={`${t.costLabel} (USD)`} error={err('cost', form.cost)}>
            <Input mono inputMode="decimal" aria-invalid={!!err('cost', form.cost) || undefined} {...bind('cost')} placeholder="50" />
          </Field>
        </div>
        <Field label={t.notesL} error={err('note', form.note)}>
          <Textarea
            maxLength={LIMITS.note}
            {...bind('note')}
            rows={3}
            placeholder="Set de 45 min. Llegar 17:30 para prueba de sonido."
            className="text-[13.5px]"
          />
        </Field>

        <EventLinksEditor err={err} />

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
            <Search size={15} strokeWidth={1.9} className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none text-ink-dim" />
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
                <Plus size={15} strokeWidth={2.2} className="flex-none text-emerald" />
              </button>
            ))}
            {available.length === 0 && (
              <p className="m-0 font-sans font-normal text-[12.5px] leading-[normal] text-ink-dim">{t.noResults}</p>
            )}
          </div>
        </div>
      </FormBody>
      <FormFooter cancel={t.cancel} save={t.save} onCancel={closeModal} onSave={save} />
    </Modal>
  );
}
