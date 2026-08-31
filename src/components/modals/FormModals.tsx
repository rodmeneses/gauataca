/**
 * Creation forms: new event / new transaction / new song.
 * Three centered modals (design lines 1113–1265). Shell mounts each one only
 * while `modal.kind` matches, so they render unconditionally here.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { ExternalLink, Plus, Search, X } from 'lucide-react';
import { useBandSync } from '@/store';
import { Button, DatePicker, Field, Input, Modal, Select, Textarea } from '@/components/ui';
import { GENRES, GENRE_IDS } from '@/data';
import type { EventType, GenreId, ProofKind, TxCategory, TxKind } from '@/types';

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
  const { t, lang, form, setForm, closeModal, saveEvent, songs } = useBandSync();
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
            <DatePicker value={form.date} onChange={(v) => setForm('date', v)} lang={lang} placeholder={t.pickDate} />
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

        {/* setlist picker */}
        <div>
          <div className="font-display font-semibold text-[10.5px] leading-[normal] tracking-[.11em] uppercase text-[#64748b] mb-[9px]">{t.setlist}</div>
          {selected.length > 0 && (
            <div className="flex flex-col gap-[5px] mb-[9px]">
              {selected.map((s, i) => (
                <div key={s.id} className="flex items-center gap-[12px] py-[9px] px-[12px] rounded-[10px] bg-[#0f172a] border border-[#172033]">
                  <span className="font-mono font-semibold text-[12px] leading-[normal] text-[#475569] flex-none">{String(i + 1).padStart(2, '0')}</span>
                  <span className="w-[3px] h-[18px] rounded-[2px] flex-none" style={{ background: s.genreColor }} />
                  <span className="flex-1 min-w-0 font-sans font-semibold text-[13.5px] leading-[normal] text-[#e2e8f0]">{s.title}</span>
                  <span className="font-mono font-medium text-[11px] leading-[normal] text-[#64748b] flex-none">{s.key} · {s.dur}</span>
                  <button type="button" onClick={() => remove(s.id)} title={t.removeSong} aria-label={t.removeSong} className="grid place-items-center w-[24px] h-[24px] rounded-[7px] border border-[#1e293b] bg-[#0b1220] text-[#64748b] hover:text-[#cbd5e1] hover:border-[#34d39955] cursor-pointer flex-none">
                    <X size={13} strokeWidth={2.2} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="relative mb-[9px]">
            <Search size={15} strokeWidth={1.9} className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#475569' }} />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchSongs} className="pl-[36px]" />
          </div>
          <div className="max-h-[160px] overflow-y-auto flex flex-col gap-[4px]">
            {available.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => add(s.id)}
                className="flex items-center gap-[12px] py-[9px] px-[12px] rounded-[10px] border border-[#1e293b] bg-[#0b1220] text-left cursor-pointer hover:border-[#34d39955]"
              >
                <span className="w-[3px] h-[18px] rounded-[2px] flex-none" style={{ background: s.genreColor }} />
                <span className="flex-1 min-w-0 font-sans font-medium text-[13px] leading-[normal] text-[#cbd5e1]">{s.title}</span>
                <span className="font-mono font-medium text-[11px] leading-[normal] text-[#64748b] flex-none">{s.key} · {s.dur}</span>
                <Plus size={15} strokeWidth={2.2} className="flex-none" style={{ color: '#34d399' }} />
              </button>
            ))}
            {available.length === 0 && (
              <p className="m-0 font-sans font-normal text-[12.5px] leading-[normal] text-[#475569]">{t.noResults}</p>
            )}
          </div>
        </div>
      </FormBody>
      <FormFooter cancel={t.cancel} save={t.save} onCancel={closeModal} onSave={saveEvent} />
    </Modal>
  );
}

/* ---------------------------------------------------------- new movement */
export function NewTxModal() {
  const { t, lang, form, setForm, closeModal, saveTx, events, gear, members } = useBandSync();
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
        {form.kind === 'in' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.category}>
              <Select value={form.category} onChange={(e) => setForm('category', e.target.value as TxCategory)}>
                <option value="fee">{t.fee}</option>
                <option value="tip">{t.tip}</option>
                <option value="donation">{t.donation}</option>
                <option value="contribution">{t.contribution}</option>
              </Select>
            </Field>
            {form.category === 'contribution' && (
              <Field label={t.contributor}>
                <Select value={form.contributor} onChange={(e) => setForm('contributor', e.target.value)}>
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
          <Input value={form.desc} onChange={(e) => setForm('desc', e.target.value)} placeholder="Cachet — Festival Latino de Fruitvale" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.linkEvent}>
            <Select value={form.event} onChange={(e) => setForm('event', e.target.value)}>
              <option value="">{t.noLink}</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </Select>
          </Field>
          <Field label={t.linkGear}>
            <Select value={form.gear} onChange={(e) => setForm('gear', e.target.value)}>
              <option value="">{t.noLink}</option>
              {gear.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>
          </Field>
        </div>
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
