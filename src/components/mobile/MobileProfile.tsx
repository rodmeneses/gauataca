/** Mobile "Perfil" tab: appearance + language, sign in/out, the signed-in member card + the full roster. */
import { LogOut, Pencil } from 'lucide-react';
import { useGuataca } from '../../store';
import { Pill, Segment } from '../ui';
import { ThemeToggle } from '../ui/ThemeToggle';

export function MobileProfile() {
  const { t, lang, setLang, signedIn, signOut, openSignIn, me, roleLabel, members, isAdmin, openMember } = useGuataca();
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2.5">
        <span className="font-display font-semibold text-[12px] tracking-[.08em] uppercase text-ink-muted">{t.appearance}</span>
        <ThemeToggle full />
      </section>

      <section className="flex flex-col gap-2.5">
        <span className="font-display font-semibold text-[12px] tracking-[.08em] uppercase text-ink-muted">{t.language}</span>
        <div className="flex items-center gap-2">
          <Segment className="flex-1" aria-label={t.language}>
            <Pill active={lang === 'es'} color="var(--color-emerald)" size="md" className="flex-1" onClick={() => setLang('es')}>ES</Pill>
            <Pill active={lang === 'en'} color="var(--color-emerald)" size="md" className="flex-1" onClick={() => setLang('en')}>EN</Pill>
          </Segment>
          <button
            type="button"
            onClick={signedIn ? signOut : openSignIn}
            className="flex items-center gap-2 min-h-[44px] py-0 px-4 rounded-xl border border-line bg-raised text-ink-body font-sans font-semibold text-[13px] cursor-pointer flex-none"
          >
            <LogOut size={16} strokeWidth={2} />
            {signedIn ? t.signOut : t.signIn}
          </button>
        </div>
      </section>

      <div className="bg-surface border border-line rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
        <span
          className="w-[66px] h-[66px] rounded-2xl border border-line-strong grid place-items-center font-display font-semibold text-[21px] text-violet-lighter"
          style={{ background: 'linear-gradient(145deg,var(--color-line),var(--color-raised))' }}
        >
          {me.initial}
        </span>
        <span>
          <span className="block font-display font-semibold text-[18px] leading-tight text-ink">{me.name}</span>
          <span className="block text-[13px] text-ink-muted mt-1.5">{roleLabel}</span>
        </span>
      </div>

      <ul className="flex flex-col gap-2.5 list-none m-0 p-0">
        {members.map((m) => (
          <li key={m.id} className="bg-surface border border-line rounded-xl flex items-center">
            <button
              type="button"
              onClick={() => openMember(m.id)}
              className="flex items-center gap-3 flex-1 min-w-0 min-h-[60px] text-left p-3.5 bg-transparent border-none cursor-pointer"
            >
              <span className="w-10 h-10 rounded-xl bg-line grid place-items-center font-display font-semibold text-[13px] text-ink-meta flex-none">{m.initial}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-sans font-semibold text-[15px] text-ink-base truncate">{m.short}</span>
                <span className="block text-[13px] text-ink-muted mt-0.5 truncate">{m.title}</span>
              </span>
              <span
                className="font-display font-semibold text-[11px] tracking-[.05em] uppercase whitespace-nowrap py-1 px-2 rounded-md flex-none"
                style={{ color: m.roleColor, background: m.roleBg }}
              >
                {m.roleLabel}
              </span>
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => openMember(m.id, true)}
                title={t.editInstruments}
                aria-label={`${t.editInstruments} — ${m.short}`}
                className="grid place-items-center w-11 h-11 mr-1.5 rounded-xl border border-line bg-raised text-ink-muted cursor-pointer flex-none"
              >
                <Pencil size={15} strokeWidth={2} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
