/** New / edit song form (with its link editor). */
import { Plus, X } from 'lucide-react';
import { useGuataca } from '@/store';
import { Field, Input, Modal, Select } from '@/components/ui';
import { GENRES, GENRE_IDS } from '@/data';
import { InstrumentPicker } from './InstrumentPicker';
import type { GenreId, LinkKind } from '@/types';
import { useFormBind, FormHeader, FormBody, FormFooter, useValidated } from './FormFrame';
import { validateSong } from '../../lib/validate';

/* --------------------------------------------------------- song link editor */
function SongLinksEditor() {
  const { t, form, setForm } = useGuataca();
  const links = form.songLinks || [];
  const set = (next: { kind: LinkKind; label: string; url: string }[]) => setForm('songLinks', next);
  const update = (i: number, patch: Partial<{ kind: LinkKind; label: string; url: string }>) =>
    set(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const remove = (i: number) => set(links.filter((_, idx) => idx !== i));
  const add = () => set([...links, { kind: 'youtube', label: '', url: '' }]);

  return (
    <div>
      <div className="font-display font-semibold text-[10.5px] leading-[normal] tracking-[.11em] uppercase text-ink-muted mb-[9px]">{t.links}</div>
      <div className="flex flex-col gap-[8px]">
        {links.map((l, i) => (
          <div key={i} className="flex flex-col gap-[6px] p-[10px] rounded-[10px] border border-line-soft bg-surface">
            <div className="flex gap-2 items-center">
              <Select value={l.kind} onChange={(e) => update(i, { kind: e.target.value as LinkKind })} className="flex-1">
                <option value="youtube">{t.ytLink}</option>
                <option value="apple">{t.amLink}</option>
                <option value="spotify">{t.spLink}</option>
                <option value="metronome">{t.metroLink}</option>
                <option value="chart">{t.charts}</option>
              </Select>
              <button type="button" onClick={() => remove(i)} title={t.removeLink} aria-label={t.removeLink} className="grid place-items-center w-[28px] h-[28px] rounded-[8px] border border-line bg-raised text-ink-muted hover:text-ink-body hover:border-rose/40 cursor-pointer flex-none">
                <X size={13} strokeWidth={2.2} />
              </button>
            </div>
            <Input value={l.label} onChange={(e) => update(i, { label: e.target.value })} placeholder={t.linkLabel} />
            <Input mono value={l.url} onChange={(e) => update(i, { url: e.target.value })} placeholder="https://…" className="text-[13px]" />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-[9px] inline-flex items-center gap-[6px] py-[8px] px-[12px] rounded-[9px] border border-emerald/40 bg-[var(--color-tint-emerald)] text-emerald-light font-sans font-semibold text-[12.5px] leading-[normal] cursor-pointer hover:bg-[var(--color-tint-emerald)]"
      >
        <Plus size={14} strokeWidth={2.2} />
        {t.addLink}
      </button>
    </div>
  );
}

/* --------------------------------------------------------------- new song */
export function NewSongModal() {
  const { t, L, form, setForm, closeModal, saveSong, modal } = useGuataca();
  const bind = useFormBind();
  const editing = modal?.kind === 'newSong' && !!modal.id;
  const { err, save } = useValidated(validateSong(form), saveSong);
  return (
    <Modal onClose={closeModal} maxWidth={520}>
      <FormHeader title={editing ? t.editSong : t.newSong} onClose={closeModal} />
      <FormBody>
        <Field label={t.titleL} error={err('title', form.title)}>
          <Input aria-invalid={!!err('title', form.title) || undefined} {...bind('title')} placeholder="Fiesta en Elorza" />
        </Field>
        <Field label={t.genreL}>
          <Select value={form.genre} onChange={(e) => setForm('genre', e.target.value as GenreId)}>
            {GENRE_IDS.map((k) => (
              <option key={k} value={k}>
                {L(GENRES[k].label)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label={t.key}>
            <Input mono {...bind('key')} placeholder="Am" />
          </Field>
          <Field label={t.bpm} error={err('bpm', form.bpm)}>
            <Input mono inputMode="numeric" aria-invalid={!!err('bpm', form.bpm) || undefined} {...bind('bpm')} placeholder="196" />
          </Field>
          <Field label={t.dur} error={err('dur', form.dur)}>
            <Input mono aria-invalid={!!err('dur', form.dur) || undefined} {...bind('dur')} placeholder="3:45" />
          </Field>
        </div>
        <SongLinksEditor />
        <Field as="div" label={t.requiredInstruments}>
          <InstrumentPicker
            selected={(form.songInstruments || []).map((id) => ({ id }))}
            onChange={(next) => setForm('songInstruments', next.map((p) => p.id))}
            withLevel={false}
          />
        </Field>
      </FormBody>
      <FormFooter cancel={t.cancel} save={t.save} onCancel={closeModal} onSave={save} />
    </Modal>
  );
}
