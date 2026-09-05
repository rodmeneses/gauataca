/**
 * Mobile shell. On a real phone (viewport ≤ 767.98px) it renders a full-screen
 * app (header + scroll area + bottom tab bar) pinned with `position: fixed` so
 * the iOS Safari toolbar collapsing can never make the document scroll and push
 * the tab bar off-screen. On a larger viewport it renders the same app inside a
 * 392px phone-preview frame with the dev controls.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Calendar, Lightbulb, Monitor, Music, Receipt, Smartphone, User, WifiHigh } from 'lucide-react';
import { useGuataca } from '../../store';
import { BrandMark, Pill, Segment } from '../ui';
import { ThemeToggle } from '../ui/ThemeToggle';
import type { MobileTab } from '../../types';
import { MobileAgenda } from './MobileAgenda';
import { MobileRepertoire } from './MobileRepertoire';
import { MobileFund } from './MobileFund';
import { MobileBrainstorm } from './MobileBrainstorm';
import { MobileProfile } from './MobileProfile';

/* devPill(v): 30x26 icon toggle inside the device Segment */
const devPill = (active: boolean) => ({
  background: active ? 'color-mix(in srgb, var(--color-violet) 22%, transparent)' : 'transparent',
  color: active ? 'var(--color-violet-light)' : 'var(--color-ink-muted)',
});

/* One bottom-tab button — 44px+ target, 12px label, announces itself. */
function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 min-h-[52px] pt-2 pb-1 border-none bg-transparent font-sans font-semibold text-[11px] tracking-[-.01em] cursor-pointer transition-colors"
      style={{ color: active ? 'var(--color-emerald)' : 'var(--color-ink-meta)' }}
    >
      {icon}
      <span className="max-w-full truncate">{label}</span>
    </button>
  );
}

/** true while the on-screen keyboard is likely open (visual viewport much shorter than the layout viewport). */
function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setOpen(vv.height < window.innerHeight - 140);
    vv.addEventListener('resize', onResize);
    onResize();
    return () => vv.removeEventListener('resize', onResize);
  }, []);
  return open;
}

/** The actual mobile app: header + scroll area + bottom tab bar. */
function MobileApp({ banner }: { banner?: ReactNode }) {
  const { t, bandName, balanceStr, state, setMobileTab } = useGuataca();
  const tab: MobileTab = state.mobileTab;
  const keyboardOpen = useKeyboardOpen();

  const px = 'pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))]';

  return (
    <>
      {banner}

      {/* app header */}
      <div className={`pt-[calc(env(safe-area-inset-top)+8px)] pb-3 flex items-center gap-3 flex-none border-b border-line-faint bg-base ${px}`}>
        <BrandMark size={34} radius={11} icon={18} />
        <span className="min-w-0 flex-1">
          <span className="block font-display font-bold text-[16px] leading-tight text-ink">GUATACA</span>
          <span className="block text-[13px] text-ink-muted mt-0.5 truncate-1">{bandName}</span>
        </span>
        <span
          aria-label={`${t.poolBalance}: ${balanceStr}`}
          className="font-mono font-semibold text-[13px] text-emerald bg-[var(--color-tint-emerald)] min-h-[36px] inline-flex items-center py-1 px-3 rounded-full flex-none"
        >
          {balanceStr}
        </span>
      </div>

      {/* scroll area */}
      <div className={`flex-1 overflow-y-auto overscroll-contain pt-4 pb-6 ${px}`}>
        {tab === 'agenda' && <MobileAgenda />}
        {tab === 'repertoire' && <MobileRepertoire />}
        {tab === 'fund' && <MobileFund />}
        {tab === 'brainstorm' && <MobileBrainstorm />}
        {tab === 'profile' && <MobileProfile />}
      </div>

      {/* bottom tab bar */}
      <nav
        role="tablist"
        aria-label={t.navWork}
        hidden={keyboardOpen}
        className={`flex-none border-t border-line bg-raised flex px-1 pb-[calc(env(safe-area-inset-bottom)+6px)] pl-[max(4px,env(safe-area-inset-left))] pr-[max(4px,env(safe-area-inset-right))]`}
      >
        <TabButton active={tab === 'agenda'} onClick={() => setMobileTab('agenda')} icon={<Calendar size={22} strokeWidth={1.9} />} label={t.agenda} />
        <TabButton active={tab === 'repertoire'} onClick={() => setMobileTab('repertoire')} icon={<Music size={22} strokeWidth={1.9} />} label={t.repertoire} />
        <TabButton active={tab === 'fund'} onClick={() => setMobileTab('fund')} icon={<Receipt size={22} strokeWidth={1.9} />} label={t.fund} />
        <TabButton active={tab === 'brainstorm'} onClick={() => setMobileTab('brainstorm')} icon={<Lightbulb size={22} strokeWidth={1.9} />} label={t.brainstorm} />
        <TabButton active={tab === 'profile'} onClick={() => setMobileTab('profile')} icon={<User size={22} strokeWidth={1.9} />} label={t.profile} />
      </nav>
    </>
  );
}

