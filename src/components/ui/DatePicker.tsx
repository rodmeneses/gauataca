/**
 * Calendar popup date picker. Replaces the native <input type="date"> with a
 * themed button + month grid so picking a date is a tap, not a typed string.
 * `value` is an ISO date ("YYYY-MM-DD") or "".
 *
 * The popup renders through a portal at a fixed position (anchored to the
 * button) so it is never clipped by the modal's `overflow: hidden`.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { fmt } from '../../lib/format';
import type { Lang } from '../../types';

const DOW: Record<Lang, string[]> = {
  es: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
};
const MONTHS: Record<Lang, string[]> = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

const POPUP_W = 280;
const POPUP_H = 320;

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DatePicker({ value, onChange, lang, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  lang: Lang;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [view, setView] = useState(() => {
    const base = value ? new Date(value + 'T12:00:00') : new Date();
    return { y: base.getFullYear(), m: base.getMonth() };
  });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const r = btnRef.current!.getBoundingClientRect();
    let left = r.left;
    if (left + POPUP_W > window.innerWidth - 8) left = Math.max(8, window.innerWidth - POPUP_W - 8);
    let top = r.bottom + 8;
    if (top + POPUP_H > window.innerHeight - 8) top = r.top - POPUP_H - 8;
    setPos({ top, left });
    setOpen(true);
  };

  const first = new Date(view.y, view.m, 1);
  const startDow = first.getDay(); // 0 = Sunday
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const todayISO = toISO(new Date());

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prev = () => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const next = () => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));

  const pick = (d: number) => {
    onChange(toISO(new Date(view.y, view.m, d)));
    setOpen(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="input input-mono flex items-center gap-2 text-left cursor-pointer"
      >
        <Calendar size={15} strokeWidth={1.9} className="text-ink-muted flex-none" />
        <span className={value ? 'text-ink-base' : 'text-ink-dim'}>{value ? fmt(value, lang, true) : (placeholder ?? '')}</span>
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={popRef}
            className="fixed z-[90] w-[280px] rounded-[14px] border border-line-strong bg-raised p-3 shadow-pop animate-rise"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={prev} aria-label="Previous month" className="grid place-items-center w-7 h-7 rounded-[8px] border border-line bg-surface text-ink-meta hover:text-ink cursor-pointer">
                <ChevronLeft size={15} strokeWidth={2.2} />
              </button>
              <span className="font-display font-semibold text-[13px] text-ink-bright capitalize">
                {MONTHS[lang][view.m]} {view.y}
              </span>
              <button type="button" onClick={next} aria-label="Next month" className="grid place-items-center w-7 h-7 rounded-[8px] border border-line bg-surface text-ink-meta hover:text-ink cursor-pointer">
                <ChevronRight size={15} strokeWidth={2.2} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {DOW[lang].map((w) => (
                <span key={w} className="text-center font-mono font-semibold text-[10px] text-ink-dim py-1">{w}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (d == null) return <span key={i} />;
                const iso = toISO(new Date(view.y, view.m, d));
                const selected = iso === value;
                const isToday = iso === todayISO;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pick(d)}
                    className="grid place-items-center h-8 rounded-[8px] font-mono font-semibold text-[12px] cursor-pointer border-none"
                    style={{
                      background: selected ? 'linear-gradient(100deg,var(--color-violet),var(--color-fuchsia))' : isToday ? 'var(--color-tint-emerald)' : 'transparent',
                      color: selected ? '#fff' : isToday ? 'var(--color-emerald)' : 'var(--color-ink-body)',
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
