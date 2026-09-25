/** Mobile "Agenda" tab: upcoming/history toggle, "New event" (admin), and event cards. */
import { Pin } from 'lucide-react';
import { useGuataca } from '../../store';
import { AddButton, Pill, Segment } from '../ui';
import { PhotoStrip } from '../ui/PhotoStrip';

export function MobileAgenda() {
  const { t, isAdmin, state, calList, setCalTab, openNewEvent, openEvent, toggleEventPin } = useGuataca();
  const tab = state.calTab;

  return (
    <div className="flex flex-col gap-3">
      <Segment className="w-full" aria-label={t.calendar}>
        <Pill active={tab === 'upcoming'} color="var(--color-emerald)" size="md" className="flex-1" onClick={() => setCalTab('upcoming')}>
          {t.upcoming}
        </Pill>
        <Pill active={tab === 'history'} color="var(--color-emerald)" size="md" className="flex-1" onClick={() => setCalTab('history')}>
          {t.history}
        </Pill>
      </Segment>
      {isAdmin && (
        <AddButton block onClick={openNewEvent}>{t.newEvent}</AddButton>
      )}

      {calList.map((e) => (
        <article key={e.id} className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="font-display font-semibold text-[11px] tracking-[.05em] uppercase whitespace-nowrap py-1 px-2 rounded-md"
              style={{ color: e.typeColor, background: e.typeBg }}
            >
              {e.typeLabel}
            </span>
            {e.showState && (
              <span
                className="font-display font-semibold text-[11px] tracking-[.05em] uppercase whitespace-nowrap py-1 px-2 rounded-md"
                style={{ color: e.stateColor, background: e.stateBg }}
              >
                {e.stateLabel}
              </span>
            )}
            {e.canRsvp && e.rsvpLabel && (
              <span
                className="font-display font-semibold text-[11px] tracking-[.05em] uppercase whitespace-nowrap py-1 px-2 rounded-md"
                style={{ color: e.rsvpColor, background: e.rsvpBg }}
              >
                ✓ {e.rsvpLabel}
              </span>
            )}
            {e.pinned && (
              <span className="flex items-center gap-1 font-display font-semibold text-[11px] tracking-[.05em] uppercase whitespace-nowrap py-1 px-2 rounded-md" style={{ color: 'var(--color-amber)' }}>
                <Pin size={11} strokeWidth={2.2} fill="currentColor" />
                {t.pinned}
              </span>
            )}
            <span className="ml-auto font-mono font-semibold text-[12px] text-violet-light">{e.rel}</span>
            {isAdmin && (
              <button
                type="button"
                title={e.pinned ? t.unpin : t.pin}
                onClick={() => toggleEventPin(e.id)}
                className="flex-none grid place-items-center min-w-[36px] min-h-[36px] rounded-lg border border-line bg-raised cursor-pointer"
                style={{ color: e.pinned ? 'var(--color-amber)' : 'var(--color-ink-muted)' }}
              >
                <Pin size={14} strokeWidth={2} fill={e.pinned ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
          <h3 className="m-0 font-display font-semibold text-[17px] leading-snug text-ink">{e.title}</h3>
          <div className="text-[13px] text-ink-muted leading-relaxed">
            <div>{e.dateStr} · {e.timeStr}{e.hoursStr ? ' · ' + e.hoursStr : ''}</div>
            <div>{e.venue}</div>
          </div>
          <PhotoStrip photos={e.photos} />
          <button
            type="button"
            onClick={() => openEvent(e.id)}
            className="w-full min-h-[44px] rounded-xl border border-line bg-raised text-ink-body font-sans font-semibold text-[14px] cursor-pointer"
          >
            {t.viewDetails}
          </button>
        </article>
      ))}
    </div>
  );
}
