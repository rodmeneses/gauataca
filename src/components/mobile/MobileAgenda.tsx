/** Mobile "Agenda" tab: upcoming events with Instagram prep + details actions. */
import { Instagram } from 'lucide-react';
import { useBandSync } from '../../store';

export function MobileAgenda() {
  const { t, upcoming, openShare, openEvent } = useBandSync();
  return (
    <div className="flex flex-col gap-3">
      <div className="font-display font-semibold text-[10.5px] tracking-[.12em] uppercase text-[#64748b]">{t.upcoming}</div>
      {upcoming.map((e) => (
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
            {e.dateStr} · {e.timeStr}
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
