/** "Which date works?" polls — used by the desktop Calendar view and the mobile Agenda tab. */
import { Suspense, useEffect, useState } from 'react';
import { CalendarCheck, Check, HelpCircle, Link2, Lock, Pencil, Share2, Trash2, Unlock, X } from 'lucide-react';
import { useGuataca } from '@/store';
import { useData } from '@/lib/data';
import { AddButton, Badge, Button, Card, useConfirm } from '@/components/ui';
import { fmt } from '@/lib/format';
import { lazyNamed } from '@/lib/lazyNamed';
import { slotHours, tallyPoll, unansweredCount } from '@/lib/availability';
import type { AvailabilityAnswer, AvailabilityPoll } from '@/types';

// Admin-only, so it (and the date picker) stays out of the entry chunk.
const PollForm = lazyNamed(() => import('./PollForm'), 'PollForm');
const ICON_BTN = 'grid place-items-center w-[36px] h-[36px] rounded-[9px] border border-line bg-raised text-ink-muted cursor-pointer';

const ANSWER_COLOR: Record<AvailabilityAnswer, string> = {
  yes: 'var(--color-emerald)',
  maybe: 'var(--color-amber)',
  no: 'var(--color-rose)',
};
const ANSWER_ICON: Record<AvailabilityAnswer, typeof Check> = { yes: Check, maybe: HelpCircle, no: X };

function PollCard({ poll, highlight }: { poll: AvailabilityPoll; highlight: boolean }) {
  const { t, lang, isAdmin, me, members, startEventOn, toast, copyLink, canShare, shareLink } = useGuataca();
  const { setAvailability, setAvailabilityClosed, deleteAvailabilityPoll } = useData();
  const { confirm, dialog } = useConfirm();
  const [editing, setEditing] = useState(false);
  const tallies = tallyPoll(poll, members.map((m) => m.id), me.id);
  const nameOf = (id: string) => members.find((m) => m.id === id)?.short ?? '?';
  const unanswered = unansweredCount(poll, me.id);
  const canAnswer = !poll.closed;

  if (editing) return <Suspense fallback={null}><PollForm poll={poll} onDone={() => setEditing(false)} /></Suspense>;

  return (
    <Card as="article" className={`p-4 flex flex-col gap-3 transition-shadow ${poll.closed ? 'opacity-80' : ''} ${highlight ? 'ring-2 ring-emerald/60' : ''}`}>
      <div className="flex items-start gap-2 flex-wrap">
        <div className="min-w-[160px] flex-1">
          <h3 className="m-0 font-display font-semibold text-[15.5px] leading-[1.3] text-ink">{poll.title}</h3>
          <div className="flex gap-[6px] flex-wrap mt-2">
            {poll.closed && <Badge color="var(--color-ink-muted)">{t.availClosed}</Badge>}
            {canAnswer && unanswered > 0 && <Badge color="var(--color-amber)">{t.availUnanswered.replace('%d', String(unanswered))}</Badge>}
          </div>
        </div>
        <div className="flex gap-2 flex-none">
          {canShare && (
            <button type="button" title={t.shareLink} aria-label={t.shareLink} onClick={() => shareLink('availability', String(poll.id), poll.title)} className={ICON_BTN}>
              <Share2 size={15} strokeWidth={2} />
            </button>
          )}
          <button type="button" title={t.copyLink} aria-label={t.copyLink} onClick={() => copyLink('availability', String(poll.id))} className={ICON_BTN}>
            <Link2 size={15} strokeWidth={2} />
          </button>
          {isAdmin && (<>
            <button type="button" title={t.availEdit} aria-label={t.availEdit} onClick={() => setEditing(true)} className={ICON_BTN}>
              <Pencil size={15} strokeWidth={2} />
            </button>
            <button
              type="button"
              title={poll.closed ? t.availReopen : t.availClose}
              aria-label={poll.closed ? t.availReopen : t.availClose}
              onClick={() => setAvailabilityClosed(poll.id, !poll.closed)}
              className={ICON_BTN}
            >
              {poll.closed ? <Unlock size={15} strokeWidth={2} /> : <Lock size={15} strokeWidth={2} />}
            </button>
            <button
              type="button"
              title={t.delete}
              aria-label={t.delete}
              onClick={() => confirm({ message: t.confirmDeleteAvailability, onConfirm: async () => { await deleteAvailabilityPoll(poll.id); toast(t.availDeleted); } })}
              className={`${ICON_BTN} hover:text-rose`}
            >
              <Trash2 size={15} strokeWidth={2} />
            </button>
          </>)}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {tallies.map((d) => (
          <div key={d.slot.id} className={`rounded-[11px] border p-3 flex flex-col gap-2 ${d.best ? 'border-emerald/50 bg-[var(--color-tint-emerald)]' : 'border-line-soft bg-raised'}`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-semibold text-[13px] text-ink">
                {fmt(d.slot.date, lang, true)}
                {d.slot.start && <span className="text-ink-meta"> · {slotHours(d.slot, t.availFrom)}</span>}
              </span>
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
                      onClick={() => setAvailability(poll.id, d.slot.id, on ? null : a)}
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
              <Button variant="surface" className="self-start inline-flex items-center gap-[6px]" onClick={() => startEventOn(d.slot, poll.title)}>
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
  const { t, isAdmin, state, clearScrollToPoll } = useGuataca();
  const { availability } = useData();
  const [adding, setAdding] = useState(false);
  // After a link or search hit (goToAvailability), scroll the target poll into view and flash it.
  const [hlPoll, setHlPoll] = useState<number | null>(null);
  useEffect(() => {
    if (!state.scrollToPoll) return;
    const el = document.getElementById(`avail-${state.scrollToPoll}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHlPoll(state.scrollToPoll);
      window.setTimeout(() => setHlPoll(null), 2200);
    }
    clearScrollToPoll();
  }, [state.scrollToPoll, clearScrollToPoll]);

  return (
    <div className="flex flex-col gap-[14px] max-w-[900px] animate-fade">
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-[13px] text-ink-muted leading-[1.5]">{t.availabilityHint}</p>
        {isAdmin && !adding && <AddButton className="flex-none" onClick={() => setAdding(true)}>{t.newAvailability}</AddButton>}
      </div>
      {adding && <Suspense fallback={null}><PollForm onDone={() => setAdding(false)} /></Suspense>}
      {availability.map((p) => (
        <div key={p.id} id={`avail-${p.id}`} className="scroll-mt-4">
          <PollCard poll={p} highlight={hlPoll === p.id} />
        </div>
      ))}
      {availability.length === 0 && !adding && (
        <div className="flex flex-col items-center gap-2 py-12 px-5 text-center">
          <span className="font-sans font-semibold text-[13.5px] text-ink-muted">{t.noAvailability}</span>
          <span className="text-[12.5px] text-ink-dim">{t.noAvailabilityHint}</span>
        </div>
      )}
    </div>
  );
}
