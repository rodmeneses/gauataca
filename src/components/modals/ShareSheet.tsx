/**
 * Instagram bottom sheet (design lines 1356–1409): caption preview, the three
 * automated steps and the copy / flyer / share / cancel actions.
 */
import { Copy, Image, Instagram, Share } from 'lucide-react';
import { useGuataca } from '@/store';

const STEP_NUM =
  'w-5 h-5 rounded-[6px] bg-[var(--color-tint-emerald)] text-emerald-light grid place-items-center font-mono font-semibold text-[10px] leading-[normal] flex-none mt-[1px]';
const STEP_ROW = 'flex gap-[11px] items-start text-[12px] leading-[1.55] text-ink-meta';
const ACTION_BTN =
  'flex items-center justify-center gap-[9px] w-full min-h-[50px] rounded-[14px] border font-sans font-semibold text-[14px] leading-[normal] cursor-pointer whitespace-nowrap';

export function ShareSheet() {
  const { t, sheet, closeSheet, copyCaption, openFlyer, shareNow } = useGuataca();
  if (!sheet) return null;

  return (
    <div
      onClick={closeSheet}
      className="fixed inset-0 z-[90] bg-[color-mix(in_srgb,var(--color-base)_85%,transparent)] backdrop-blur-[8px] flex items-end justify-center animate-fade-fast"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[440px] bg-raised border border-line border-b-0 rounded-[24px_24px_0_0] p-[24px_22px_30px] animate-sheet"
      >
        <div className="w-[42px] h-[4px] rounded-[3px] bg-ink-faint mx-auto mb-5" />

        <div className="flex items-center gap-3 mb-[18px]">
          <span
            className="w-10 h-10 rounded-xl grid place-items-center flex-none"
            style={{ background: 'linear-gradient(135deg,var(--color-violet),var(--color-fuchsia))' }}
          >
            <Instagram size={20} strokeWidth={2} color="#fff" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-display font-semibold text-[15px] leading-[normal] text-ink-bright">{t.prepIg}</div>
            <div className="text-[11.5px] text-ink-muted mt-1 truncate-1">{sheet.title}</div>
          </div>
        </div>

        <div className="bg-base border border-line rounded-[14px] p-[15px] mb-4">
          <div className="font-display font-semibold text-[10px] leading-[normal] tracking-[.12em] uppercase text-ink-dim mb-[10px]">{t.caption}</div>
          <p className="m-0 font-sans font-normal text-[13px] leading-[1.65] text-ink-body whitespace-pre-line">{sheet.caption}</p>
        </div>

        <div className="flex flex-col gap-[9px] mb-[18px]">
          <div className={STEP_ROW}>
            <span className={STEP_NUM}>1</span>
            <span>{t.igStep1}</span>
          </div>
          <div className={STEP_ROW}>
            <span className={STEP_NUM}>2</span>
            <span>{t.igStep2}</span>
          </div>
          <div className={STEP_ROW}>
            <span className={STEP_NUM}>3</span>
            <span>{t.igStep3}</span>
          </div>
        </div>

        <div className="flex flex-col gap-[9px]">
          <button type="button" onClick={copyCaption} className={`${ACTION_BTN} border-emerald/40 bg-[var(--color-tint-emerald)] text-emerald-light`}>
            <Copy size={17} strokeWidth={1.9} />
            {t.copy}
          </button>
          {sheet.flyer && (
            <button type="button" onClick={openFlyer} className={`${ACTION_BTN} border-line bg-surface text-ink-body`}>
              <Image size={17} strokeWidth={1.9} />
              {t.openFlyer}
            </button>
          )}
          <button
            type="button"
            onClick={shareNow}
            className="flex items-center justify-center gap-[9px] w-full min-h-[52px] rounded-[14px] border-none text-white font-sans font-semibold text-[15px] leading-[normal] cursor-pointer whitespace-nowrap"
            style={{ background: 'linear-gradient(100deg,var(--color-violet),var(--color-fuchsia))' }}
          >
            <Share size={18} strokeWidth={2} />
            {t.shareIg}
          </button>
          <button
            type="button"
            onClick={closeSheet}
            className="w-full min-h-[44px] rounded-[14px] border-none bg-transparent text-ink-muted font-sans font-semibold text-[13px] leading-[normal] cursor-pointer"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
