/**
 * Toast stack (design lines 1516–1525): bottom-right on desktop, full-width at
 * the bottom on phones. Tinted emerald ("ok"), violet, or rose ("err") per tone.
 * Tap to dismiss early; each toast plays a rise-in / fade-out animation.
 */
import { AlertTriangle, Check } from 'lucide-react';
import { useGuataca } from '@/store';

export function Toasts() {
  const { toasts, dismissToast } = useGuataca();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed z-[100] flex flex-col gap-[9px] left-3 right-3 items-stretch bottom-[calc(env(safe-area-inset-bottom)+84px)] sm:left-auto sm:right-[26px] sm:bottom-[26px] sm:items-end">
      {toasts.map((k) => (
        <button
          key={k.id}
          type="button"
          onClick={() => dismissToast(k.id)}
          aria-label="Dismiss"
          className={`flex items-center gap-[11px] sm:max-w-[400px] w-full sm:w-auto text-left p-[13px_17px] rounded-[12px] border backdrop-blur-[10px] font-sans font-semibold text-[13px] leading-[normal] shadow-pop transition-transform active:scale-[0.98] ${k.leaving ? 'animate-toast-out' : 'animate-rise'}`}
          style={{ borderColor: k.border, background: k.bg, color: k.color }}
        >
          {k.tone === 'err' ? <AlertTriangle size={16} strokeWidth={2.2} className="flex-none" /> : <Check size={16} strokeWidth={2.2} className="flex-none" />}
          <span className="flex-1">{k.msg}</span>
        </button>
      ))}
    </div>
  );
}
