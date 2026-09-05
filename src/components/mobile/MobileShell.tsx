/**
 * Mobile shell. On a real phone (viewport ≤ 768px) it renders a full-screen app
 * (header + scroll area + bottom tab bar) with iOS safe-area insets. On desktop
 * it renders the same app inside a 392px phone-preview frame with dev controls.
 */
import type { ReactNode } from 'react';
import { Calendar, Lightbulb, Monitor, Music, Receipt, Smartphone, User, WifiHigh } from 'lucide-react';
import { useGuataca } from '../../store';
import { BrandMark, Pill, Segment } from '../ui';
import type { MobileTab } from '../../types';
import { MobileAgenda } from './MobileAgenda';
import { MobileRepertoire } from './MobileRepertoire';
import { MobileFund } from './MobileFund';
import { MobileBrainstorm } from './MobileBrainstorm';
import { MobileProfile } from './MobileProfile';

/* devPill(v): 30x26 icon toggle inside the device Segment */
const devPill = (active: boolean) => ({
  background: active ? '#7c3aed2e' : 'transparent',
  color: active ? '#a78bfa' : '#64748b',
});

/* mobTabStyle(v): bottom tab bar button */
function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-[5px] flex-1 pt-[9px] pb-1 border-none bg-transparent font-sans font-semibold text-[10px] cursor-pointer"
      style={{ color: active ? '#34d399' : '#475569' }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/** The actual mobile app: header + scroll area + bottom tab bar. */
function MobileApp() {
  const { t, bandName, balanceStr, state, setMobileTab } = useGuataca();
  const tab: MobileTab = state.mobileTab;

  return (
    <>
      {/* app header */}
      <div className="pt-[calc(env(safe-area-inset-top)+6px)] px-5 pb-3.5 flex items-center gap-[11px] flex-none border-b border-[#131c2e]">
        <BrandMark size={32} radius={10} icon={17} />
        <span className="min-w-0 flex-1">
          <span className="block font-display font-bold text-[15px] leading-none text-[#f1f5f9]">GUATACA</span>
          <span className="block text-[10.5px] text-[#64748b] mt-[3px] truncate-1">{bandName}</span>
        </span>
        <span className="font-mono font-semibold text-[12px] text-[#34d399] bg-[#34d3991c] py-[5px] px-2.5 rounded-[20px] flex-none">{balanceStr}</span>
      </div>

      {/* scroll area */}
      <div className="flex-1 overflow-y-auto pt-4 px-4 pb-[22px]">
        {tab === 'agenda' && <MobileAgenda />}
        {tab === 'repertoire' && <MobileRepertoire />}
        {tab === 'fund' && <MobileFund />}
        {tab === 'brainstorm' && <MobileBrainstorm />}
        {tab === 'profile' && <MobileProfile />}
      </div>

      {/* bottom tab bar */}
      <div className="flex-none border-t border-[#131c2e] bg-[#0b1220] flex pt-0 px-1.5 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        <TabButton active={tab === 'agenda'} onClick={() => setMobileTab('agenda')} icon={<Calendar size={21} strokeWidth={1.9} />} label={t.agenda} />
        <TabButton active={tab === 'repertoire'} onClick={() => setMobileTab('repertoire')} icon={<Music size={21} strokeWidth={1.9} />} label={t.repertoire} />
        <TabButton active={tab === 'fund'} onClick={() => setMobileTab('fund')} icon={<Receipt size={21} strokeWidth={1.9} />} label={t.fund} />
        <TabButton active={tab === 'brainstorm'} onClick={() => setMobileTab('brainstorm')} icon={<Lightbulb size={21} strokeWidth={1.9} />} label={t.brainstorm} />
        <TabButton active={tab === 'profile'} onClick={() => setMobileTab('profile')} icon={<User size={21} strokeWidth={1.9} />} label={t.profile} />
      </div>
    </>
  );
}

export function MobileShell() {
  const { lang, setLang, isAdmin, roleLabel, toggleRole, isDesktop, isMobile, setDevice, isMobileViewport } = useGuataca();

  /* Real phone: full-screen app, no frame or dev controls. */
  if (isMobileViewport) {
    return (
      <div className="h-dvh flex flex-col bg-[#020617] overflow-hidden">
        <MobileApp />
      </div>
    );
  }

  /* Desktop preview: control column + 392px phone frame. */
  return (
    <div
      className="min-h-screen flex items-start justify-center gap-[26px] pt-[22px] px-5 pb-7 flex-wrap"
      style={{ background: 'radial-gradient(900px 600px at 50% -8%,#2e1065 0%,#020617 62%)' }}
    >
      {/* ---- control column */}
      <div className="flex flex-col items-stretch gap-2.5 pt-1.5">
        <Segment style={{ background: '#0b1220cc' }}>
          <Pill active={lang === 'es'} onClick={() => setLang('es')}>ES</Pill>
          <Pill active={lang === 'en'} onClick={() => setLang('en')}>EN</Pill>
        </Segment>
        <button
          type="button"
          onClick={toggleRole}
          className="flex items-center gap-2 py-2 px-3 rounded-[10px] border font-sans font-semibold text-[12.5px] cursor-pointer whitespace-nowrap"
          style={{
            borderColor: isAdmin ? '#34d39955' : '#33415580',
            background: isAdmin ? '#34d39914' : '#0b1220',
            color: isAdmin ? '#6ee7b7' : '#94a3b8',
          }}
        >
          <span>{roleLabel}</span>
        </button>
        <Segment style={{ background: '#0b1220cc' }}>
          <button type="button" onClick={() => setDevice('desktop')} className="grid place-items-center w-[30px] h-[26px] rounded-[7px] border-none cursor-pointer" style={devPill(isDesktop)}>
            <Monitor size={15} strokeWidth={1.9} />
          </button>
          <button type="button" onClick={() => setDevice('mobile')} className="grid place-items-center w-[30px] h-[26px] rounded-[7px] border-none cursor-pointer" style={devPill(isMobile)}>
            <Smartphone size={15} strokeWidth={1.9} />
          </button>
        </Segment>
      </div>

      {/* ---- phone frame */}
      <div
        className="w-[392px] min-h-[520px] rounded-[46px] border-[9px] border-[#10182b] bg-[#020617] overflow-hidden flex flex-col relative flex-none"
        style={{ height: 'min(812px,calc(100vh - 56px))', boxShadow: '0 50px 90px -30px #000,0 0 0 1px #253349' }}
      >
        {/* status bar */}
        <div className="h-11 flex items-center justify-between px-[26px] font-sans font-semibold text-[12.5px] text-[#cbd5e1] flex-none">
          <span>9:41</span>
          <span className="absolute left-1/2 -translate-x-1/2 top-[9px] w-[104px] h-[26px] rounded-[16px] bg-[#10182b]" />
          <span className="flex gap-1.5 items-center">
            <WifiHigh size={15} strokeWidth={2} />
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="2" y="7" width="17" height="10" rx="2.5" />
              <path d="M21 11v2" />
              <rect x="4" y="9" width="11" height="6" rx="1" fill="currentColor" stroke="none" />
            </svg>
          </span>
        </div>

        <MobileApp />
      </div>
    </div>
  );
}
