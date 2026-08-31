/**
 * Creation forms: new event / new transaction / new song.
 * Three centered modals (design lines 1113–1265). Shell mounts each one only
 * while `modal.kind` matches, so they render unconditionally here.
 */
import type { ReactNode } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { useBandSync } from '@/store';
import { Button, Field, Input, Modal, Select, Textarea } from '@/components/ui';
import { GENRES, GENRE_IDS } from '@/data';
import type { EventType, GenreId, TxKind } from '@/types';

/* ------------------------------------------------------------ shared frame */
function FormHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="p-[20px_22px] border-b border-line-soft flex items-center gap-[14px]">
      <h2 className="m-0 flex-1 font-display font-semibold text-[17px] leading-[normal] text-ink-bright">{title}</h2>
      {/* Inline (not CloseButton): the design's 32px close in these modals has no hover state. */}
      <button type="button" onClick={onClose} aria-label="Close" className="grid place-items-center w-8 h-8 rounded-[9px] border border-line bg-surface text-ink-meta cursor-pointer">
        <X size={15} strokeWidth={2.2} />
      </button>
    </div>
  );
}

function FormBody({ children }: { children: ReactNode }) {
  return <div className="p-[20px_22px] flex flex-col gap-[14px]">{children}</div>;
}

function FormFooter({ cancel, save, onCancel, onSave }: { cancel: string; save: string; onCancel: () => void; onSave: () => void }) {
  return (
    <div className="p-[16px_22px] border-t border-line-soft flex gap-[10px] justify-end">
      {/* Inline (not Button surface): the design's cancel has no hover; `.btn-surface` adds one. */}
      <button type="button" onClick={onCancel} className="p-[11px_17px] rounded-[10px] border border-line bg-surface text-ink-body font-sans font-semibold text-[13px] leading-[normal] cursor-pointer">
        {cancel}
      </button>
      <Button variant="primary" className="p-[11px_17px]" onClick={onSave}>
        {save}
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------- new event */
export function NewEventModal() {
  const { t, form, setForm, closeModal, saveEvent } = useBandSync();
  return (
    <Modal onClose={closeModal} maxWidth={560}>
      <FormHeader title={t.newEvent} onClose={closeModal} />
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
            <Input mono type="date" value={form.date} onChange={(e) => setForm('date', e.target.value)} />
          </Field>
          <Field label={t.hourL}>
            <Input mono type="time" value={form.time} onChange={(e) => setForm('time', e.target.value)} />
          </Field>
          <Field label={t.hoursL}>
            <Input mono type="number" min="0.5" step="0.5" value={form.hours} onChange={(e) => setForm('hours', e.target.value)} placeholder="2.5" />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-3">
          <Field label={t.venueL}>
            <Input value={form.venue} onChange={(e) => setForm('venue', e.target.value)} placeholder="Oakland, CA" />
          </Field>
          <Field label={`${t.fee} (USD)`}>
            <Input mono value={form.money} onChange={(e) => setForm('money', e.target.value)} placeholder="600" />
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
      </FormBody>
      <FormFooter cancel={t.cancel} save={t.save} onCancel={closeModal} onSave={saveEvent} />
    </Modal>
  );
}

/* ---------------------------------------------------------- new movement */
export function NewTxModal() {
  const { t, form, setForm, closeModal, saveTx } = useBandSync();
  return (
    <Modal onClose={closeModal} maxWidth={520}>
      <FormHeader title={t.newTx} onClose={closeModal} />
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
        <Field label={t.desc}>
          <Input value={form.desc} onChange={(e) => setForm('desc', e.target.value)} placeholder="Cachet — Festival Latino de Fruitvale" />
        </Field>
        <Field label={t.date}>
          <Input mono type="date" value={form.date} onChange={(e) => setForm('date', e.target.value)} />
        </Field>
        <Field
          label={
            <>
              <ExternalLink size={12} strokeWidth={2.2} />
              {t.proof}
            </>
          }
          labelClassName="flex items-center gap-2 text-emerald-light"
        >
          <Input
            mono
            value={form.proof}
            onChange={(e) => setForm('proof', e.target.value)}
            placeholder="https://drive.google.com/file/d/…"
            className="text-[13px] border-[#34d39933] focus:border-[#34d39933]"
          />
          <span className="block text-[11.5px] text-ink-dim mt-2 leading-[1.5]">{t.proofHint}</span>
        </Field>
      </FormBody>
      <FormFooter cancel={t.cancel} save={t.save} onCancel={closeModal} onSave={saveTx} />
    </Modal>
  );
}

/* --------------------------------------------------------------- new song */
export function NewSongModal() {
  const { t, L, form, setForm, closeModal, saveSong } = useBandSync();
  return (
    <Modal onClose={closeModal} maxWidth={520}>
      <FormHeader title={t.newSong} onClose={closeModal} />
      <FormBody>
        <Field label={t.titleL}>
          <Input value={form.title} onChange={(e) => setForm('title', e.target.value)} placeholder="Fiesta en Elorza" />
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
            <Input mono value={form.key} onChange={(e) => setForm('key', e.target.value)} placeholder="Am" />
          </Field>
          <Field label={t.bpm}>
            <Input mono value={form.bpm} onChange={(e) => setForm('bpm', e.target.value)} placeholder="196" />
          </Field>
          <Field label={t.dur}>
            <Input mono value={form.dur} onChange={(e) => setForm('dur', e.target.value)} placeholder="3:45" />
          </Field>
        </div>
        <Field label={`${t.chart} (Google Doc)`}>
          <Input
            mono
            value={form.chart}
            onChange={(e) => setForm('chart', e.target.value)}
            placeholder="https://docs.google.com/document/d/…"
            className="text-[13px]"
          />
        </Field>
      </FormBody>
      <FormFooter cancel={t.cancel} save={t.save} onCancel={closeModal} onSave={saveSong} />
    </Modal>
  );
}
