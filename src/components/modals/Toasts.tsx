/**
 * Toast stack (design lines 1516–1525): bottom-right, non-interactive, tinted
 * emerald ("ok") or violet per toast tone.
 */
import { AlertTriangle, Check } from 'lucide-react';
import { useBandSync } from '@/store';

export function Toasts() {
  const { toasts } = useBandSync();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-[26px] right-[26px] z-[100] flex flex-col gap-[9px] items-end pointer-events-none">
      {toasts.map((k) => (
        <div
          key={k.id}
          className="flex items-center gap-[11px] max-w-[400px] p-[13px_17px] rounded-[12px] border backdrop-blur-[10px] font-sans font-semibold text-[13px] leading-[normal] animate-rise shadow-[0_18px_40px_-14px_#000]"
          style={{ borderColor: k.border, background: k.bg, color: k.color }}
        >
          {k.tone === 'err' ? <AlertTriangle size={16} strokeWidth={2.2} className="flex-none" /> : <Check size={16} strokeWidth={2.2} className="flex-none" />}
          <span>{k.msg}</span>
        </div>
      ))}
    </div>
  );
}
