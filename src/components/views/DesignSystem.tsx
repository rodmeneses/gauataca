/**
 * "Sistema de diseño" view — color tokens, type scale, component samples and
 * the Phase 2 handoff notes. Mirrors design lines 637–747.
 */
import { File, Mic, Youtube } from 'lucide-react';
import { useGuataca } from '@/store';
import { Badge } from '@/components/ui';

const H2 = 'm-0 mb-[14px] font-display font-semibold text-[15px] leading-none text-ink';
const CARD = 'bg-surface border border-line rounded-[14px] p-[18px]';
const CARD_LABEL = 'font-display font-semibold text-[10.5px] tracking-[.12em] uppercase text-ink-muted mb-[14px]';
const SAMPLE_BTN = 'py-[9px] px-[14px] rounded-[10px] border font-sans font-semibold text-[13px]';
const ROW = 'flex justify-between';

export function DesignSystem() {
  const { t, tokens, typeScale, handoffNotes } = useGuataca();

  return (
    <div className="flex flex-col gap-[26px] max-w-[1080px] animate-fade">
      {/* ------------------------------------------------------- tokens */}
      <section>
        <h2 className={H2}>{t.tokens}</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-[12px]">
          {tokens.map((k) => (
            <div key={k.name} className="bg-surface border border-line rounded-[12px] p-[12px]">
              <div className="w-full h-[44px] rounded-[9px] border border-line-soft" style={{ background: `var(${k.varName})` }} />
              <div className="font-sans font-semibold text-[12.5px] text-ink-base mt-[11px]">{k.name}</div>
              <div className="flex justify-between mt-[7px] gap-2">
                <span className="font-mono font-medium text-[11px] text-ink-muted truncate">{k.varName}</span>
                <span className="font-mono font-medium text-[11px] text-violet-light flex-none">{k.tw}</span>
              </div>
              <div className="text-[11px] text-ink-dim mt-[8px] leading-[1.5]">{k.use}</div>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- type scale */}
      <section>
        <h2 className={H2}>{t.typeScale}</h2>
        <div className="bg-surface border border-line rounded-[14px] overflow-x-auto">
          {typeScale.map((ty) => (
            <div key={ty.name} className="min-w-[700px] grid grid-cols-[250px_100px_1fr] gap-[18px] p-[16px_18px] border-b border-line-faint items-center">
              <span className="font-mono font-medium text-[12px] text-ink-muted">{ty.name}</span>
              <span className="font-mono font-medium text-[12px] text-violet-light">{ty.px}</span>
              <span style={ty.style}>{ty.sample}</span>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- components */}
      <section>
        <h2 className={H2}>{t.components}</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[14px]">
          <div className={CARD}>
            <div className={CARD_LABEL}>Buttons</div>
            <div className="flex flex-wrap gap-[9px]">
              <button type="button" className={`${SAMPLE_BTN} border-emerald/40 bg-[var(--color-tint-emerald)] text-emerald-light cursor-pointer`}>Primary</button>
              <button type="button" className={`${SAMPLE_BTN} border-violet/40 bg-[var(--color-tint-violet)] text-violet-lighter cursor-pointer`}>Brand</button>
              <button type="button" className={`${SAMPLE_BTN} border-line bg-raised text-ink-body cursor-pointer`}>Ghost</button>
              <button type="button" className={`${SAMPLE_BTN} border-line bg-transparent text-ink-dim cursor-not-allowed`}>Disabled</button>
            </div>
          </div>

          <div className={CARD}>
            <div className={CARD_LABEL}>Status badges</div>
            <div className="flex flex-wrap gap-[8px]">
              <Badge lg color="var(--color-emerald)">{t.active}</Badge>
              <Badge lg color="var(--color-amber)">{t.rescheduled}</Badge>
              <Badge lg color="var(--color-rose)">{t.cancelled}</Badge>
              <Badge lg color="var(--color-violet-light)">{t.gig}</Badge>
              <Badge lg color="var(--color-sky)">{t.studio}</Badge>
              <Badge lg color="var(--color-ink-meta)">{t.garage}</Badge>
            </div>
          </div>

          <div className={CARD}>
            <div className={CARD_LABEL}>Input · 44px hit target</div>
            <input
              placeholder={t.search}
              className="w-full p-[12px_13px] rounded-[11px] border border-line bg-raised text-ink-base font-sans text-[14px] outline-none"
            />
            <div className="flex gap-[7px] mt-[11px]">
              <span className="icon-box text-blue">
                <File size={19} strokeWidth={1.8} />
              </span>
              <span className="icon-box text-red">
                <Youtube size={19} strokeWidth={1.8} />
              </span>
              <span className="icon-box text-emerald">
                {/* the design draws this sample with two arcs (SpotifyIcon has three) */}
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M7 9.5c3.5-1 7-.6 10 1" />
                  <path d="M7.5 13c2.8-.8 5.6-.4 8 1.2" />
                </svg>
              </span>
              <span className="icon-box text-violet-lighter">
                <Mic size={19} strokeWidth={1.8} />
              </span>
            </div>
          </div>

          <div className={CARD}>
            <div className={CARD_LABEL}>Radius · spacing</div>
            <div className="flex flex-col gap-[9px] font-mono font-medium text-[12.5px] text-ink-meta">
              <div className={ROW}><span>Chip / badge</span><span className="text-violet-light">6–8px</span></div>
              <div className={ROW}><span>Button / input</span><span className="text-violet-light">9–12px</span></div>
              <div className={ROW}><span>Card</span><span className="text-violet-light">14px</span></div>
              <div className={ROW}><span>Modal / hero</span><span className="text-violet-light">16–18px</span></div>
              <div className={`${ROW} border-t border-line-soft pt-[9px]`}><span>Grid gap</span><span className="text-emerald">14px</span></div>
              <div className={ROW}><span>Card padding</span><span className="text-emerald">17–19px</span></div>
              <div className={ROW}><span>Page padding</span><span className="text-emerald">24 / 28px</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ handoff notes */}
      <section>
        <div className="flex items-baseline gap-[12px] mb-[14px]">
          <h2 className="m-0 font-display font-semibold text-[15px] leading-none text-ink">{t.handoff}</h2>
          <span className="text-[12px] text-ink-muted">{t.handoffSub}</span>
        </div>
        <div className="flex flex-col gap-[12px]">
          {handoffNotes.map((h) => (
            <div key={h.h} className={CARD}>
              <div className="font-display font-semibold text-[13px] text-violet-lighter mb-[12px]">{h.h}</div>
              <div className="flex flex-col gap-[9px]">
                {h.items.map((i, n) => (
                  <div key={n} className="flex gap-[11px] items-start">
                    <span className="w-[5px] h-[5px] rounded-full bg-line-hover flex-none mt-[7px]" />
                    <span className="font-sans text-[13px] leading-[1.65] text-ink-meta">{i}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
