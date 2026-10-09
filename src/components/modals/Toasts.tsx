/**
 * Toast stack (design lines 1516–1525): bottom-right on desktop, full-width at
 * the bottom on phones. Tinted emerald ("ok"), violet, or rose ("err") per tone.
 * Tap to dismiss early; each toast plays a rise-in / fade-out animation.
 */
import { AlertTriangle, Check } from 'lucide-react';
import { useGuataca } from '@/store';

export function Toasts() {
  const { t, toasts, dismissToast } = useGuataca();
  if (toasts.length === 0) return null;

  return (
    <div role="status" aria-live="polite" className="fixed z-[100] flex flex-col gap-[9px] left-3 right-3 items-stretch bottom-[calc(env(safe-area-inset-bottom)+84px)] sm:left-auto sm:right-[26px] sm:bottom-[26px] sm:items-end">
      {toasts.map((k) => (
        <div
          key={k.id}
          className={`flex items-center gap-[11px] sm:max-w-[400px] w-full sm:w-auto p-[13px_17px] rounded-[12px] border backdrop-blur-[10px] font-sans font-semibold text-[13px] leading-[normal] shadow-pop ${k.leaving ? 'animate-toast-out' : 'animate-rise'}`}
          style={{ borderColor: k.border, background: k.bg, color: k.color }}
        >
          <button
            type="button"
            onClick={() => dismissToast(k.id)}
            title={t.dismiss}
            className="flex flex-1 items-center gap-[11px] text-left font-[inherit] text-inherit bg-transparent border-0 p-0 cursor-pointer"
          >
            {k.tone === 'err' ? <AlertTriangle size={16} strokeWidth={2.2} className="flex-none" /> : <Check size={16} strokeWidth={2.2} className="flex-none" />}
            <span className="flex-1">{k.msg}</span>
          </button>
          {k.action && (
            <button
              type="button"
              onClick={() => { k.action!.run(); dismissToast(k.id); }}
              className="flex-none min-h-[32px] px-[10px] rounded-[8px] border border-current bg-transparent text-inherit font-sans font-bold text-[12px] cursor-pointer"
            >
              {k.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
