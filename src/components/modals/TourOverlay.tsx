/**
 * Onboarding tour overlay (design lines 1492–1514): full-screen scrim with a
 * centered violet card stepping through TOUR_STEPS. Skip / Next / Got it.
 */
import { Sparkle } from 'lucide-react';
import { useGuataca } from '@/store';

export function TourOverlay() {
  const { t, tour, tourNext, tourEnd } = useGuataca();
  if (!tour.on) return null;

  return (
    <div className="fixed inset-0 z-[99] bg-[color-mix(in_srgb,var(--color-base)_90%,transparent)] backdrop-blur-[10px] flex items-center justify-center p-[32px] animate-fade [animation-duration:.22s]">
      <div className="w-full max-w-[470px] bg-[linear-gradient(160deg,var(--color-hover),var(--color-raised))] border border-violet/40 rounded-[20px] p-[28px] animate-rise [animation-duration:.3s]">
        <div className="flex items-center gap-[12px] mb-[18px]">
          <span className="w-[36px] h-[36px] rounded-[11px] bg-[linear-gradient(145deg,var(--color-violet),var(--color-violet-deeper))] grid place-items-center flex-none">
            <Sparkle size={18} strokeWidth={2} color="#f5f3ff" />
          </span>
          <span className="font-mono font-semibold text-[11px] leading-[normal] text-violet-light ml-auto whitespace-nowrap">
            {tour.num} / {tour.total}
          </span>
        </div>
        <h2 className="m-0 font-display font-semibold text-[21px] leading-[1.3] text-ink-bright tracking-[-.01em]">{tour.title}</h2>
        <p className="mt-[12px] mb-0 font-sans text-[14px] leading-[1.7] text-ink-meta">{tour.body}</p>
        <div className="flex gap-[10px] mt-[24px]">
          <button
            type="button"
            onClick={tourEnd}
            className="p-[11px_16px] rounded-[11px] border border-line bg-transparent text-ink-muted font-sans font-semibold text-[13px] leading-[normal] cursor-pointer"
          >
            {t.tourSkip}
          </button>
          {tour.isLast ? (
            <button
              type="button"
              onClick={tourEnd}
              className="flex-1 p-[11px_16px] rounded-[11px] border border-emerald/40 bg-[var(--color-tint-emerald)] text-emerald-light font-sans font-semibold text-[13px] leading-[normal] cursor-pointer"
            >
              {t.tourDone}
            </button>
          ) : (
            <button
              type="button"
              onClick={tourNext}
              className="flex-1 p-[11px_16px] rounded-[11px] border border-violet/40 bg-[var(--color-tint-violet)] text-violet-lighter font-sans font-semibold text-[13px] leading-[normal] cursor-pointer"
            >
              {t.tourNext} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
