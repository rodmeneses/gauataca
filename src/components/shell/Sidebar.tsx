import type { ReactNode } from 'react';
import { Calendar, LayoutDashboard, Lightbulb, Music, Palette, Receipt, Users } from 'lucide-react';
import { useGuataca } from '../../store';
import type { View } from '../../types';
import { BrandMark, cx } from '../ui';

/**
 * Sidebar nav item. Below `lg` (tablet) the sidebar is a 64px icon rail: the label
 * and any trailing badge are hidden and the icon sits in a 44px hit target with a
 * `title`/`aria-label` so it stays reachable.
 */
function NavItem({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: ReactNode; label: string; badge?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'flex items-center gap-2.5 w-full min-h-[44px] rounded-[9px] border font-sans text-[13.5px] leading-none cursor-pointer text-left whitespace-nowrap transition-all duration-[140ms] justify-center lg:justify-start px-0 lg:px-[11px]',
        active
          ? 'border-violet/40 bg-[var(--color-tint-violet)] text-violet-pale font-semibold'
          : 'border-transparent bg-transparent text-ink-meta font-medium hover:text-ink-body',
      )}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
      {badge != null && <span className="ml-auto hidden lg:inline">{badge}</span>}
    </button>
  );
}

/** Sticky sidebar: 252px with labels on desktop, a 64px icon rail on tablet. */
export function Sidebar() {
  const { t, view, bandName, statUpcoming, statSongs, balanceStr, me, roleLabel, go } = useGuataca();
  const is = (v: View) => view === v;
  const upBadge = <span className="font-mono font-semibold text-[11px] leading-normal text-emerald bg-[var(--color-tint-emerald)] p-[2px_7px] rounded-[20px]">{statUpcoming}</span>;
  const songBadge = <span className="font-mono font-semibold text-[11px] leading-normal text-ink-muted">{statSongs}</span>;

  return (
    <aside className="bg-raised border-r border-line-soft flex flex-col sticky top-0 h-dvh">
      <div className="p-[18px_10px] lg:p-[22px_20px_18px] border-b border-line-soft flex gap-3 items-center justify-center lg:justify-start">
        <BrandMark />
        <div className="min-w-0 hidden lg:block">
          <div className="font-display font-bold text-[16px] leading-[1.1] text-ink tracking-[-.01em]">GUATACA</div>
          <div className="text-[11px] text-ink-muted truncate-1 mt-[3px]">{bandName}</div>
        </div>
      </div>

      <nav className="p-2 lg:p-[14px_12px] flex flex-col gap-[3px]">
        <div className="eyebrow-xs p-[6px_10px_8px] hidden lg:block">{t.navWork}</div>
        <NavItem active={is('dashboard')} onClick={() => go('dashboard')} icon={<LayoutDashboard size={18} strokeWidth={1.9} className="flex-none" />} label={t.dashboard} />
        <NavItem active={is('calendar')} onClick={() => go('calendar')} icon={<Calendar size={18} strokeWidth={1.9} className="flex-none" />} label={t.calendar} badge={upBadge} />
        <NavItem active={is('repertoire')} onClick={() => go('repertoire')} icon={<Music size={18} strokeWidth={1.9} className="flex-none" />} label={t.repertoire} badge={songBadge} />
        <NavItem active={is('ledger')} onClick={() => go('ledger')} icon={<Receipt size={18} strokeWidth={1.9} className="flex-none" />} label={t.ledger} />
        <NavItem active={is('brainstorm')} onClick={() => go('brainstorm')} icon={<Lightbulb size={18} strokeWidth={1.9} className="flex-none" />} label={t.brainstorm} />
        <div className="eyebrow-xs p-[16px_10px_8px] hidden lg:block">{t.navBand}</div>
        <NavItem active={is('members')} onClick={() => go('members')} icon={<Users size={18} strokeWidth={1.9} className="flex-none" />} label={t.members} />
        <NavItem active={is('system')} onClick={() => go('system')} icon={<Palette size={18} strokeWidth={1.9} className="flex-none" />} label={t.system} />
      </nav>

      <div className="mt-auto p-2 lg:p-[14px_14px_18px] border-t border-line-soft flex flex-col gap-3">
        <button
          type="button"
          onClick={() => go('ledger')}
          title={`${t.poolBalance}: ${balanceStr}`}
          className="text-left bg-surface border border-line rounded-[12px] p-2 lg:p-[13px_14px] cursor-pointer block w-full hover:border-emerald/40"
        >
          <div className="font-display font-semibold text-[10px] leading-none tracking-[.12em] uppercase text-ink-muted hidden lg:block">{t.poolBalance}</div>
          <div className="font-mono font-semibold text-[13px] lg:text-[22px] leading-none text-emerald lg:mt-2 text-center lg:text-left">{balanceStr}</div>
          <div className="text-[11px] text-ink-dim mt-[6px] hidden lg:block">{t.treasurer}: Diego S.</div>
        </button>
        <div className="flex items-center gap-[9px] p-[2px_2px] justify-center lg:justify-start">
          <div className="avatar w-7 h-7 rounded-[9px] text-violet-light flex-none">{me.initial}</div>
          <div className="min-w-0 flex-1 hidden lg:block">
            <div className="text-[12px] font-semibold text-ink-body truncate-1">{me.name}</div>
            <div className="text-[10.5px] text-ink-muted">{roleLabel}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
