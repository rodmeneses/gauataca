/** Retrospective block of the event modal: ratings, well/improve, poll and my ratings. */
import { ChartColumn, EyeOff, Star } from 'lucide-react';
import { useGuataca, type FeedbackVm } from '@/store';
import { Button } from '@/components/ui';
import { textareaCls } from './eventModalStyles';
import type { RatingKey } from '@/types';

const RATING_KEYS: RatingKey[] = ['sound', 'perf', 'log', 'energy'];
const STAR_VALUES = [1, 2, 3, 4, 5];

export function EventFeedbackSection({ fb }: { fb: FeedbackVm }) {
  const { t, state, pickPoll, setRating, toggleAnon, setFbWell, setFbImprove, submitFb } = useGuataca();
  const ratingLabel: Record<RatingKey, string> = { sound: t.sound, perf: t.perf, log: t.logistics, energy: t.energy };

  return (
    <>
    {fb && (
      <div className="py-5 px-6 border-b border-line-soft bg-[color-mix(in_srgb,var(--color-surface)_75%,transparent)]">
        <div className="flex items-baseline gap-[11px] mb-4">
          <h3 className="m-0 font-display font-semibold text-[13px] leading-[normal] text-ink-body">{t.feedback}</h3>
          <span className="font-mono font-medium text-[11.5px] leading-[normal] text-ink-muted">{fb.responses} {t.responses}</span>
        </div>

        {/* rating rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {fb.rows.map((r) => (
            <div key={r.key} className="bg-raised border border-line-soft rounded-[11px] p-[13px]">
              <div className="flex justify-between items-baseline mb-[9px]">
                <span className="font-sans font-medium text-[12px] leading-[normal] text-ink-meta">{r.label}</span>
                <span className="font-mono font-semibold text-[14px] leading-[normal]" style={{ color: r.color }}>{r.val}</span>
              </div>
              <div className="h-[5px] rounded-[3px] bg-line-soft overflow-hidden">
                <div className="h-[5px] rounded-[3px]" style={{ background: r.color, width: r.pct }} />
              </div>
            </div>
          ))}
        </div>

        {/* well / improve */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <div className="font-display font-semibold text-[10.5px] leading-[normal] tracking-[.11em] uppercase text-emerald mb-[10px]">{t.wentWell}</div>
            <div className="flex flex-col gap-2">
              {fb.well.map((w, i) => (
                <div key={i} className="bg-raised border border-line-soft border-l-2 border-l-[color-mix(in srgb, var(--color-emerald) 40%, transparent)] rounded-[10px] p-3">
                  <p className="m-0 text-[12.5px] text-ink-body leading-[1.6]">{w.text}</p>
                  <div className="font-mono font-medium text-[10.5px] leading-[normal] text-ink-dim mt-2">— {w.by}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="font-display font-semibold text-[10.5px] leading-[normal] tracking-[.11em] uppercase text-amber mb-[10px]">{t.improve}</div>
            <div className="flex flex-col gap-2">
              {fb.improve.map((w, i) => (
                <div key={i} className="bg-raised border border-line-soft border-l-2 border-l-[color-mix(in srgb, var(--color-amber) 40%, transparent)] rounded-[10px] p-3">
                  <p className="m-0 text-[12.5px] text-ink-body leading-[1.6]">{w.text}</p>
                  <div className="font-mono font-medium text-[10.5px] leading-[normal] text-ink-dim mt-2">— {w.by}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* poll */}
        <div className="bg-raised border border-line-soft rounded-[12px] p-4 mb-5">
          <div className="flex items-center gap-[10px] mb-[13px]">
            <ChartColumn size={15} strokeWidth={1.9} style={{ color: 'var(--color-violet-light)' }} />
            <span className="font-sans font-semibold text-[12.5px] leading-[normal] text-ink-base">{fb.pollQ}</span>
            <span className="ml-auto font-mono font-medium text-[11px] leading-[normal] text-ink-dim">{fb.pollTotal} {t.votes}</span>
          </div>
          <div className="flex flex-col gap-2">
            {fb.pollOpts.map((o) => (
              <button
                key={o.i}
                type="button"
                onClick={() => pickPoll(o.i)}
                className="flex items-center gap-3 w-full py-[11px] px-[13px] rounded-[10px] border text-ink-body cursor-pointer text-left font-sans font-medium text-[13px] leading-[normal]"
                style={{ borderColor: o.picked ? 'color-mix(in srgb, var(--color-emerald) 40%, transparent)' : 'var(--color-line)', background: o.picked ? 'color-mix(in srgb, var(--color-emerald) 11%, transparent)' : 'var(--color-raised)' }}
              >
                <span className="flex-1 min-w-0">
                  <span className="block">{o.label}</span>
                  <span className="block h-[6px] rounded-[4px] bg-line-soft mt-2 overflow-hidden">
                    <span className="block h-[6px] rounded-[4px] transition-[width] duration-300" style={{ background: o.picked ? 'var(--color-emerald)' : 'var(--color-ink-faint)', width: o.pct }} />
                  </span>
                </span>
                <span className="font-mono font-semibold text-[13px] leading-[normal] text-ink-meta flex-none min-w-[52px] text-right">{o.v} · {o.pct}</span>
              </button>
            ))}
          </div>
        </div>

        {/* my ratings */}
        <div className="bg-raised border border-line-soft rounded-[12px] p-4">
          <div className="font-display font-semibold text-[10.5px] leading-[normal] tracking-[.11em] uppercase text-ink-muted mb-[14px]">{t.ratings}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-4">
            {RATING_KEYS.map((k) => (
              <div key={k}>
                <div className="font-sans font-medium text-[12px] leading-[normal] text-ink-meta mb-2">{ratingLabel[k]}</div>
                <div className="flex gap-[6px]">
                  {STAR_VALUES.map((n) => {
                    const on = state.myRatings[k] >= n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(k, n)}
                        className="grid place-items-center w-[34px] h-[34px] rounded-[9px] border cursor-pointer"
                        style={{ borderColor: on ? 'color-mix(in srgb, var(--color-amber) 40%, transparent)' : 'var(--color-line)', background: on ? 'color-mix(in srgb, var(--color-amber) 12%, transparent)' : 'var(--color-raised)', color: on ? 'var(--color-amber)' : 'var(--color-ink-dim)' }}
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
              style={{ borderColor: state.anon ? 'color-mix(in srgb, var(--color-violet-light) 40%, transparent)' : 'var(--color-line)', background: state.anon ? 'color-mix(in srgb, var(--color-violet) 12%, transparent)' : 'var(--color-raised)', color: state.anon ? 'var(--color-violet-lighter)' : 'var(--color-ink-meta)' }}
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
    </>
  );
}
