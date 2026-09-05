/**
 * Gear custody transfer dialog (design lines 1411–1427): pick the member who
 * now holds the item. The scrim does not close on click (as in the design).
 */
import { useGuataca } from '@/store';

export function CustodyDialog() {
  const { t, custody, custodyTargets, transferCustody, closeCustody } = useGuataca();
  if (!custody) return null;

  return (
    <div className="fixed inset-0 z-[85] bg-[#020617cc] backdrop-blur-[6px] flex items-center justify-center p-[32px_20px] animate-fade-fast">
      <div role="dialog" aria-modal="true" className="w-full max-w-[400px] bg-raised border border-line rounded-[18px] p-[22px] animate-rise">
        <div className="font-display font-semibold text-[16px] leading-normal text-ink-bright mb-[7px]">{t.transfer}</div>
        <div className="text-[12.5px] text-ink-muted leading-[1.6] mb-[18px]">
          {custody.name} — {t.custodian}: {custody.holder}
        </div>
        <div className="flex flex-col gap-[7px]">
          {custodyTargets.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => transferCustody(m.id)}
              className="flex items-center gap-3 w-full p-[12px_14px] rounded-[11px] border border-line bg-surface text-ink-body font-sans font-semibold text-[13.5px] leading-normal cursor-pointer text-left hover:border-[#a78bfa55]"
            >
              <span className="w-7 h-7 rounded-[9px] bg-line grid place-items-center font-display font-semibold text-[10.5px] leading-normal text-ink-meta flex-none">
                {m.initial}
              </span>
              <span>{m.short}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={closeCustody}
          className="w-full mt-[14px] p-[11px] rounded-[11px] border border-line bg-transparent text-ink-muted font-sans font-semibold text-[13px] leading-normal cursor-pointer"
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );
}
