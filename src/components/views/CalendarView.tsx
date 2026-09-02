/**
 * Calendar view — Upcoming / History pills, "New event" (admin) or "Admins only" lock note
 * (member), and the grid of event cards. Mirrors design lines 253–339.
 */
import { Clock, Instagram, Lock, MapPin, Mic, Music, Plus, RefreshCcw } from 'lucide-react';
import { useBandSync } from '@/store';
import { Badge, Button, Card, Pill, Segment } from '@/components/ui';

export function CalendarView() {
  const { t, state, isAdmin, isMember, calList, setCalTab, openNewEvent, openEvent, openShare } = useBandSync();
  const tab = state.calTab;

  return (
    <div className="flex flex-col gap-[18px] animate-fade">
      {/* ---- toolbar: tabs + admin action / member note */}
      <div className="flex items-center gap-3">
        <Segment>
          <Pill active={tab === 'upcoming'} color="#34d399" onClick={() => setCalTab('upcoming')}>
            {t.upcoming}
          </Pill>
          <Pill active={tab === 'history'} color="#34d399" onClick={() => setCalTab('history')}>
            {t.history}
          </Pill>
        </Segment>
        {isAdmin && (
          <Button variant="primary" className="ml-auto py-[10px] px-[15px]" onClick={openNewEvent}>
            <Plus size={15} strokeWidth={2.2} />
            {t.newEvent}
          </Button>
        )}
        {isMember && (
          <span className="ml-auto text-[12px] text-ink-muted flex items-center gap-[7px]">
            <Lock size={14} strokeWidth={1.9} color="#64748b" />
            {t.adminOnly}
          </span>
        )}
      </div>

      {/* ---- event cards */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(370px,1fr))] gap-[14px]">
        {calList.map((e) => (
          <Card key={e.id} as="article" className="overflow-hidden flex flex-col">
            <div className="h-[3px] opacity-70" style={{ background: e.typeColor }} />
            <div className="p-[17px_18px] flex flex-col gap-[13px] flex-1">
              {/* date tile + title + badges */}
              <div className="flex gap-[14px] items-start">
                <div className="w-[52px] flex-none text-center bg-raised border border-line-soft rounded-[11px] py-2 px-0">
                  <div className="font-mono font-semibold text-[21px] leading-none text-ink">{e.dayNum}</div>
                  <div className="font-sans font-medium text-[10px] leading-none text-ink-muted uppercase tracking-[.08em] mt-[5px]">{e.monStr}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="m-0 font-display font-semibold text-[15.5px] leading-[1.3] text-ink">{e.title}</h3>
                  <div className="flex gap-[6px] flex-wrap mt-2">
                    <Badge color={e.typeColor}>{e.typeLabel}</Badge>
                    {e.showState && <Badge color={e.stateColor}>{e.stateLabel}</Badge>}
                    <Badge color="#64748b">{e.rel}</Badge>
                    {e.canRsvp && e.rsvpLabel && <Badge color={e.rsvpColor}>✓ {e.rsvpLabel}</Badge>}
                  </div>
                </div>
              </div>

              {/* venue / date / moved-from */}
              <div className="flex flex-col gap-[7px] text-[12.5px] text-ink-meta">
                <div className="flex items-center gap-2">
                  <MapPin size={14} strokeWidth={1.9} color="#64748b" className="flex-none" />
                  <span>{e.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} strokeWidth={1.9} color="#64748b" className="flex-none" />
                  <span className="whitespace-nowrap">{e.dateStr} · {e.timeStr}{e.hoursStr ? ' · ' + e.hoursStr : ''}</span>
                </div>
                {e.movedFrom && (
                  <div className="flex items-center gap-2 text-amber">
                    <RefreshCcw size={14} strokeWidth={1.9} className="flex-none" />
                    <span>{e.movedFrom}</span>
                  </div>
                )}
              </div>

              {/* setlist + money chips */}
              <div className="flex gap-2 mt-auto pt-[6px]">
                {e.hasSetlist && (
                  <span className="flex items-center gap-[6px] font-sans font-semibold text-[11px] text-ink-meta bg-raised border border-line-soft py-[5px] px-[9px] rounded-[8px]">
                    <Music size={12} strokeWidth={2} />
                    <span className="whitespace-nowrap">{e.setlistCount} · {e.runtime}</span>
                  </span>
                )}
                {e.feeStr && (
                  <span className="font-mono font-semibold text-[11px] bg-raised border border-line-soft py-[6px] px-[9px] rounded-[8px]" style={{ color: '#34d399' }}>
                    {t.fee} {e.feeStr}
                  </span>
                )}
                {e.costStr && (
                  <span className="font-mono font-semibold text-[11px] bg-raised border border-line-soft py-[6px] px-[9px] rounded-[8px]" style={{ color: '#f87171' }}>
                    {t.costLabel} {e.costStr}
                  </span>
                )}
              </div>

              {/* recordings ("takes") */}
              {e.hasTakes && (
                <div className="flex flex-col gap-[5px]">
                  <div className="font-display font-semibold text-[10px] tracking-[.12em] uppercase text-ink-dim">{t.recordings}</div>
                  {e.takes.map((tk) => (
                    <a
                      key={tk.id}
                      href={tk.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-[7px] font-sans font-medium text-[12px] text-ink-body no-underline hover:text-ink-bright"
                    >
                      <Mic size={12} strokeWidth={2} className="flex-none" style={{ color: '#6ee7b7' }} />
                      <span className="truncate">{tk.label} · {tk.songTitle}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* actions */}
              <div className="flex gap-2 border-t border-line-soft pt-[13px]">
                <button
                  type="button"
                  onClick={() => openEvent(e.id)}
                  className="flex-1 p-[9px] rounded-[9px] border border-line bg-raised text-ink-body font-sans font-semibold text-[12.5px] cursor-pointer hover:border-[#334155] hover:bg-hover"
                >
                  {t.viewDetails}
                </button>
                {e.isGig && (
                  <button
                    type="button"
                    onClick={() => openShare(e.id)}
                    className="flex items-center gap-[7px] py-[9px] px-3 rounded-[9px] border border-[#7c3aed4d] bg-[#7c3aed1a] text-violet-lighter font-sans font-semibold text-[12.5px] cursor-pointer hover:bg-[#7c3aed33]"
                  >
                    <Instagram size={14} strokeWidth={1.9} />
                    Instagram
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
