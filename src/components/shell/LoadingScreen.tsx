/** Full-screen splash shown while auth resolves and the first data load runs: the brand mark ringed by a spinner. */
import { BrandMark } from '../ui';

export function LoadingScreen({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="min-h-screen bg-base grid place-items-center">
      <div className="flex flex-col items-center gap-4 text-ink-muted">
        <div className="relative w-[88px] h-[88px] grid place-items-center">
          <div aria-hidden className="absolute inset-0 rounded-full border-[3px] border-line border-t-emerald animate-spin" />
          <BrandMark size={56} />
        </div>
        <span className="font-mono text-[12px] tracking-[.08em] uppercase animate-pulse-soft">{label}</span>
      </div>
    </div>
  );
}
