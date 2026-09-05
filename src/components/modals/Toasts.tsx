/**
 * Toast stack (design lines 1516–1525): bottom-right, non-interactive, tinted
 * emerald ("ok") or violet per toast tone.
 */
import { AlertTriangle, Check } from 'lucide-react';
import { useGuataca } from '@/store';

export function Toasts() {
  const { toasts } = useGuataca();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed z-[100] flex flex-col gap-[9px] pointer-events-none left-3 right-3 items-stretch bottom-[calc(env(safe-area-inset-bottom)+84px)] sm:left-auto sm:right-[26px] sm:bottom-[26px] sm:items-end">
      {toasts.map((k) => (
        <div
          key={k.id}
          className="flex items-center gap-[11px] sm:max-w-[400px] p-[13px_17px] rounded-[12px] border backdrop-blur-[10px] font-sans font-semibold text-[13px] leading-[normal] animate-rise shadow-pop"
          style={{ borderColor: k.border, background: k.bg, color: k.color }}
        >
          {k.tone === 'err' ? <AlertTriangle size={16} strokeWidth={2.2} className="flex-none" /> : <Check size={16} strokeWidth={2.2} className="flex-none" />}
          <span>{k.msg}</span>
        </div>
      ))}
    </div>
  );
}
