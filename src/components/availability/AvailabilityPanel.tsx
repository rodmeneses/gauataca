/** "Which date works?" polls — used by the desktop Calendar view and the mobile Agenda tab. */
import { useState } from 'react';
import { CalendarCheck, Check, HelpCircle, Lock, Plus, Trash2, Unlock, X } from 'lucide-react';
import { useGuataca } from '@/store';
import { useData } from '@/lib/data';
import { AddButton, Badge, Button, Card, DatePicker, Field, Input, useConfirm } from '@/components/ui';
import { fmt } from '@/lib/format';
import { tallyPoll, unansweredCount } from '@/lib/availability';
import type { AvailabilityAnswer, AvailabilityPoll } from '@/types';

const ANSWER_COLOR: Record<AvailabilityAnswer, string> = {
  yes: 'var(--color-emerald)',
  maybe: 'var(--color-amber)',
  no: 'var(--color-rose)',
};
const ANSWER_ICON: Record<AvailabilityAnswer, typeof Check> = { yes: Check, maybe: HelpCircle, no: X };

function NewPollForm({ onDone }: { onDone: () => void }) {
  const { t, lang, toast } = useGuataca();
  const { createAvailabilityPoll } = useData();
  const [title, setTitle] = useState('');
  const [dates, setDates] = useState<string[]>(['']);
  const [tried, setTried] = useState(false);

  const picked = [...new Set(dates.filter(Boolean))];
  const submit = async () => {
    setTried(true);
    if (!title.trim() || picked.length === 0) return;
    await createAvailabilityPoll({ title: title.trim(), dates: picked });
    toast(t.availCreated);
    onDone();
  };

  return (
    <Card className="p-4 flex flex-col gap-3">
      <Field label={t.titleL} error={tried && !title.trim() ? t.errTitle : undefined}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder={t.availTitlePh} autoFocus />
      </Field>
      <Field as="div" label={t.availDates} error={tried && picked.length === 0 ? t.availNeedDates : undefined}>
        <div className="flex flex-col gap-2">
          {dates.map((d, i) => (
            <div key={i} className="flex gap-2 items-center">
              <div className="flex-1 min-w-0">
                <DatePicker value={d} onChange={(v) => setDates(dates.map((x, j) => (j === i ? v : x)))} lang={lang} placeholder={t.pickDate} />
              </div>
              {dates.length > 1 && (
                <button
                  type="button"
                  aria-label={t.removeDate}
                  onClick={() => setDates(dates.filter((_, j) => j !== i))}
                  className="grid place-items-center w-[44px] h-[44px] rounded-[10px] border border-line bg-raised text-ink-muted cursor-pointer flex-none"
                >
                  <X size={15} strokeWidth={2.2} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setDates([...dates, ''])}
            className="self-start inline-flex items-center gap-[6px] min-h-[40px] px-3 rounded-[9px] border border-line bg-raised text-ink-body font-sans font-semibold text-[12.5px] cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.2} />
            {t.addDate}
          </button>
        </div>
      </Field>
      <div className="flex gap-2 justify-end">
        <Button variant="surface" onClick={onDone}>{t.cancel}</Button>
        <Button variant="primary" onClick={submit}>{t.save}</Button>
      </div>
    </Card>
  );
}

function PollCard({ poll }: { poll: AvailabilityPoll }) {
  const { t, lang, isAdmin, me, members, startEventOn, toast } = useGuataca();
  const { setAvailability, setAvailabilityClosed, deleteAvailabilityPoll } = useData();
  const { confirm, dialog } = useConfirm();
  const tallies = tallyPoll(poll, members.map((m) => m.id), me.id);
  const nameOf = (id: string) => members.find((m) => m.id === id)?.short ?? '?';
  const unanswered = unansweredCount(poll, me.id);
  const canAnswer = !poll.closed;

  return (
    <Card as="article" className={`p-4 flex flex-col gap-3 ${poll.closed ? 'opacity-80' : ''}`}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="m-0 font-display font-semibold text-[15.5px] leading-[1.3] text-ink">{poll.title}</h3>
          <div className="flex gap-[6px] flex-wrap mt-2">
            {poll.closed && <Badge color="var(--color-ink-muted)">{t.availClosed}</Badge>}
            {canAnswer && unanswered > 0 && <Badge color="var(--color-amber)">{t.availUnanswered.replace('%d', String(unanswered))}</Badge>}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-none">
            <button
              type="button"
              title={poll.closed ? t.availReopen : t.availClose}
              aria-label={poll.closed ? t.availReopen : t.availClose}
              onClick={() => setAvailabilityClosed(poll.id, !poll.closed)}
              className="grid place-items-center w-[36px] h-[36px] rounded-[9px] border border-line bg-raised text-ink-muted cursor-pointer"
            >
              {poll.closed ? <Unlock size={15} strokeWidth={2} /> : <Lock size={15} strokeWidth={2} />}
            </button>
            <button
              type="button"
              title={t.delete}
              aria-label={t.delete}
              onClick={() => confirm({ message: t.confirmDeleteAvailability, onConfirm: async () => { await deleteAvailabilityPoll(poll.id); toast(t.availDeleted); } })}
              className="grid place-items-center w-[36px] h-[36px] rounded-[9px] border border-line bg-raised text-ink-muted cursor-pointer hover:text-rose"
            >
              <Trash2 size={15} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {tallies.map((d) => (
          <div key={d.date} className={`rounded-[11px] border p-3 flex flex-col gap-2 ${d.best ? 'border-emerald/50 bg-[var(--color-tint-emerald)]' : 'border-line-soft bg-raised'}`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-semibold text-[13px] text-ink">{fmt(d.date, lang, true)}</span>
              {d.best && <Badge color="var(--color-emerald)">{t.availBest}</Badge>}
              <span className="ml-auto font-mono font-semibold text-[12px] text-ink-meta whitespace-nowrap">
                {d.yes.length} ✓ · {d.maybe.length} ? · {d.no.length} ✕
              </span>
            </div>
            {canAnswer && (
              <div className="flex gap-2" role="group" aria-label={t.availYourAnswer}>
                {(['yes', 'maybe', 'no'] as const).map((a) => {
                  const Icon = ANSWER_ICON[a];
                  const on = d.mine === a;
                  const label = a === 'yes' ? t.availYes : a === 'maybe' ? t.availMaybe : t.availNo;
                  return (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={on}
                      // Tapping your current answer again clears it.
                      onClick={() => setAvailability(poll.id, d.date, on ? null : a)}
                      className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-[6px] rounded-[10px] border font-sans font-semibold text-[13px] cursor-pointer"
                      style={on
                        ? { color: ANSWER_COLOR[a], borderColor: ANSWER_COLOR[a], background: 'color-mix(in srgb, ' + ANSWER_COLOR[a] + ' 14%, transparent)' }
                        : { color: 'var(--color-ink-meta)', borderColor: 'var(--color-line)', background: 'var(--color-surface)' }}
                    >
                      <Icon size={14} strokeWidth={2.4} />
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="text-[12px] text-ink-muted leading-[1.5]">
              {d.yes.length + d.maybe.length + d.no.length === 0 ? t.availNobody : (
                <>
                  {d.yes.length > 0 && <span style={{ color: ANSWER_COLOR.yes }}>✓ {d.yes.map(nameOf).join(', ')} </span>}
                  {d.maybe.length > 0 && <span style={{ color: ANSWER_COLOR.maybe }}>? {d.maybe.map(nameOf).join(', ')} </span>}
                  {d.no.length > 0 && <span style={{ color: ANSWER_COLOR.no }}>✕ {d.no.map(nameOf).join(', ')} </span>}
                </>
              )}
              {d.pending.length > 0 && <span className="block text-ink-dim">{t.availPending}: {d.pending.map(nameOf).join(', ')}</span>}
            </div>
            {isAdmin && d.best && (
              <Button variant="surface" className="self-start inline-flex items-center gap-[6px]" onClick={() => startEventOn(d.date, poll.title)}>
                <CalendarCheck size={14} strokeWidth={2} />
                {t.availCreateEvent}
              </Button>
            )}
          </div>
        ))}
      </div>
      {dialog}
    </Card>
  );
}

export function AvailabilityPanel() {
  const { t, isAdmin } = useGuataca();
  const { availability } = useData();
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-[14px] max-w-[900px] animate-fade">
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-[13px] text-ink-muted leading-[1.5]">{t.availabilityHint}</p>
        {isAdmin && !adding && <AddButton className="flex-none" onClick={() => setAdding(true)}>{t.newAvailability}</AddButton>}
      </div>
      {adding && <NewPollForm onDone={() => setAdding(false)} />}
      {availability.map((p) => <PollCard key={p.id} poll={p} />)}
      {availability.length === 0 && !adding && (
        <div className="flex flex-col items-center gap-2 py-12 px-5 text-center">
          <span className="font-sans font-semibold text-[13.5px] text-ink-muted">{t.noAvailability}</span>
          <span className="text-[12.5px] text-ink-dim">{t.noAvailabilityHint}</span>
        </div>
      )}
    </div>
  );
}