export function MobileShell({ banner }: { banner?: ReactNode }) {
  const { lang, setLang, isAdmin, roleLabel, toggleRole, isDesktop, isMobile, setDevice, isMobileViewport } = useGuataca();

  /* Real phone: full-screen app pinned with position:fixed (survives the iOS toolbar). */
  if (isMobileViewport) {
    return (
      <div className="fixed inset-0 flex flex-col bg-base overflow-hidden overscroll-none">
        <MobileApp banner={banner} />
      </div>
    );
  }

  /* Larger viewport: control column + 392px phone frame. */
  return (
    <div
      className="min-h-screen flex items-start justify-center gap-[26px] pt-[22px] px-5 pb-7 flex-wrap"
      style={{ background: 'radial-gradient(900px 600px at 50% -8%,color-mix(in srgb,var(--color-violet) 22%,var(--color-base)) 0%,var(--color-base) 62%)' }}
    >
      {/* ---- control column */}
      <div className="flex flex-col items-stretch gap-2.5 pt-1.5">
        <Segment style={{ background: 'var(--color-raised)' }} aria-label={lang === 'es' ? 'Idioma' : 'Language'}>
          <Pill active={lang === 'es'} onClick={() => setLang('es')}>ES</Pill>
          <Pill active={lang === 'en'} onClick={() => setLang('en')}>EN</Pill>
        </Segment>
        <ThemeToggle />
        <button
          type="button"
          onClick={toggleRole}
          className="flex items-center gap-2 py-2 px-3 rounded-[10px] border font-sans font-semibold text-[12.5px] cursor-pointer whitespace-nowrap"
          style={{
            borderColor: isAdmin ? 'color-mix(in srgb, var(--color-emerald) 40%, transparent)' : 'var(--color-line-hover)',
            background: isAdmin ? 'var(--color-tint-emerald)' : 'var(--color-raised)',
            color: isAdmin ? 'var(--color-emerald)' : 'var(--color-ink-meta)',
          }}
        >
          <span>{roleLabel}</span>
        </button>
        <Segment style={{ background: 'var(--color-raised)' }}>
          <button type="button" aria-label="Desktop preview" onClick={() => setDevice('desktop')} className="grid place-items-center w-[30px] h-[26px] rounded-[7px] border-none cursor-pointer" style={devPill(isDesktop)}>
            <Monitor size={15} strokeWidth={1.9} />
          </button>
          <button type="button" aria-label="Mobile preview" onClick={() => setDevice('mobile')} className="grid place-items-center w-[30px] h-[26px] rounded-[7px] border-none cursor-pointer" style={devPill(isMobile)}>
            <Smartphone size={15} strokeWidth={1.9} />
          </button>
        </Segment>
      </div>

      {/* ---- phone frame */}
      <div
        className="w-[392px] min-h-[520px] rounded-[46px] border-[9px] border-shell bg-base overflow-hidden flex flex-col relative flex-none"
        style={{ height: 'min(812px,calc(100vh - 56px))', boxShadow: 'var(--shadow-panel), 0 0 0 1px var(--color-line-strong)' }}
      >
        {/* status bar */}
        <div className="h-11 flex items-center justify-between px-[26px] font-sans font-semibold text-[12.5px] text-ink-body flex-none">
          <span>9:41</span>
          <span className="absolute left-1/2 -translate-x-1/2 top-[9px] w-[104px] h-[26px] rounded-[16px] bg-shell" />
          <span className="flex gap-1.5 items-center">
            <WifiHigh size={15} strokeWidth={2} />
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="2" y="7" width="17" height="10" rx="2.5" />
              <path d="M21 11v2" />
              <rect x="4" y="9" width="11" height="6" rx="1" fill="currentColor" stroke="none" />
            </svg>
          </span>
        </div>

        <MobileApp banner={banner} />
      </div>
    </div>
  );
}
