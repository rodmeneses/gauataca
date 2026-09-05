/** Light / Dark / System appearance switch. Used in the desktop top bar and the mobile Profile tab. */
import { Monitor, Moon, Sun } from 'lucide-react';
import { useGuataca } from '../../store';
import type { ThemePref } from '../../lib/prefs';
import { Segment } from './index';

const OPTS: { value: ThemePref; icon: typeof Sun; key: 'themeLight' | 'themeDark' | 'themeSystem' }[] = [
  { value: 'light', icon: Sun, key: 'themeLight' },
  { value: 'dark', icon: Moon, key: 'themeDark' },
  { value: 'system', icon: Monitor, key: 'themeSystem' },
];

export function ThemeToggle({ full = false, className }: { full?: boolean; className?: string }) {
  const { t, theme, setTheme } = useGuataca();
  return (
    <Segment className={className} aria-label={t.appearance}>
      {OPTS.map(({ value, icon: Icon, key }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            title={t[key]}
            className={
              'flex items-center justify-center gap-1.5 rounded-[7px] border-none cursor-pointer font-sans font-semibold text-[12.5px] transition-colors ' +
              (full ? 'flex-1 min-h-[40px] px-2 ' : 'min-h-[34px] px-2.5 ') +
              (active ? 'bg-[color-mix(in_srgb,var(--color-violet)_22%,transparent)] text-violet-light' : 'bg-transparent text-ink-muted')
            }
          >
            <Icon size={15} strokeWidth={1.9} />
            {full && <span>{t[key]}</span>}
          </button>
        );
      })}
    </Segment>
  );
}
