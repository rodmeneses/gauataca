/**
 * Full-screen photo carousel. Shows one photo at a time with prev/next arrows,
 * keyboard arrows, and touch swipe. Opened from the event gallery and event tiles.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useGuataca } from '@/store';
import { cx } from '@/components/ui';

export function PhotoViewer({ photos, index, onClose }: {
  photos: { id: number; url: string }[];
  index: number;
  onClose: () => void;
}) {
  const { t } = useGuataca();
  const [i, setI] = useState(index);
  const [dir, setDir] = useState(1);
  const count = photos.length;
  const touchX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const go = useCallback((delta: number) => {
    if (count < 2) return;
    setDir(delta);
    setI((cur) => (cur + delta + count) % count);
  }, [count]);

  // Lock body scroll while the viewer is open; move focus to the close button.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Keyboard: arrows navigate, Escape closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  if (count === 0) return null;

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (dx < -48) go(1);
    else if (dx > 48) go(-1);
  };

  const photo = photos[i];

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-black/85 backdrop-blur-sm animate-fade-fast"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.media}
    >
      {/* top bar: counter + close */}
      <div
        className="flex items-center justify-between px-4 pb-2 pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))]"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-mono font-medium text-[12px] text-white/70">{i + 1} / {count}</span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="grid place-items-center w-10 h-10 rounded-[10px] border border-white/15 bg-white/10 text-white hover:bg-white/20 cursor-pointer"
        >
          <X size={18} strokeWidth={2.2} />
        </button>
      </div>

      {/* photo (swipe target) */}
      <div
        className="flex-1 min-h-0 flex items-center justify-center px-2 pb-2 select-none"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          key={i}
          src={photo.url}
          alt=""
          draggable={false}
          className={cx('max-w-full max-h-full object-contain rounded-lg', dir >= 0 ? 'animate-slide' : 'animate-slide-rev')}
        />
      </div>

      {/* prev / next arrows */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            aria-label={t.prevPhoto}
            className="absolute left-3 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 md:w-11 md:h-11 rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 cursor-pointer"
          >
            <ChevronLeft size={22} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(1); }}
            aria-label={t.nextPhoto}
            className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 md:w-11 md:h-11 rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 cursor-pointer"
          >
            <ChevronRight size={22} strokeWidth={2.2} />
          </button>
        </>
      )}

      {/* thumbnail strip */}
      {count > 1 && (
        <div className="flex justify-start md:justify-center gap-2 px-4 pb-4 pt-2 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
          {photos.map((p, n) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { setDir(n > i ? 1 : -1); setI(n); }}
              aria-label={`${t.photo} ${n + 1}`}
              className={cx(
                'w-12 h-12 rounded-[8px] overflow-hidden border cursor-pointer p-0 flex-none',
                n === i ? 'border-white/80' : 'border-white/20 opacity-60 hover:opacity-100',
              )}
            >
              <img src={p.url} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
