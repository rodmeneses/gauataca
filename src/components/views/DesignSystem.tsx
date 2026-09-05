/**
 * "Sistema de diseño" view — color tokens, type scale, component samples and
 * the Phase 2 handoff notes. Mirrors design lines 637–747.
 */
import { File, Mic, Youtube } from 'lucide-react';
import { useGuataca } from '@/store';
import { Badge } from '@/components/ui';

const H2 = 'm-0 mb-[14px] font-display font-semibold text-[15px] leading-none text-[#f1f5f9]';
const CARD = 'bg-[#0f172a] border border-[#1e293b] rounded-[14px] p-[18px]';
const CARD_LABEL = 'font-display font-semibold text-[10.5px] tracking-[.12em] uppercase text-[#64748b] mb-[14px]';
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
            <div key={k.name} className="bg-[#0f172a] border border-[#1e293b] rounded-[12px] p-[12px]">
              <div className="w-full h-[44px] rounded-[9px] border border-[#ffffff14]" style={{ background: k.hex }} />
              <div className="font-sans font-semibold text-[12.5px] text-[#e2e8f0] mt-[11px]">{k.name}</div>
              <div className="flex justify-between mt-[7px]">
                <span className="font-mono font-medium text-[11px] text-[#64748b]">{k.hex}</span>
                <span className="font-mono font-medium text-[11px] text-[#a78bfa]">{k.tw}</span>
              </div>
              <div className="text-[11px] text-[#475569] mt-[8px] leading-[1.5]">{k.use}</div>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- type scale */}
      <section>
        <h2 className={H2}>{t.typeScale}</h2>
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-[14px] overflow-x-auto">
          {typeScale.map((ty) => (
            <div key={ty.name} className="min-w-[700px] grid grid-cols-[250px_100px_1fr] gap-[18px] p-[16px_18px] border-b border-[#131c2e] items-center">
              <span className="font-mono font-medium text-[12px] text-[#64748b]">{ty.name}</span>
              <span className="font-mono font-medium text-[12px] text-[#a78bfa]">{ty.px}</span>
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
              <button type="button" className={`${SAMPLE_BTN} border-[#34d39955] bg-[#34d39918] text-[#6ee7b7] cursor-pointer`}>Primary</button>
              <button type="button" className={`${SAMPLE_BTN} border-[#7c3aed4d] bg-[#7c3aed1a] text-[#c4b5fd] cursor-pointer`}>Brand</button>
              <button type="button" className={`${SAMPLE_BTN} border-[#1e293b] bg-[#0b1220] text-[#cbd5e1] cursor-pointer`}>Ghost</button>
              <button type="button" className={`${SAMPLE_BTN} border-[#1e293b] bg-transparent text-[#475569] cursor-not-allowed`}>Disabled</button>
            </div>
          </div>

          <div className={CARD}>
            <div className={CARD_LABEL}>Status badges</div>
            <div className="flex flex-wrap gap-[8px]">
              <Badge lg color="#34d399">{t.active}</Badge>
              <Badge lg color="#fbbf24">{t.rescheduled}</Badge>
              <Badge lg color="#f43f5e">{t.cancelled}</Badge>
              <Badge lg color="#a78bfa">{t.gig}</Badge>
              <Badge lg color="#38bdf8">{t.studio}</Badge>
              <Badge lg color="#94a3b8">{t.garage}</Badge>
            </div>
          </div>

          <div className={CARD}>
            <div className={CARD_LABEL}>Input · 44px hit target</div>
            <input
              placeholder={t.search}
              className="w-full p-[12px_13px] rounded-[11px] border border-[#1e293b] bg-[#0b1220] text-[#e2e8f0] font-sans text-[14px] outline-none"
            />
            <div className="flex gap-[7px] mt-[11px]">
              <span className="icon-box text-[#60a5fa]">
                <File size={19} strokeWidth={1.8} />
              </span>
              <span className="icon-box text-[#f87171]">
                <Youtube size={19} strokeWidth={1.8} />
              </span>
              <span className="icon-box text-[#34d399]">
                {/* the design draws this sample with two arcs (SpotifyIcon has three) */}
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M7 9.5c3.5-1 7-.6 10 1" />
                  <path d="M7.5 13c2.8-.8 5.6-.4 8 1.2" />
                </svg>
              </span>
              <span className="icon-box text-[#c4b5fd]">
                <Mic size={19} strokeWidth={1.8} />
              </span>
            </div>
          </div>

          <div className={CARD}>
            <div className={CARD_LABEL}>Radius · spacing</div>
            <div className="flex flex-col gap-[9px] font-mono font-medium text-[12.5px] text-[#94a3b8]">
              <div className={ROW}><span>Chip / badge</span><span className="text-[#a78bfa]">6–8px</span></div>
              <div className={ROW}><span>Button / input</span><span className="text-[#a78bfa]">9–12px</span></div>
              <div className={ROW}><span>Card</span><span className="text-[#a78bfa]">14px</span></div>
              <div className={ROW}><span>Modal / hero</span><span className="text-[#a78bfa]">16–18px</span></div>
              <div className={`${ROW} border-t border-[#172033] pt-[9px]`}><span>Grid gap</span><span className="text-[#34d399]">14px</span></div>
              <div className={ROW}><span>Card padding</span><span className="text-[#34d399]">17–19px</span></div>
              <div className={ROW}><span>Page padding</span><span className="text-[#34d399]">24 / 28px</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ handoff notes */}
      <section>
        <div className="flex items-baseline gap-[12px] mb-[14px]">
          <h2 className="m-0 font-display font-semibold text-[15px] leading-none text-[#f1f5f9]">{t.handoff}</h2>
          <span className="text-[12px] text-[#64748b]">{t.handoffSub}</span>
        </div>
        <div className="flex flex-col gap-[12px]">
          {handoffNotes.map((h) => (
            <div key={h.h} className={CARD}>
              <div className="font-display font-semibold text-[13px] text-[#c4b5fd] mb-[12px]">{h.h}</div>
              <div className="flex flex-col gap-[9px]">
                {h.items.map((i, n) => (
                  <div key={n} className="flex gap-[11px] items-start">
                    <span className="w-[5px] h-[5px] rounded-full bg-[#334155] flex-none mt-[7px]" />
                    <span className="font-sans text-[13px] leading-[1.65] text-[#94a3b8]">{i}</span>
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
