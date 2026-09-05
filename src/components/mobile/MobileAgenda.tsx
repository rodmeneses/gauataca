/** Mobile "Agenda" tab: upcoming/history toggle, "New event" (admin), and event cards. */
import { Instagram, Plus } from 'lucide-react';
import { useGuataca } from '../../store';
import { Pill, Segment } from '../ui';

export function MobileAgenda() {
  const { t, isAdmin, state, calList, setCalTab, openNewEvent, openShare, openEvent } = useGuataca();
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
        <button
          type="button"
          onClick={openNewEvent}
          className="flex items-center justify-center gap-2 w-full min-h-[44px] px-3 rounded-xl border-none text-white font-sans font-semibold text-[14px] cursor-pointer"
          style={{ background: 'linear-gradient(100deg,var(--color-violet),var(--color-fuchsia))' }}
        >
          <Plus size={16} strokeWidth={2.2} />
          {t.newEvent}
        </button>
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
            <span className="ml-auto font-mono font-semibold text-[12px] text-violet-light">{e.rel}</span>
          </div>
          <h3 className="m-0 font-display font-semibold text-[17px] leading-snug text-ink">{e.title}</h3>
          <div className="text-[13px] text-ink-muted leading-relaxed">
            <div>{e.dateStr} · {e.timeStr}{e.hoursStr ? ' · ' + e.hoursStr : ''}</div>
            <div>{e.venue}</div>
          </div>
          {e.isGig && (
            <button
              type="button"
              onClick={() => openShare(e.id)}
              className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-xl border-none text-white font-sans font-semibold text-[14px] cursor-pointer whitespace-nowrap"
              style={{ background: 'linear-gradient(100deg,var(--color-violet),var(--color-fuchsia))' }}
            >
              <Instagram size={18} strokeWidth={2} />
              {t.prepIg}
            </button>
          )}
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
