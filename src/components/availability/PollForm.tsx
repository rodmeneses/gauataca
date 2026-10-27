/** Create or edit an availability poll: a title plus candidate slots (date + optional start/end hour). */
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useGuataca } from '@/store';
import { useData } from '@/lib/data';
import { Button, Card, DatePicker, Field, Input } from '@/components/ui';
import { badHours, normalizeSlots } from '@/lib/availability';
import type { AvailabilityPoll, AvailabilitySlotInput } from '@/types';

const EMPTY_SLOT: AvailabilitySlotInput = { date: '', start: null, end: null };

/** Create a poll, or edit `poll` (title and candidate slots) when given. */
export function PollForm({ poll, onDone }: { poll?: AvailabilityPoll; onDone: () => void }) {
  const { t, lang, toast } = useGuataca();
  const { createAvailabilityPoll, updateAvailabilityPoll } = useData();
  const [title, setTitle] = useState(poll?.title ?? '');
  const [rows, setRows] = useState<AvailabilitySlotInput[]>(poll?.slots.length ? poll.slots : [EMPTY_SLOT]);
  const [tried, setTried] = useState(false);

  const slots = normalizeSlots(rows);
  const hoursBad = rows.some(badHours);
  const patch = (i: number, p: Partial<AvailabilitySlotInput>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const submit = async () => {
    setTried(true);
    if (!title.trim() || slots.length === 0 || hoursBad) return;
    const input = { title: title.trim(), slots };
    if (poll) {
      await updateAvailabilityPoll(poll.id, input, poll.slots);
      toast(t.availSaved);
    } else {
      await createAvailabilityPoll(input);
      toast(t.availCreated);
    }
    onDone();
  };

  return (
    <Card className="p-4 flex flex-col gap-3">
      {poll && <h3 className="m-0 font-display font-semibold text-[15px] text-ink">{t.availEdit}</h3>}
      <Field label={t.titleL} error={tried && !title.trim() ? t.errTitle : undefined}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder={t.availTitlePh} autoFocus />
      </Field>
      <Field as="div" label={t.availDates} error={tried && slots.length === 0 ? t.availNeedDates : tried && hoursBad ? t.availBadHours : undefined}>
        <div className="flex flex-col gap-2">
          <p className="m-0 text-[12px] text-ink-dim leading-[1.5]">{t.availHoursHint}</p>
          {rows.map((r, i) => (
            <div key={i} className="flex flex-col gap-2 p-2 rounded-[11px] border border-line-soft bg-raised">
              <div className="flex gap-2 items-center">
                <div className="flex-1 min-w-0">
                  <DatePicker value={r.date} onChange={(v) => patch(i, { date: v })} lang={lang} placeholder={t.pickDate} />
                </div>
                {rows.length > 1 && (
                  <button
                    type="button"
                    aria-label={t.removeDate}
                    onClick={() => setRows(rows.filter((_, j) => j !== i))}
                    className="grid place-items-center w-[44px] h-[44px] rounded-[10px] border border-line bg-surface text-ink-muted cursor-pointer flex-none"
                  >
                    <X size={15} strokeWidth={2.2} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 min-w-0">
                  <span className="text-[11px] font-semibold text-ink-meta">{t.availStart}</span>
                  <Input mono type="time" value={r.start ?? ''} onChange={(e) => patch(i, e.target.value ? { start: e.target.value } : { start: null, end: null })} aria-invalid={(tried && badHours(r)) || undefined} />
                </label>
                <label className="flex flex-col gap-1 min-w-0">
                  <span className="text-[11px] font-semibold text-ink-meta">{t.availEnd}</span>
                  <Input mono type="time" value={r.end ?? ''} disabled={!r.start} onChange={(e) => patch(i, { end: e.target.value || null })} aria-invalid={(tried && badHours(r)) || undefined} />
                </label>
              </div>
            </div>
          ))}
          <button
            type="button"
            // The new row starts on the last row's date, so offering the same day at another time is one tap.
            onClick={() => setRows([...rows, { ...EMPTY_SLOT, date: rows[rows.length - 1]?.date ?? '' }])}
            className="self-start inline-flex items-center gap-[6px] min-h-[40px] px-3 rounded-[9px] border border-line bg-raised text-ink-body font-sans font-semibold text-[12.5px] cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.2} />
            {t.addDate}
          </button>
        </div>
      </Field>
      {poll && poll.votes.length > 0 && <p className="m-0 text-[12px] text-amber leading-[1.5]">{t.availEditWarn}</p>}
      <div className="flex gap-2 justify-end">
        <Button variant="surface" onClick={onDone}>{t.cancel}</Button>
        <Button variant="primary" onClick={submit}>{t.save}</Button>
      </div>
    </Card>
  );
}
