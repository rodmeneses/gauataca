/**
 * Shared primitives. Values are copied from the design verbatim — do not "improve" them.
 * Views compose these plus Tailwind utilities (arbitrary values allowed, e.g. text-[13.5px]).
 */
import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { X } from 'lucide-react';

const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

/* ------------------------------------------------------------------ Badge */
/** 9.5px uppercase status chip. `color` is the text color; bg is the 11% tint. */
export function Badge({ color, children, lg, className, style }: { color: string; children: ReactNode; lg?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <span className={cx('badge', lg && 'badge-lg', className)} style={{ color, background: color + '1c', ...style }}>
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
  const color = tone === 'muted' ? '#94a3b8' : tone === 'violet' ? '#a78bfa' : '#c4b5fd';
  const bg = tone === 'brand' ? 'linear-gradient(145deg,#1e293b,#0b1220)' : '#1e293b';
  return (
    <span className={cx('avatar', className)} style={{ width: size, height: size, borderRadius: radius ?? Math.round(size * 0.32), fontSize: fs, color, background: bg, border: tone === 'brand' ? '1px solid #253349' : undefined, ...style }}>
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
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = hc + '66'; e.currentTarget.style.background = hc + '14'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e293b'; e.currentTarget.style.background = '#0b1220'; }}
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
      className={cx('grid place-items-center border border-line bg-surface text-ink-meta hover:text-ink hover:border-ink-faint flex-none', size === 34 ? 'w-[34px] h-[34px] rounded-[10px]' : 'w-8 h-8 rounded-[9px]', className)}
    >
      <X size={size === 34 ? 16 : 15} strokeWidth={2.2} />
    </button>
  );
}

/* ------------------------------------------------------------------ Field */
export function Field({ label, children, className, labelClassName, labelStyle }: { label: ReactNode; children: ReactNode; className?: string; labelClassName?: string; labelStyle?: CSSProperties }) {
  return (
    <label className={cx('block', className)}>
      <span className={cx('field-label', labelClassName)} style={labelStyle}>{label}</span>
      {children}
    </label>
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
 * Fixed scrim + centered card. `align="top"` = 44px top padding + scrollable (event / thread modals).
 * Clicking the scrim closes; clicks inside the card do not.
 */
export function Modal({ onClose, maxWidth, align = 'center', z = 80, children, cardClassName, cardStyle, scrimStyle }: {
  onClose: () => void;
  maxWidth: number;
  align?: 'top' | 'center';
  z?: number;
  children: ReactNode;
  cardClassName?: string;
  cardStyle?: CSSProperties;
  scrimStyle?: CSSProperties;
}) {
  return (
    <div
      className={cx('overlay animate-fade-fast', align === 'top' ? 'items-start overflow-y-auto py-11 px-5' : 'items-center py-8 px-5')}
      style={{ zIndex: z, ...scrimStyle }}
      onClick={onClose}
    >
      <div className={cx('modal-card', cardClassName)} style={{ maxWidth, ...cardStyle }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
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

/* -------------------------------------------------------------- BrandMark */
/** Violet gradient tile with the music-note glyph (sidebar + phone header + tour). */
export function BrandMark({ size = 38, radius = 11, icon = 20 }: { size?: number; radius?: number; icon?: number }) {
  return (
    <span
      className="grid place-items-center flex-none"
      style={{ width: size, height: size, borderRadius: radius, background: 'linear-gradient(145deg,#8b5cf6,#6d28d9)', boxShadow: size >= 36 ? '0 0 0 1px #a78bfa44,0 6px 18px -6px #7c3aedaa' : undefined }}
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
export function Segment({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={cx('flex bg-raised border border-line rounded-[10px] p-[3px] gap-[2px]', className)} style={style}>
      {children}
    </div>
  );
}

/** Pill button inside a Segment / chip row. `color` = active accent (default violet). */
export function Pill({ active, color = '#7c3aed', activeText, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean; color?: string; activeText?: string }) {
  return (
    <button
      type="button"
      className={cx('py-[5px] px-[11px] rounded-[7px] border-none font-mono font-semibold text-[11.5px] tracking-[.03em] whitespace-nowrap cursor-pointer', className)}
      style={{ background: active ? color + '2e' : 'transparent', color: active ? (activeText ?? (color === '#7c3aed' ? '#a78bfa' : color)) : '#64748b' }}
      {...rest}
    >
      {children}
    </button>
  );
}

export { cx };
export { DatePicker } from './DatePicker';
