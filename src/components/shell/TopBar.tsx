import { BookOpen, LogIn, LogOut, Monitor, Search, ShieldCheck, Smartphone } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useGuataca } from '../../store';
import { Pill, Segment, cx } from '../ui';
import { ThemeToggle } from '../ui/ThemeToggle';

/** Sticky desktop header: view title, palette trigger, ES/EN, role toggle, device switch, handoff (design lines 102–137). */
export function TopBar() {
  const { t, lang, isAdmin, isDesktop, isMobile, viewTitle, viewSub, openPalette, setLang, setDevice, toggleHandoff, openSignIn } = useGuataca();
  const { user, profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[color-mix(in_srgb,var(--color-base)_94%,transparent)] backdrop-blur-[12px] border-b border-line-soft p-[14px_28px] flex items-center gap-[14px] flex-wrap">
      <div className="min-w-[200px] flex-[1_1_210px]">
        <h1 className="m-0 font-display font-semibold text-[19px] leading-[1.2] text-ink tracking-[-.015em] whitespace-nowrap">{viewTitle}</h1>
        <p className="m-[4px_0_0] text-[12.5px] text-ink-muted truncate-1">{viewSub}</p>
      </div>

      <button
        type="button"
        onClick={openPalette}
        aria-label={t.searchPlaceholder}
        className="flex items-center gap-[9px] p-[8px_12px] rounded-[10px] border border-line bg-raised text-ink-muted text-[13px] cursor-pointer hover:border-line-hover hover:text-ink-meta flex-none lg:flex-[1_1_150px] lg:min-w-[150px]"
      >
        <Search size={15} strokeWidth={2} />
        <span className="flex-1 text-left truncate-1 hidden lg:inline">{t.searchPlaceholder}</span>
        <kbd className="font-mono font-medium text-[10.5px] leading-normal bg-line-soft border border-line-strong rounded-[5px] p-[2px_5px] text-ink-meta hidden lg:inline">⌘K</kbd>
      </button>

      <Segment aria-label={t.language}>
        <Pill active={lang === 'es'} className="leading-normal" onClick={() => setLang('es')}>ES</Pill>
        <Pill active={lang === 'en'} className="leading-normal" onClick={() => setLang('en')}>EN</Pill>
      </Segment>

      <ThemeToggle />

      {user ? (
        <button
          type="button"
          onClick={signOut}
          className={cx(
            'flex items-center gap-2 p-[8px_12px] rounded-[10px] border font-sans font-semibold text-[12.5px] leading-normal cursor-pointer whitespace-nowrap',
            isAdmin ? 'border-emerald/40 bg-[var(--color-tint-emerald)] text-emerald' : 'border-line-hover bg-raised text-ink-meta',
          )}
        >
          <ShieldCheck size={15} strokeWidth={1.9} className="flex-none" />
          <span>{profile?.name ?? user.email}</span>
          <LogOut size={13} strokeWidth={2} className="opacity-55" />
        </button>
      ) : (
        <button
          type="button"
          onClick={openSignIn}
          className="flex items-center gap-2 p-[8px_12px] rounded-[10px] border border-violet/40 bg-[var(--color-tint-violet)] text-violet font-sans font-semibold text-[12.5px] leading-normal cursor-pointer whitespace-nowrap"
        >
          <LogIn size={15} strokeWidth={1.9} className="flex-none" />
          <span>{t.signIn}</span>
        </button>
      )}

      <Segment className="hidden lg:flex">
        <button
          type="button"
          onClick={() => setDevice('desktop')}
          title="Desktop"
          className={cx('grid place-items-center w-[30px] h-[26px] rounded-[7px] border-none cursor-pointer', isDesktop ? 'bg-[var(--color-tint-violet)] text-violet' : 'bg-transparent text-ink-muted')}
        >
          <Monitor size={15} strokeWidth={1.9} />
        </button>
        <button
          type="button"
          onClick={() => setDevice('mobile')}
          title="Mobile"
          className={cx('grid place-items-center w-[30px] h-[26px] rounded-[7px] border-none cursor-pointer', isMobile ? 'bg-[var(--color-tint-violet)] text-violet' : 'bg-transparent text-ink-muted')}
        >
          <Smartphone size={15} strokeWidth={1.9} />
        </button>
      </Segment>

      <button
        type="button"
        onClick={toggleHandoff}
        title="Handoff"
        className="hidden lg:grid place-items-center w-9 h-9 rounded-[10px] border border-violet/40 bg-[var(--color-tint-violet)] text-violet cursor-pointer flex-none hover:bg-[color-mix(in_srgb,var(--color-violet)_26%,transparent)]"
      >
        <BookOpen size={16} strokeWidth={1.9} />
      </button>
    </header>
  );
}
