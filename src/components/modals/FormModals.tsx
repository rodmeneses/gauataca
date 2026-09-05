/**
 * Creation forms: new event / new transaction / new song.
 * Three centered modals (design lines 1113–1265). Shell mounts each one only
 * while `modal.kind` matches, so they render unconditionally here.
 */
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ExternalLink, Plus, Search, Upload, X } from 'lucide-react';
import { useGuataca } from '@/store';
import { Button, DatePicker, Field, Input, Modal, Select, Textarea } from '@/components/ui';
import { GENRES, GENRE_IDS } from '@/data';
import { isDemo } from '@/lib/data';
import { InstrumentPicker } from './InstrumentPicker';
import type { EventType, GearCondition, GenreId, LinkKind, ProofKind, TxCategory, TxKind } from '@/types';

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
  const { t, lang, form, setForm, closeModal, saveEvent, songs } = useGuataca();
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

/* ---------------------------------------------------------- new movement */
export function NewTxModal() {
  const { t, lang, form, setForm, closeModal, saveTx, events, gear, members, uploadProof, toast } = useGuataca();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast(t.uploadFailed, 'err');
      return;
    }
    setUploading(true);
    const url = await uploadProof(file);
    setUploading(false);
    if (url) {
      setForm('proof', url);
      setForm('proofKind', file.type.startsWith('image/') ? 'photo' : 'invoice');
    }
  };

  const isImage = /\.(png|jpe?g|webp|gif|heic)(\?|$)/i.test(form.proof);

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
          <div className="flex gap-2">
            <Input
              mono
              value={form.proof}
              onChange={(e) => setForm('proof', e.target.value)}
              placeholder="https://drive.google.com/file/d/…"
              className="text-[13px] border-emerald/40 focus:border-emerald/40 flex-1"
            />
            {!isDemo && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex-none inline-flex items-center gap-[6px] py-[9px] px-[12px] rounded-[10px] border border-emerald/40 bg-[var(--color-tint-emerald)] text-emerald-light font-sans font-semibold text-[12.5px] leading-[normal] cursor-pointer hover:bg-[var(--color-tint-emerald)] disabled:opacity-50 disabled:cursor-wait"
              >
                <Upload size={14} strokeWidth={2} />
                {uploading ? t.uploading : t.upload}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onPick} />
          {isImage && (
            <img src={form.proof} alt="" className="mt-2 max-h-[120px] rounded-[8px] border border-line" />
          )}
          <span className="block text-[11.5px] text-ink-dim mt-2 leading-[1.5]">{t.proofHint}</span>
        </Field>
      </FormBody>
      <FormFooter cancel={t.cancel} save={t.save} onCancel={closeModal} onSave={saveTx} />
    </Modal>
  );
}

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
  const editing = modal?.kind === 'newSong' && !!modal.id;
  return (
    <Modal onClose={closeModal} maxWidth={520}>
      <FormHeader title={editing ? t.editSong : t.newSong} onClose={closeModal} />
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
        <SongLinksEditor />
        <Field as="div" label={t.requiredInstruments}>
          <InstrumentPicker
            selected={(form.songInstruments || []).map((id) => ({ id }))}
            onChange={(next) => setForm('songInstruments', next.map((p) => p.id))}
            withLevel={false}
          />
        </Field>
      </FormBody>
      <FormFooter cancel={t.cancel} save={t.save} onCancel={closeModal} onSave={saveSong} />
    </Modal>
  );
}

/* --------------------------------------------------------------- new gear */
export function NewGearModal() {
  const { t, lang, form, setForm, closeModal, saveGear, members, uploadProof, toast } = useGuataca();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast(t.uploadFailed, 'err');
      return;
    }
    setUploading(true);
    const url = await uploadProof(file);
    setUploading(false);
    if (url) {
      setForm('proof', url);
      setForm('proofKind', file.type.startsWith('image/') ? 'photo' : 'invoice');
    }
  };

  const isImage = /\.(png|jpe?g|webp|gif|heic)(\?|$)/i.test(form.proof);

  return (
    <Modal onClose={closeModal} maxWidth={520}>
      <FormHeader title={t.newGear} onClose={closeModal} />
      <FormBody>
        <Field label={t.titleL}>
          <Input value={form.name} onChange={(e) => setForm('name', e.target.value)} placeholder="Mezcladora Behringer Xenyx Q1202USB" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`${t.cost} (USD)`}>
            <Input mono value={form.cost} onChange={(e) => setForm('cost', e.target.value)} placeholder="305" />
          </Field>
          <Field label={t.date}>
            <DatePicker value={form.date} onChange={(v) => setForm('date', v)} lang={lang} placeholder={t.pickDate} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.custodian}>
            <Select value={form.custodian} onChange={(e) => setForm('custodian', e.target.value)}>
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
          <Select value={form.boughtBy} onChange={(e) => setForm('boughtBy', e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </Field>
        <Field label={t.notesL}>
          <Textarea
            value={form.note}
            onChange={(e) => setForm('note', e.target.value)}
            rows={2}
            placeholder="Funciona bien. Falta un XLR de repuesto."
            className="text-[13.5px]"
          />
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
          <div className="flex gap-2">
            <Input
              mono
              value={form.proof}
              onChange={(e) => setForm('proof', e.target.value)}
              placeholder="https://drive.google.com/file/d/…"
              className="text-[13px] border-emerald/40 focus:border-emerald/40 flex-1"
            />
            {!isDemo && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex-none inline-flex items-center gap-[6px] py-[9px] px-[12px] rounded-[10px] border border-emerald/40 bg-[var(--color-tint-emerald)] text-emerald-light font-sans font-semibold text-[12.5px] leading-[normal] cursor-pointer hover:bg-[var(--color-tint-emerald)] disabled:opacity-50 disabled:cursor-wait"
              >
                <Upload size={14} strokeWidth={2} />
                {uploading ? t.uploading : t.upload}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onPick} />
          {isImage && (
            <img src={form.proof} alt="" className="mt-2 max-h-[120px] rounded-[8px] border border-line" />
          )}
          <span className="block text-[11.5px] text-ink-dim mt-2 leading-[1.5]">{t.proofHint}</span>
        </Field>
      </FormBody>
      <FormFooter cancel={t.cancel} save={t.save} onCancel={closeModal} onSave={saveGear} />
    </Modal>
  );
}

