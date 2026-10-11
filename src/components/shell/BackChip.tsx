/**
 * "← Back to <place>" pill shown after a cross-view jump (search, setlist song link,
 * shared movement link). Disappears once the member navigates anywhere on their own.
 */
import { ArrowLeft } from 'lucide-react';
import { useGuataca } from '@/store';

export function BackChip() {
  const { t, backLabel, goBack } = useGuataca();
  if (!backLabel) return null;
  return (
    <button
      type="button"
      onClick={goBack}
      className="fixed z-[70] left-1/2 -translate-x-1/2 top-[calc(env(safe-area-inset-top)+64px)] inline-flex items-center gap-2 min-h-[40px] px-4 rounded-full border border-line-hover bg-raised text-ink-body font-sans font-semibold text-[13px] leading-normal shadow-pop cursor-pointer animate-rise"
    >
      <ArrowLeft size={15} strokeWidth={2.2} aria-hidden />
      {t.backTo.replace('%s', backLabel)}
    </button>
  );
}
