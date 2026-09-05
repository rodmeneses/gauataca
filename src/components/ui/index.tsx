/**
 * Shared primitives. Values are copied from the design verbatim — do not "improve" them.
 * Views compose these plus Tailwind utilities (arbitrary values allowed, e.g. text-[13.5px]).
 */
import { useEffect, useRef, type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { X } from 'lucide-react';
import { useMediaQuery } from '../../lib/useMediaQuery';

/** Lock body scroll (ref-counted) + trap focus inside `ref` while a dialog is open. */
let scrollLocks = 0;
function useDialogChrome(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const prevActive = document.activeElement as HTMLElement | null;
    if (scrollLocks++ === 0) {
      const sbw = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;
    }
    const node = ref.current;
    const focusable = () => node ? Array.from(node.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter((el) => el.offsetParent !== null) : [];
    (focusable()[0] ?? node)?.focus?.();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !node) return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    node?.addEventListener('keydown', onKey);
    return () => {
      node?.removeEventListener('keydown', onKey);
      if (--scrollLocks === 0) { document.body.style.overflow = ''; document.body.style.paddingRight = ''; }
      prevActive?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

/* ------------------------------------------------------------------ Badge */
/** Uppercase status chip. `color` is the text color (any CSS colour incl. `var(--color-*)`); bg is a ~12% wash. */
export function Badge({ color, children, lg, className, style }: { color: string; children: ReactNode; lg?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <span className={cx('badge', lg && 'badge-lg', className)} style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)`, ...style }}>
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- Eyebrow */
export function Eyebrow({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={cx('eyebrow', className)} style={style}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------- Card */
export function Card({ children, className, style, as: Tag = 'div' }: { children: ReactNode; className?: string; style?: CSSProperties; as?: 'div' | 'section' | 'article' }) {
  return (
    <Tag className={cx('card', className)} style={style}>
      {children}
    </Tag>
  );
}

/* ----------------------------------------------------------------- Button */
export type ButtonVariant = 'primary' | 'brand' | 'ghost' | 'surface' | 'quiet' | 'gradient';
export function Button({ variant = 'ghost', className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button type="button" className={cx('btn', `btn-${variant}`, className)} {...rest}>
      {children}
    </button>
  );
}

/* ----------------------------------------------------------------- Avatar */
/** Initials tile. size in px; tone changes the text color (violet for "me"/custodians). */
export function Avatar({ initial, size = 28, radius, tone = 'muted', className, style }: { initial: string; size?: number; radius?: number; tone?: 'muted' | 'violet' | 'brand'; className?: string; style?: CSSProperties }) {
  const fs = Math.round(size * 0.4);
  const color = tone === 'muted' ? 'var(--color-ink-meta)' : tone === 'violet' ? 'var(--color-violet-light)' : 'var(--color-violet-lighter)';
  const bg = tone === 'brand' ? 'linear-gradient(145deg,var(--color-line),var(--color-raised))' : 'var(--color-line)';
  return (
    <span className={cx('avatar', className)} style={{ width: size, height: size, borderRadius: radius ?? Math.round(size * 0.32), fontSize: fs, color, background: bg, border: tone === 'brand' ? '1px solid var(--color-line-strong)' : undefined, ...style }}>
      {initial}
    </span>
  );
}

/* --------------------------------------------------------------- IconLink */
/** 44px square external link with a colored icon (chart / YouTube / Spotify / recording). */
export function IconLink({ href, color, title, hoverColor, children, className, style }: { href: string; color: string; title?: string; hoverColor?: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  const hc = hoverColor ?? color;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={title}
      className={cx('icon-box group/il', className)}
      style={{ color, ...style }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `color-mix(in srgb, ${hc} 45%, transparent)`; e.currentTarget.style.background = `color-mix(in srgb, ${hc} 12%, transparent)`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; }}
    >
      {children}
    </a>
  );
}

/* ------------------------------------------------------------- CloseButton */
export function CloseButton({ onClick, size = 34, className }: { onClick: () => void; size?: 32 | 34; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className={cx('grid place-items-center border border-line bg-surface text-ink-meta hover:text-ink hover:border-line-hover flex-none min-w-[44px] min-h-[44px]', size === 34 ? 'w-11 h-11 rounded-[11px]' : 'w-10 h-10 rounded-[10px]', className)}
    >
      <X size={size === 34 ? 18 : 16} strokeWidth={2.2} />
    </button>
  );
}

/* ------------------------------------------------------------------ Field */
export function Field({ label, children, className, labelClassName, labelStyle, as: Tag = 'label' }: { label: ReactNode; children: ReactNode; className?: string; labelClassName?: string; labelStyle?: CSSProperties; as?: 'label' | 'div' }) {
  return (
    <Tag className={cx('block', className)}>
      <span className={cx('field-label', labelClassName)} style={labelStyle}>{label}</span>
      {children}
    </Tag>
  );
}

export function Input({ mono, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  return <input className={cx('input', mono && 'input-mono', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx('input', className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx('input resize-y', className)} {...rest} />;
}

/* ------------------------------------------------------------------ Modal */
/**
 * Scrim + dialog. On a phone-sized viewport (or coarse pointer) it slides up as a
 * bottom sheet; on larger screens it is a centered card. Either way the overlay
 * scrolls when the content is taller than the viewport (the old `align="center"`
 * branch clipped tall forms with no way to scroll). Body scroll is locked and
 * focus is trapped while it is open. Clicking the scrim closes; inside clicks do not.
 */
export function Modal({ onClose, maxWidth, align = 'center', z = 80, labelledBy, children, cardClassName, cardStyle, scrimStyle }: {
  onClose: () => void;
  maxWidth: number;
  align?: 'top' | 'center';
  z?: number;
  labelledBy?: string;
  children: ReactNode;
  cardClassName?: string;
  cardStyle?: CSSProperties;
  scrimStyle?: CSSProperties;
}) {
  const sheet = useMediaQuery('(max-width: 767.98px), (pointer: coarse)');
  const cardRef = useRef<HTMLDivElement>(null);
  useDialogChrome(cardRef);

  return (
    <div
      className={cx(
        'overlay animate-fade-fast',
        sheet ? 'items-end overflow-y-auto' : align === 'top' ? 'items-start overflow-y-auto py-11 px-5' : 'items-center overflow-y-auto py-8 px-5',
      )}
      style={{ zIndex: z, ...scrimStyle }}
      onClick={onClose}
    >
      <div
        ref={cardRef}
        tabIndex={-1}
        className={cx(
          'modal-card',
          sheet
            ? 'w-full rounded-b-none max-h-[92dvh] overflow-y-auto overscroll-contain pb-[max(20px,env(safe-area-inset-bottom))] animate-sheet'
            : 'my-auto',
          cardClassName,
        )}
        style={{ maxWidth: sheet ? 560 : maxWidth, ...cardStyle }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {sheet && <span aria-hidden className="mx-auto mt-2.5 mb-0.5 h-1 w-10 rounded-full bg-line-hover flex-none" />}
        {children}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- Spotify icon */
/** Custom glyph used by the design (lucide has no Spotify icon). */
export function SpotifyIcon({ size = 19, strokeWidth = 1.8, className }: { size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M7 9.5c3.5-1 7-.6 10 1" />
      <path d="M7.5 13c2.8-.8 5.6-.4 8 1.2" />
      <path d="M8 16.2c2.2-.6 4.4-.3 6.3 1" />
    </svg>
  );
}

/* ----------------------------------------------------------- Apple Music */
/** Custom glyph (lucide has no Apple Music icon) — a beamed note. */
export function AppleMusicIcon({ size = 19, strokeWidth = 1.8, className }: { size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

/* -------------------------------------------------------------- BrandMark */
/** Violet gradient tile with the music-note glyph (sidebar + phone header + tour). */
export function BrandMark({ size = 38, radius = 11, icon = 20 }: { size?: number; radius?: number; icon?: number }) {
  return (
    <span
      className="grid place-items-center flex-none"
      style={{ width: size, height: size, borderRadius: radius, background: 'linear-gradient(145deg,var(--color-violet),var(--color-violet-deeper))', boxShadow: size >= 36 ? '0 0 0 1px color-mix(in srgb,var(--color-violet-light) 27%,transparent),0 6px 18px -6px color-mix(in srgb,var(--color-violet-deep) 67%,transparent)' : undefined }}
    >
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="#f5f3ff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    </span>
  );
}

/* ---------------------------------------------------------------- Segment */
/** Pill group container (ES/EN, Upcoming/History, device switch). */
export function Segment({ children, className, style, ...rest }: { children: ReactNode; className?: string; style?: CSSProperties } & Pick<HTMLAttributes<HTMLDivElement>, 'aria-label' | 'role'>) {
  return (
    <div className={cx('flex bg-raised border border-line rounded-[10px] p-[3px] gap-[2px]', className)} style={style} {...rest}>
      {children}
    </div>
  );
}

/**
 * Pill button inside a Segment / chip row. `color` = active accent (any CSS color;
 * defaults to the brand violet token). `size="md"` is the 44px touch target for mobile.
 */
export function Pill({ active, color = 'var(--color-violet-light)', activeText, size = 'sm', className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean; color?: string; activeText?: string; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      className={cx(
        'rounded-[7px] border-none font-mono font-semibold tracking-[.03em] whitespace-nowrap cursor-pointer transition-colors',
        size === 'md' ? 'min-h-[44px] px-3.5 text-[13px]' : 'py-[5px] px-[11px] text-[11.5px]',
        className,
      )}
      style={{
        background: active ? `color-mix(in srgb, ${color} 22%, transparent)` : 'transparent',
        color: active ? (activeText ?? color) : 'var(--color-ink-muted)',
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export { cx };
export { DatePicker } from './DatePicker';
