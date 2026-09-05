/** Mobile "Perfil" tab: language toggle, sign in/out, the signed-in member card + the full roster (tap a card for details, edit instruments as admin). */
import { LogOut, Pencil } from 'lucide-react';
import { useBandSync } from '../../store';
import { Pill, Segment } from '../ui';

export function MobileProfile() {
  const { t, lang, setLang, signedIn, signOut, openSignIn, me, roleLabel, members, isAdmin, openMember } = useBandSync();
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-2">
        <Segment className="flex-1">
          <Pill active={lang === 'es'} color="#34d399" className="flex-1" onClick={() => setLang('es')}>ES</Pill>
          <Pill active={lang === 'en'} color="#34d399" className="flex-1" onClick={() => setLang('en')}>EN</Pill>
        </Segment>
        <button
          type="button"
          onClick={signedIn ? signOut : openSignIn}
          className="flex items-center gap-[7px] min-h-[34px] py-0 px-3 rounded-[10px] border border-[#1e293b] bg-[#0b1220] text-[#cbd5e1] font-sans font-semibold text-[12.5px] cursor-pointer flex-none"
        >
          <LogOut size={15} strokeWidth={2} />
          {signedIn ? t.signOut : t.signIn}
        </button>
      </div>

      <div className="bg-[#0f172a] border border-[#1e293b] rounded-[16px] p-5 flex flex-col items-center gap-3 text-center">
        <span
          className="w-[66px] h-[66px] rounded-[20px] border border-[#253349] grid place-items-center font-display font-semibold text-[21px] text-[#c4b5fd]"
          style={{ background: 'linear-gradient(145deg,#1e293b,#0b1220)' }}
        >
          {me.initial}
        </span>
        <span>
          <span className="block font-display font-semibold text-[18px] leading-[1.2] text-[#f1f5f9]">{me.name}</span>
          <span className="block text-[12.5px] text-[#64748b] mt-1.5">{roleLabel}</span>
        </span>
      </div>
      {members.map((m) => (
        <div
          key={m.id}
          onClick={() => openMember(m.id)}
          className="bg-[#0f172a] border border-[#1e293b] rounded-[13px] p-3.5 flex items-center gap-3 cursor-pointer"
        >
          <span className="w-9 h-9 rounded-[11px] bg-[#1e293b] grid place-items-center font-display font-semibold text-[12px] text-[#94a3b8] flex-none">{m.initial}</span>
          <span className="min-w-0 flex-1">
            <span className="block font-sans font-semibold text-[14px] text-[#e2e8f0]">{m.short}</span>
            <span className="block text-[11.5px] text-[#64748b] mt-[3px]">{m.title}</span>
          </span>
          <span
            className="font-display font-semibold text-[9px] tracking-[.09em] uppercase whitespace-nowrap py-1 px-2 rounded-[6px] flex-none"
            style={{ color: m.roleColor, background: m.roleBg }}
          >
            {m.roleLabel}
          </span>
          {isAdmin && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openMember(m.id, true); }}
              title={t.editInstruments}
              aria-label={t.editInstruments}
              className="grid place-items-center w-[30px] h-[30px] rounded-[9px] border border-[#1e293b] bg-[#0b1220] text-[#64748b] cursor-pointer flex-none"
            >
              <Pencil size={13} strokeWidth={2} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
