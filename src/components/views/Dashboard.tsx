/**
 * Dashboard view — stat cards, upcoming events, stale songs and recent ledger movements.
 * Markup mirrors the design's `isDash` block (Guataca.dc.html lines 140–251).
 */
import { ExternalLink, Instagram, TriangleAlert } from 'lucide-react';
import { useGuataca } from '@/store';
import { Badge, Eyebrow } from '@/components/ui';

export function Dashboard() {
  const {
    t,
    balanceStr, incomeStr, expenseStr,
    nextEvent,
    statSongs, statStale, staleHint,
    dashUpcoming, staleSongs, recentTx, txCount,
    go, openEvent, openShare, toggleSong,
  } = useGuataca();

  const staleTop = staleSongs.slice(0, 5);

  return (
    <div className="flex flex-col gap-[22px] animate-fade">
      {/* ---- stat cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(196px,1fr))] gap-[14px]">
        <div className="card p-[17px_18px]">
          <Eyebrow>{t.poolBalance}</Eyebrow>
          <div className="font-mono font-semibold text-[clamp(19px,2.1vw,26px)] leading-none text-emerald mt-[11px] whitespace-nowrap tracking-[-.02em]">{balanceStr}</div>
          <div className="flex flex-wrap gap-[6px_14px] mt-[11px] text-[11.5px]">
            <span className="text-emerald whitespace-nowrap">↑ {incomeStr}</span>
            <span className="text-red whitespace-nowrap">↓ {expenseStr}</span>
          </div>
        </div>
        <div className="card p-[17px_18px]">
          <Eyebrow>{t.nextEvent}</Eyebrow>
          <div className="font-display font-semibold text-[16px] leading-[1.25] text-ink mt-[11px]">{nextEvent ? nextEvent.title : '—'}</div>
          <div className="text-[11.5px] text-violet-light mt-[8px]">{nextEvent ? <>{nextEvent.rel} · {nextEvent.dateStr}</> : null}</div>
          {nextEvent?.hasAttendance && (
            <div className="text-[11.5px] text-ink-muted mt-[6px] whitespace-nowrap">
              <span className="text-emerald">{nextEvent.goingCount}</span> {t.confirmedL} · {nextEvent.pendingCount} {t.pending}
            </div>
          )}
        </div>
        <div className="card p-[17px_18px]">
          <Eyebrow>{t.songsTotal}</Eyebrow>
          <div className="font-mono font-semibold text-[clamp(19px,2.1vw,26px)] leading-none text-ink mt-[11px] whitespace-nowrap">{statSongs}</div>
          <div className="text-[11.5px] text-ink-muted mt-[11px]">{t.genresHint}</div>
        </div>
        <div className="card border-[#fbbf2433] p-[17px_18px]">
          <Eyebrow className="text-amber">{t.staleSongs}</Eyebrow>
          <div className="font-mono font-semibold text-[clamp(19px,2.1vw,26px)] leading-none text-amber mt-[11px] whitespace-nowrap">{statStale}</div>
          <div className="text-[11.5px] text-ink-muted mt-[11px]">{staleHint}</div>
        </div>
      </div>

      {/* ---- upcoming + stale */}
      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-[18px]">
        <section className="card p-[18px]">
          <div className="flex items-center justify-between mb-[14px]">
            <h2 className="m-0 font-display font-semibold text-[13.5px] leading-none tracking-[.02em] text-ink-body">{t.upcoming}</h2>
            <button
              type="button"
              onClick={() => go('calendar')}
              className="border-none bg-transparent text-ink-muted font-sans font-medium text-[12px] cursor-pointer whitespace-nowrap hover:text-violet-light"
            >
              {t.calendar} →
            </button>
          </div>
          <div className="flex flex-col gap-[9px]">
            {dashUpcoming.map((e) => (
              <div
                key={e.id}
                onClick={() => openEvent(e.id)}
                className="flex gap-[14px] items-center p-[13px] rounded-[12px] border border-line-soft bg-raised cursor-pointer hover:border-ink-faint hover:bg-hover"
              >
                <div className="w-[46px] flex-none text-center">
                  <div className="font-mono font-semibold text-[20px] leading-none text-ink">{e.dayNum}</div>
                  <div className="font-sans font-medium text-[10px] leading-none text-ink-muted uppercase tracking-[.08em] mt-[4px]">{e.monStr}</div>
                </div>
                <div className="w-px h-[34px] bg-line flex-none" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col items-start gap-[7px]">
                    <span className="font-sans font-semibold text-[14px] text-ink-base">{e.title}</span>
                    <span className="flex gap-[7px] flex-wrap">
                      <Badge color={e.typeColor} style={{ background: e.typeBg }}>{e.typeLabel}</Badge>
                      {e.showState && (
                        <Badge color={e.stateColor} style={{ background: e.stateBg }}>{e.stateLabel}</Badge>
                      )}
                    </span>
                  </div>
                  <div className="text-[12px] text-ink-muted mt-[7px]">{e.timeStr}{e.hoursStr ? ' · ' + e.hoursStr : ''} · {e.venue} · {e.setlistCount} {t.setlist}</div>
                </div>
                {e.isGig && (
                  <button
                    type="button"
                    onClick={(ev) => { ev.stopPropagation(); openShare(e.id); }}
                    title={t.prepIg}
                    className="grid place-items-center w-[34px] h-[34px] rounded-[10px] border border-[#7c3aed4d] bg-[#7c3aed1a] text-violet-lighter cursor-pointer flex-none hover:bg-[#7c3aed33]"
                  >
                    <Instagram size={16} strokeWidth={1.9} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="card p-[18px]">
          <div className="flex items-center gap-[9px] mb-[14px]">
            <TriangleAlert size={16} strokeWidth={1.9} className="text-amber" />
            <h2 className="m-0 font-display font-semibold text-[13.5px] leading-none text-ink-body whitespace-nowrap">{t.staleSongs}</h2>
            <span className="ml-auto font-mono font-semibold text-[11px] text-amber bg-[#fbbf241c] p-[3px_8px] rounded-[20px]">{statStale}</span>
          </div>
          <div className="flex flex-col gap-[7px]">
            {staleTop.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSong(s.id)}
                className="flex items-center gap-[11px] w-full p-[11px_12px] rounded-[10px] border border-line-soft bg-raised cursor-pointer text-left hover:border-[#fbbf2444]"
              >
                <span className="w-[7px] h-[7px] rounded-full flex-none" style={{ background: s.staleColor }} />
                <span className="min-w-0 flex-1">
                  <span className="block font-sans font-semibold text-[13px] text-ink-base">{s.title}</span>
                  <span className="block text-[11px] text-ink-muted mt-[3px]">{s.genreLabel} · {s.key}</span>
                </span>
                <span className="font-mono font-semibold text-[10.5px] whitespace-nowrap" style={{ color: s.staleColor }}>{s.lastLabel}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => go('repertoire')}
            className="mt-[13px] w-full p-[10px] rounded-[10px] border border-line bg-transparent text-ink-meta font-sans font-semibold text-[12.5px] cursor-pointer hover:border-ink-faint hover:text-ink-base"
          >
            {t.repertoire} →
          </button>
        </section>
      </div>

      {/* ---- recent ledger movements */}
      <section className="card p-[18px]">
        <div className="flex items-center justify-between mb-[14px]">
          <h2 className="m-0 font-display font-semibold text-[13.5px] leading-none text-ink-body">{t.ledger}</h2>
          <button
            type="button"
            onClick={() => go('ledger')}
            className="border-none bg-transparent text-ink-muted font-sans font-medium text-[12px] cursor-pointer whitespace-nowrap hover:text-emerald"
          >
            {txCount} {t.movements} →
          </button>
        </div>
        <div className="flex flex-col gap-[2px]">
          {recentTx.map((x) => (
            <div key={x.id} className="flex items-center gap-[14px] p-[11px_12px] rounded-[10px] bg-raised border border-line-soft">
              <span
                className="w-[26px] h-[26px] rounded-[8px] grid place-items-center flex-none font-mono font-semibold text-[13px]"
                style={{ background: x.bg, color: x.color }}
              >
                {x.arrow}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-sans font-medium text-[13px] text-ink-base">{x.desc}</span>
                <span className="block text-[11px] text-ink-muted mt-[3px]">{x.dateStr} · {t.addedBy} {x.by}</span>
              </span>
              {x.hasProof && x.proof && (
                x.proofIsImage ? (
                  <a href={x.proof} target="_blank" rel="noreferrer" className="flex-none no-underline">
                    <img src={x.proof} alt={x.proofKind} className="h-[34px] w-[34px] object-cover rounded-[8px] border border-line hover:border-[#34d39955]" />
                  </a>
                ) : (
                  <a
                    href={x.proof}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-[6px] font-sans font-semibold text-[11px] text-ink-meta border border-line p-[5px_9px] rounded-[8px] no-underline whitespace-nowrap hover:border-[#34d39955] hover:text-emerald-light"
                  >
                    <ExternalLink size={12} strokeWidth={2.1} />
                    {x.proofKind}
                  </a>
                )
              )}
              <span className="font-mono font-semibold text-[14px] min-w-[92px] text-right" style={{ color: x.color }}>{x.amountStr}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
