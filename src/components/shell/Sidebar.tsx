import type { ReactNode } from 'react';
import { Calendar, LayoutDashboard, Lightbulb, Music, Palette, Receipt, Users } from 'lucide-react';
import { useGuataca } from '../../store';
import type { View } from '../../types';
import { BrandMark, cx } from '../ui';

/** Sidebar nav item — reproduces the design's `on(v)` style (renderVals line 2043). */
function NavItem({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex items-center gap-[10px] w-full p-[9px_11px] rounded-[9px] border font-sans text-[13.5px] leading-none cursor-pointer text-left whitespace-nowrap transition-all duration-[140ms] ease-[ease]',
        active
          ? 'border-[#7c3aed55] bg-[linear-gradient(100deg,#7c3aed24,#7c3aed0a)] text-[#ddd6fe] font-semibold'
          : 'border-transparent bg-transparent text-[#94a3b8] font-medium',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/** 252px sticky sidebar: brand, nav groups, pool balance and the signed-in member (design lines 39–99). */
export function Sidebar() {
  const { t, view, bandName, statUpcoming, statSongs, balanceStr, me, roleLabel, go } = useGuataca();
  const is = (v: View) => view === v;

  return (
    <aside className="bg-raised border-r border-line-soft flex flex-col sticky top-0 h-screen">
      <div className="p-[22px_20px_18px] border-b border-line-soft flex gap-3 items-center">
        <BrandMark />
        <div className="min-w-0">
          <div className="font-display font-bold text-[16px] leading-[1.1] text-ink tracking-[-.01em]">GUATACA</div>
          <div className="text-[11px] text-ink-muted truncate-1 mt-[3px]">{bandName}</div>
        </div>
      </div>

      <nav className="p-[14px_12px] flex flex-col gap-[3px]">
        <div className="eyebrow-xs p-[6px_10px_8px]">{t.navWork}</div>
        <NavItem active={is('dashboard')} onClick={() => go('dashboard')} icon={<LayoutDashboard size={17} strokeWidth={1.9} className="flex-none" />}>
          <span>{t.dashboard}</span>
        </NavItem>
        <NavItem active={is('calendar')} onClick={() => go('calendar')} icon={<Calendar size={17} strokeWidth={1.9} className="flex-none" />}>
          <span>{t.calendar}</span>
          <span className="ml-auto font-mono font-semibold text-[11px] leading-normal text-emerald bg-[#34d3991f] p-[2px_7px] rounded-[20px]">{statUpcoming}</span>
        </NavItem>
        <NavItem active={is('repertoire')} onClick={() => go('repertoire')} icon={<Music size={17} strokeWidth={1.9} className="flex-none" />}>
          <span>{t.repertoire}</span>
          <span className="ml-auto font-mono font-semibold text-[11px] leading-normal text-ink-muted">{statSongs}</span>
        </NavItem>
        <NavItem active={is('ledger')} onClick={() => go('ledger')} icon={<Receipt size={17} strokeWidth={1.9} className="flex-none" />}>
          <span>{t.ledger}</span>
        </NavItem>
        <NavItem active={is('brainstorm')} onClick={() => go('brainstorm')} icon={<Lightbulb size={17} strokeWidth={1.9} className="flex-none" />}>
          <span>{t.brainstorm}</span>
        </NavItem>
        <div className="eyebrow-xs p-[16px_10px_8px]">{t.navBand}</div>
        <NavItem active={is('members')} onClick={() => go('members')} icon={<Users size={17} strokeWidth={1.9} className="flex-none" />}>
          <span>{t.members}</span>
        </NavItem>
        <NavItem active={is('system')} onClick={() => go('system')} icon={<Palette size={17} strokeWidth={1.9} className="flex-none" />}>
          <span>{t.system}</span>
        </NavItem>
      </nav>

      <div className="mt-auto p-[14px_14px_18px] border-t border-line-soft flex flex-col gap-3">
        <button
          type="button"
          onClick={() => go('ledger')}
          className="text-left bg-[linear-gradient(160deg,#0f172a,#0b1220)] border border-line rounded-[12px] p-[13px_14px] cursor-pointer block w-full hover:border-[#34d39955]"
        >
          <div className="font-display font-semibold text-[10px] leading-none tracking-[.12em] uppercase text-ink-muted">{t.poolBalance}</div>
          <div className="font-mono font-semibold text-[22px] leading-none text-emerald mt-2">{balanceStr}</div>
          <div className="text-[11px] text-ink-dim mt-[6px]">{t.treasurer}: Diego S.</div>
        </button>
        <div className="flex items-center gap-[9px] p-[2px_2px]">
          <div className="avatar w-7 h-7 rounded-[9px] text-violet-light">{me.initial}</div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-semibold text-ink-body truncate-1">{me.name}</div>
            <div className="text-[10.5px] text-ink-muted">{roleLabel}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
