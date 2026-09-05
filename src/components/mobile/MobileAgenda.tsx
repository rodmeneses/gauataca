/** Mobile "Agenda" tab: upcoming/history toggle, "New event" (admin), and event cards. */
import { Instagram, Plus } from 'lucide-react';
import { useGuataca } from '../../store';
import { Pill, Segment } from '../ui';

export function MobileAgenda() {
  const { t, isAdmin, state, calList, setCalTab, openNewEvent, openShare, openEvent } = useGuataca();
  const tab = state.calTab;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Segment className="flex-1">
          <Pill active={tab === 'upcoming'} color="#34d399" className="flex-1" onClick={() => setCalTab('upcoming')}>
            {t.upcoming}
          </Pill>
          <Pill active={tab === 'history'} color="#34d399" className="flex-1" onClick={() => setCalTab('history')}>
            {t.history}
          </Pill>
        </Segment>
        {isAdmin && (
          <button
            type="button"
            onClick={openNewEvent}
            className="flex items-center gap-[6px] min-h-[34px] py-0 px-3 rounded-[10px] border-none text-white font-sans font-semibold text-[12.5px] cursor-pointer flex-none"
            style={{ background: 'linear-gradient(100deg,#8b5cf6,#d946ef)' }}
          >
            <Plus size={15} strokeWidth={2.2} />
            {t.newEvent}
          </button>
        )}
      </div>

      {calList.map((e) => (
        <article key={e.id} className="bg-[#0f172a] border border-[#1e293b] rounded-[15px] p-[15px] flex flex-col gap-3">
          <div className="flex gap-1.5 flex-wrap">
            <span
              className="font-display font-semibold text-[9px] tracking-[.09em] uppercase whitespace-nowrap py-[3px] px-[7px] rounded-[5px]"
              style={{ color: e.typeColor, background: e.typeBg }}
            >
              {e.typeLabel}
            </span>
            {e.showState && (
              <span
                className="font-display font-semibold text-[9px] tracking-[.09em] uppercase whitespace-nowrap py-[3px] px-[7px] rounded-[5px]"
                style={{ color: e.stateColor, background: e.stateBg }}
              >
                {e.stateLabel}
              </span>
            )}
            {e.canRsvp && e.rsvpLabel && (
              <span
                className="font-display font-semibold text-[9px] tracking-[.09em] uppercase whitespace-nowrap py-[3px] px-[7px] rounded-[5px]"
                style={{ color: e.rsvpColor, background: e.rsvpBg }}
              >
                ✓ {e.rsvpLabel}
              </span>
            )}
            <span className="ml-auto font-mono font-semibold text-[10.5px] text-[#a78bfa]">{e.rel}</span>
          </div>
          <h3 className="m-0 font-display font-semibold text-[17px] leading-[1.3] text-[#f1f5f9]">{e.title}</h3>
          <div className="text-[12.5px] text-[#64748b] leading-[1.6]">
            {e.dateStr} · {e.timeStr}{e.hoursStr ? ' · ' + e.hoursStr : ''}
            <br />
            {e.venue}
          </div>
          {e.isGig && (
            <button
              type="button"
              onClick={() => openShare(e.id)}
              className="flex items-center justify-center gap-[9px] w-full min-h-[48px] rounded-[13px] border-none text-white font-sans font-semibold text-[14px] cursor-pointer whitespace-nowrap"
              style={{ background: 'linear-gradient(100deg,#8b5cf6,#d946ef)' }}
            >
              <Instagram size={18} strokeWidth={2} />
              {t.prepIg}
            </button>
          )}
          <button
            type="button"
            onClick={() => openEvent(e.id)}
            className="w-full min-h-[44px] rounded-[12px] border border-[#1e293b] bg-[#0b1220] text-[#cbd5e1] font-sans font-semibold text-[13px] cursor-pointer"
          >
            {t.viewDetails}
          </button>
        </article>
      ))}
    </div>
  );
}
