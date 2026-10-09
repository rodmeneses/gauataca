/** Attendance / RSVP block of the event modal. */
import { useState } from 'react';
import { Check } from 'lucide-react';
import { RSVP_COLOR, RSVP_ORDER, RSVP_PENDING_COLOR, rsvpLabel, useGuataca, type EventVm } from '@/store';
import { Avatar } from '@/components/ui';
import { tile, tileLabel } from './eventModalStyles';

export function EventRsvpSection({ ev }: { ev: EventVm }) {
  const { t, setRsvp } = useGuataca();
  const [expandedRsvp, setExpandedRsvp] = useState<string | null>(null);
  const rsvpGroups = [
    { key: 'going', label: t.going, color: RSVP_COLOR.going, people: ev.going },
    { key: 'maybe', label: t.maybe, color: RSVP_COLOR.maybe, people: ev.maybe },
    { key: 'no', label: t.notGoing, color: RSVP_COLOR.no, people: ev.notGoing },
    { key: 'pending', label: t.pendingL, color: RSVP_PENDING_COLOR, people: ev.pending },
  ];

  return (
    <>
    {ev.hasAttendance && (
      <div className="py-5 px-6 border-b border-line-soft">
        <div className="flex items-baseline gap-[11px] mb-[13px]">
          <h3 className="m-0 font-display font-semibold text-[13px] leading-[normal] tracking-[.02em] text-ink-body">{t.rsvp}</h3>
          <span className="font-mono font-medium text-[11.5px] leading-[normal] text-ink-muted whitespace-nowrap">
            {ev.goingCount} {t.confirmedL} · {ev.pendingCount} {t.pending}
          </span>
        </div>

        {ev.canRsvp && (
          <div className="flex items-center gap-[10px] flex-wrap mb-4">
            <span className="font-sans font-medium text-[12.5px] leading-[normal] text-ink-meta mr-1">{t.rsvpHint}</span>
            {RSVP_ORDER.map((s) => {
              const active = ev.rsvp === s;
              const color = RSVP_COLOR[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRsvp(ev.id, s)}
                  aria-pressed={active}
                  className="flex items-center gap-[8px] py-[11px] px-[18px] rounded-[11px] border font-sans font-semibold text-[16px] leading-[normal] cursor-pointer transition-colors"
                  style={{
                    borderColor: `color-mix(in srgb, ${color} ${active ? 60 : 34}%, transparent)`,
                    background: `color-mix(in srgb, ${color} ${active ? 16 : 8}%, transparent)`,
                    color,
                  }}
                >
                  {active && <Check size={17} strokeWidth={2.4} />}
                  {rsvpLabel(s, t)}
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {rsvpGroups.map((g) => {
            const expanded = expandedRsvp === g.key;
            return (
              <div
                key={g.key}
                className={`${tile} ${g.people.length > 0 ? 'cursor-pointer' : ''}`}
                onClick={() => g.people.length > 0 && setExpandedRsvp(expanded ? null : g.key)}
                role={g.people.length > 0 ? 'button' : undefined}
                aria-expanded={g.people.length > 0 ? expanded : undefined}
              >
                <div className={tileLabel} style={{ color: g.color }}>
                  {g.label} · {g.people.length}
                </div>
                {expanded ? (
                  <div className="flex flex-col gap-[4px] mt-[9px]">
                    {g.people.map((p) => (
                      <span key={p.id} className="font-sans text-[12.5px] leading-[normal] text-ink-body">
                        {p.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-[6px] flex-wrap mt-[9px] min-h-[26px]">
                    {g.people.length === 0 && <span className="font-mono text-[11.5px] leading-[26px] text-ink-faint">—</span>}
                    {g.people.map((p) => (
                      <span key={p.id} title={p.name} aria-label={p.name}>
                        <Avatar initial={p.initial} size={26} radius={8} tone={g.key === 'pending' ? 'muted' : 'violet'} style={{ background: g.key === 'pending' ? 'var(--color-line)' : `color-mix(in srgb, ${g.color} 15%, transparent)`, color: g.key === 'pending' ? 'var(--color-ink-muted)' : g.color }} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )}
    </>
  );
}
