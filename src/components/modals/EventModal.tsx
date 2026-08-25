/**
 * Event detail modal (design lines 929–1111): header, 4 stat tiles, setlist,
 * media gallery, retrospective (ratings, well/improve, poll, my ratings) and footer.
 */
import { ChartColumn, EyeOff, ExternalLink, Image, Instagram, Star } from 'lucide-react';
import { useBandSync } from '@/store';
import { Badge, Button, CloseButton, Modal } from '@/components/ui';
import type { RatingKey } from '@/types';

const RATING_KEYS: RatingKey[] = ['sound', 'perf', 'log', 'energy'];
const STAR_VALUES = [1, 2, 3, 4, 5];

const tileLabel = 'font-display font-semibold text-[9.5px] leading-[normal] tracking-[.11em] uppercase text-[#475569]';
const tile = 'bg-[#0f172a] border border-[#172033] rounded-[11px] p-[13px]';
const textareaCls =
  'w-full py-[11px] px-[13px] rounded-[10px] border border-[#1e293b] bg-[#020617] text-[#e2e8f0] font-sans font-normal text-[13px] leading-[normal] outline-none resize-y';

export function EventModal() {
  const { t, ev, fb, state, closeModal, openShare, pickPoll, setRating, toggleAnon, setFbWell, setFbImprove, submitFb } = useBandSync();
  if (!ev) return null;

  const ratingLabel: Record<RatingKey, string> = { sound: t.sound, perf: t.perf, log: t.logistics, energy: t.energy };

  return (
    <Modal onClose={closeModal} maxWidth={840} align="top">
      <div className="h-[3px]" style={{ background: ev.typeColor }} />

      {/* ---- header */}
      <div className="py-[22px] px-6 border-b border-[#172033] flex gap-4 items-start">
        <div className="min-w-0 flex-1">
          <div className="flex gap-[7px] flex-wrap mb-[10px]">
            <Badge lg color={ev.typeColor} style={{ background: ev.typeBg }}>{ev.typeLabel}</Badge>
            {ev.showState && (
              <Badge lg color={ev.stateColor} style={{ background: ev.stateBg }}>{ev.stateLabel}</Badge>
            )}
            <Badge lg color="#64748b">{ev.rel}</Badge>
          </div>
          <h2 className="m-0 font-display font-semibold text-[23px] leading-[1.25] text-[#f8fafc] tracking-[-.015em]">{ev.title}</h2>
          <p className="mt-[10px] mb-0 mx-0 text-[13.5px] text-[#94a3b8] leading-[1.6]">{ev.note}</p>
        </div>
        <CloseButton onClick={closeModal} size={34} />
      </div>

      {/* ---- stat tiles */}
      <div className="py-5 px-6 grid grid-cols-[repeat(4,minmax(0,1fr))] gap-3 border-b border-[#172033]">
        <div className={tile}>
          <div className={tileLabel}>{t.date}</div>
          <div className="font-sans font-semibold text-[13px] leading-[normal] text-[#e2e8f0] mt-[7px]">{ev.dateStr}</div>
          <div className="font-mono font-medium text-[11.5px] leading-[normal] text-[#64748b] mt-1">{ev.timeStr}</div>
        </div>
        <div className={tile}>
          <div className={tileLabel}>{t.venueL}</div>
          <div className="font-sans font-semibold text-[13px] leading-[1.4] text-[#e2e8f0] mt-[7px]">{ev.venue}</div>
        </div>
        <div className={tile}>
          <div className={tileLabel}>{ev.moneyLabel}</div>
          <div className="font-mono font-semibold text-[16px] leading-[normal] mt-[7px]" style={{ color: ev.moneyColor }}>{ev.moneyStr}</div>
        </div>
        <div className={tile}>
          <div className={tileLabel}>{t.attendees}</div>
          <div className="font-mono font-semibold text-[16px] leading-[normal] text-[#e2e8f0] mt-[7px]">{ev.attend} / 5</div>
        </div>
      </div>

      {/* ---- setlist */}
      {ev.hasSetlist && (
        <div className="py-5 px-6 border-b border-[#172033]">
          <div className="flex items-baseline gap-[11px] mb-[13px]">
            <h3 className="m-0 font-display font-semibold text-[13px] leading-[normal] tracking-[.02em] text-[#cbd5e1]">{ev.setlistLabel}</h3>
            <span className="font-mono font-medium text-[11.5px] leading-[normal] text-[#64748b] whitespace-nowrap">{ev.setlistCount} · {t.runtime} {ev.runtime}</span>
          </div>
          <div className="flex flex-col gap-[5px]">
            {ev.setlist.map((s) => (
              <div key={s.n} className="flex items-center gap-[14px] py-[11px] px-[13px] rounded-[10px] bg-[#0f172a] border border-[#172033]">
                <span className="font-mono font-semibold text-[12px] leading-[normal] text-[#475569] flex-none">{s.n}</span>
                <span className="w-[3px] h-[22px] rounded-[2px] flex-none" style={{ background: s.genreColor }} />
                <span className="flex-1 min-w-0 font-sans font-semibold text-[14px] leading-[normal] text-[#e2e8f0]">{s.title}</span>
                <span className="font-mono font-medium text-[11.5px] leading-[normal] text-[#64748b] flex-none">{s.key}</span>
                <span className="font-mono font-medium text-[11.5px] leading-[normal] text-[#94a3b8] flex-none min-w-[38px] text-right">{s.dur}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- media */}
      {ev.hasMedia && (
        <div className="py-5 px-6 border-b border-[#172033]">
          <h3 className="mt-0 mx-0 mb-[13px] font-display font-semibold text-[13px] leading-[normal] text-[#cbd5e1]">{t.media}</h3>
          <div className="flex flex-col gap-[7px]">
            {ev.media.map((m) => (
              <a
                key={m.url}
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 py-3 px-[14px] rounded-[11px] border border-[#1e293b] bg-[#0f172a] text-[#cbd5e1] hover:text-[#cbd5e1] no-underline font-sans font-medium text-[13px] leading-[normal] hover:border-[#34d39955]"
              >
                <Image size={16} strokeWidth={1.9} className="flex-none" style={{ color: '#6ee7b7' }} />
                <span className="flex-1">{m.label}</span>
                <ExternalLink size={14} strokeWidth={2.1} style={{ color: '#475569' }} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ---- feedback / retrospective */}
      {fb && (
        <div className="py-5 px-6 border-b border-[#172033] bg-[#0f172a66]">
          <div className="flex items-baseline gap-[11px] mb-4">
            <h3 className="m-0 font-display font-semibold text-[13px] leading-[normal] text-[#cbd5e1]">{t.feedback}</h3>
            <span className="font-mono font-medium text-[11.5px] leading-[normal] text-[#64748b]">{fb.responses} {t.responses}</span>
          </div>

          {/* rating rows */}
          <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 mb-5">
            {fb.rows.map((r) => (
              <div key={r.key} className="bg-[#0b1220] border border-[#172033] rounded-[11px] p-[13px]">
                <div className="flex justify-between items-baseline mb-[9px]">
                  <span className="font-sans font-medium text-[12px] leading-[normal] text-[#94a3b8]">{r.label}</span>
                  <span className="font-mono font-semibold text-[14px] leading-[normal]" style={{ color: r.color }}>{r.val}</span>
                </div>
                <div className="h-[5px] rounded-[3px] bg-[#172033] overflow-hidden">
                  <div className="h-[5px] rounded-[3px]" style={{ background: r.color, width: r.pct }} />
                </div>
              </div>
            ))}
          </div>

          {/* well / improve */}
          <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-4 mb-5">
            <div>
              <div className="font-display font-semibold text-[10.5px] leading-[normal] tracking-[.11em] uppercase text-[#34d399] mb-[10px]">{t.wentWell}</div>
              <div className="flex flex-col gap-2">
                {fb.well.map((w, i) => (
                  <div key={i} className="bg-[#0b1220] border border-[#172033] border-l-2 border-l-[#34d39966] rounded-[10px] p-3">
                    <p className="m-0 text-[12.5px] text-[#cbd5e1] leading-[1.6]">{w.text}</p>
                    <div className="font-mono font-medium text-[10.5px] leading-[normal] text-[#475569] mt-2">— {w.by}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-display font-semibold text-[10.5px] leading-[normal] tracking-[.11em] uppercase text-[#fbbf24] mb-[10px]">{t.improve}</div>
              <div className="flex flex-col gap-2">
                {fb.improve.map((w, i) => (
                  <div key={i} className="bg-[#0b1220] border border-[#172033] border-l-2 border-l-[#fbbf2466] rounded-[10px] p-3">
                    <p className="m-0 text-[12.5px] text-[#cbd5e1] leading-[1.6]">{w.text}</p>
                    <div className="font-mono font-medium text-[10.5px] leading-[normal] text-[#475569] mt-2">— {w.by}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* poll */}
          <div className="bg-[#0b1220] border border-[#172033] rounded-[12px] p-4 mb-5">
            <div className="flex items-center gap-[10px] mb-[13px]">
              <ChartColumn size={15} strokeWidth={1.9} style={{ color: '#a78bfa' }} />
              <span className="font-sans font-semibold text-[12.5px] leading-[normal] text-[#e2e8f0]">{fb.pollQ}</span>
              <span className="ml-auto font-mono font-medium text-[11px] leading-[normal] text-[#475569]">{fb.pollTotal} {t.votes}</span>
            </div>
            <div className="flex flex-col gap-2">
              {fb.pollOpts.map((o) => (
                <button
                  key={o.i}
                  type="button"
                  onClick={() => pickPoll(o.i)}
                  className="flex items-center gap-3 w-full py-[11px] px-[13px] rounded-[10px] border text-[#cbd5e1] cursor-pointer text-left font-sans font-medium text-[13px] leading-[normal]"
                  style={{ borderColor: o.picked ? '#34d39966' : '#1e293b', background: o.picked ? '#34d3991a' : '#0b1220' }}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block">{o.label}</span>
                    <span className="block h-[6px] rounded-[4px] bg-[#172033] mt-2 overflow-hidden">
                      <span className="block h-[6px] rounded-[4px] transition-[width] duration-300" style={{ background: o.picked ? '#34d399' : '#334155', width: o.pct }} />
                    </span>
                  </span>
                  <span className="font-mono font-semibold text-[13px] leading-[normal] text-[#94a3b8] flex-none min-w-[52px] text-right">{o.v} · {o.pct}</span>
                </button>
              ))}
            </div>
          </div>

          {/* my ratings */}
          <div className="bg-[#0b1220] border border-[#172033] rounded-[12px] p-4">
            <div className="font-display font-semibold text-[10.5px] leading-[normal] tracking-[.11em] uppercase text-[#64748b] mb-[14px]">{t.ratings}</div>
            <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-[14px] mb-4">
              {RATING_KEYS.map((k) => (
                <div key={k}>
                  <div className="font-sans font-medium text-[12px] leading-[normal] text-[#94a3b8] mb-2">{ratingLabel[k]}</div>
                  <div className="flex gap-[6px]">
                    {STAR_VALUES.map((n) => {
                      const on = state.myRatings[k] >= n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(k, n)}
                          className="grid place-items-center w-[34px] h-[34px] rounded-[9px] border cursor-pointer"
                          style={{ borderColor: on ? '#fbbf2466' : '#1e293b', background: on ? '#fbbf241f' : '#0b1220', color: on ? '#fbbf24' : '#475569' }}
                        >
                          <Star size={15} strokeWidth={1.8} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <textarea
              value={state.fbWell}
              onChange={(e) => setFbWell(e.target.value)}
              placeholder={t.wentWell}
              rows={2}
              className={`${textareaCls} mb-[9px]`}
            />
            <textarea
              value={state.fbImprove}
              onChange={(e) => setFbImprove(e.target.value)}
              placeholder={t.improve}
              rows={2}
              className={textareaCls}
            />
            <div className="flex items-center gap-[10px] mt-[13px] flex-wrap">
              <button
                type="button"
                onClick={toggleAnon}
                className="flex items-center gap-[9px] py-2 px-3 rounded-[9px] border font-sans font-medium text-[12.5px] leading-[normal] cursor-pointer"
                style={{ borderColor: state.anon ? '#a78bfa66' : '#1e293b', background: state.anon ? '#7c3aed1a' : '#0b1220', color: state.anon ? '#c4b5fd' : '#94a3b8' }}
              >
                <EyeOff size={14} strokeWidth={1.9} />
                {t.anon}
              </button>
              <Button variant="primary" onClick={submitFb} className="ml-auto py-[10px] px-4">
                {t.submitFeedback}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---- footer */}
      <div className="py-[18px] px-6 flex gap-[10px] justify-end">
        {ev.isGig && (
          <Button variant="brand" onClick={() => openShare(ev.id)} className="py-[11px] px-4 rounded-[11px]">
            <Instagram size={15} strokeWidth={1.9} />
            {t.prepIg}
          </Button>
        )}
        <Button variant="surface" onClick={closeModal} className="py-[11px] px-[18px] rounded-[11px]">
          {t.close}
        </Button>
      </div>
    </Modal>
  );
}
