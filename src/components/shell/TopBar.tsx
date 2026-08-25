import { ArrowLeftRight, BookOpen, Monitor, Search, ShieldCheck, Smartphone } from 'lucide-react';
import { useBandSync } from '../../store';
import { Pill, Segment, cx } from '../ui';

/** Sticky desktop header: view title, palette trigger, ES/EN, role toggle, device switch, handoff (design lines 102–137). */
export function TopBar() {
  const { t, lang, isAdmin, isDesktop, isMobile, roleLabel, viewTitle, viewSub, openPalette, setLang, toggleRole, setDevice, toggleHandoff } = useBandSync();

  return (
    <header className="sticky top-0 z-30 bg-[#020617f2] backdrop-blur-[12px] border-b border-line-soft p-[14px_28px] flex items-center gap-[14px] flex-wrap">
      <div className="min-w-[200px] flex-[1_1_210px]">
        <h1 className="m-0 font-display font-semibold text-[19px] leading-[1.2] text-ink tracking-[-.015em] whitespace-nowrap">{viewTitle}</h1>
        <p className="m-[4px_0_0] text-[12.5px] text-ink-muted truncate-1">{viewSub}</p>
      </div>

      <button
        type="button"
        onClick={openPalette}
        className="flex items-center gap-[9px] p-[8px_12px] rounded-[10px] border border-line bg-raised text-ink-muted text-[13px] cursor-pointer flex-[1_1_150px] min-w-[150px] hover:border-[#334155] hover:text-[#94a3b8]"
      >
        <Search size={15} strokeWidth={2} />
        <span className="flex-1 text-left truncate-1">{t.searchPlaceholder}</span>
        <kbd className="font-mono font-medium text-[10.5px] leading-normal bg-line-soft border border-line-strong rounded-[5px] p-[2px_5px] text-ink-meta">⌘K</kbd>
      </button>

      <Segment>
        <Pill active={lang === 'es'} className="leading-normal" onClick={() => setLang('es')}>ES</Pill>
        <Pill active={lang === 'en'} className="leading-normal" onClick={() => setLang('en')}>EN</Pill>
      </Segment>

      <button
        type="button"
        onClick={toggleRole}
        className={cx(
          'flex items-center gap-2 p-[8px_12px] rounded-[10px] border font-sans font-semibold text-[12.5px] leading-normal cursor-pointer whitespace-nowrap',
          isAdmin ? 'border-[#34d39955] bg-[#34d39914] text-emerald-light' : 'border-[#33415580] bg-raised text-ink-meta',
        )}
      >
        <ShieldCheck size={15} strokeWidth={1.9} className="flex-none" />
        <span>{roleLabel}</span>
        <ArrowLeftRight size={13} strokeWidth={2} className="opacity-55" />
      </button>

      <Segment>
        <button
          type="button"
          onClick={() => setDevice('desktop')}
          title="Desktop"
          className={cx('grid place-items-center w-[30px] h-[26px] rounded-[7px] border-none cursor-pointer', isDesktop ? 'bg-[#7c3aed2e] text-violet-light' : 'bg-transparent text-ink-muted')}
        >
          <Monitor size={15} strokeWidth={1.9} />
        </button>
        <button
          type="button"
          onClick={() => setDevice('mobile')}
          title="Mobile"
          className={cx('grid place-items-center w-[30px] h-[26px] rounded-[7px] border-none cursor-pointer', isMobile ? 'bg-[#7c3aed2e] text-violet-light' : 'bg-transparent text-ink-muted')}
        >
          <Smartphone size={15} strokeWidth={1.9} />
        </button>
      </Segment>

      <button
        type="button"
        onClick={toggleHandoff}
        title="Handoff"
        className="grid place-items-center w-9 h-9 rounded-[10px] border border-[#7c3aed4d] bg-[#7c3aed1a] text-violet-light cursor-pointer flex-none hover:bg-[#7c3aed2e]"
      >
        <BookOpen size={16} strokeWidth={1.9} />
      </button>
    </header>
  );
}
