/** Mobile "Fondo" tab: pool balance hero + "New movement" (admin) + every transaction with its proof link. */
import { ExternalLink, Plus } from 'lucide-react';
import { useBandSync } from '../../store';

export function MobileFund() {
  const { t, isAdmin, balanceStr, incomeStr, expenseStr, tx, openNewTx } = useBandSync();
  return (
    <div className="flex flex-col gap-3">
      <div className="border border-[#34d39933] rounded-[16px] p-[19px]" style={{ background: 'linear-gradient(150deg,#0f172a,#0b1220)' }}>
        <div className="font-display font-semibold text-[10px] tracking-[.12em] uppercase text-[#6ee7b7]">{t.poolBalance}</div>
        <div className="font-mono font-semibold text-[32px] leading-none text-[#34d399] mt-3">{balanceStr}</div>
        <div className="flex flex-wrap gap-y-1.5 gap-x-4 mt-[13px] font-mono font-medium text-[12px]">
          <span className="text-[#34d399] whitespace-nowrap">↑ {incomeStr}</span>
          <span className="text-[#f87171] whitespace-nowrap">↓ {expenseStr}</span>
        </div>
      </div>
      {isAdmin && (
        <button
          type="button"
          onClick={openNewTx}
          className="flex items-center justify-center gap-[7px] w-full min-h-[48px] rounded-[13px] border-none text-white font-sans font-semibold text-[13.5px] cursor-pointer"
          style={{ background: 'linear-gradient(100deg,#8b5cf6,#d946ef)' }}
        >
          <Plus size={16} strokeWidth={2.2} />
          {t.newTx}
        </button>
      )}
      {tx.map((x) => (
        <div key={x.id} className="bg-[#0f172a] border border-[#1e293b] rounded-[13px] py-[13px] px-[14px] flex flex-col gap-2.5">
          <div className="flex items-center gap-[11px]">
            <span
              className="w-[26px] h-[26px] rounded-[8px] grid place-items-center flex-none font-mono font-semibold text-[13px]"
              style={{ background: x.bg, color: x.color }}
            >
              {x.arrow}
            </span>
            <span className="min-w-0 flex-1 font-sans font-medium text-[13.5px] text-[#e2e8f0]">{x.desc}</span>
            <span className="font-mono font-semibold text-[14px] flex-none" style={{ color: x.color }}>{x.amountStr}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-[#475569] flex-1">{x.dateStr} · {x.by}</span>
            {x.hasProof && (
              <a
                href={x.proof ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 min-h-[36px] py-0 px-3 rounded-[10px] border border-[#34d39944] bg-[#34d3990f] text-[#6ee7b7] font-sans font-semibold text-[11.5px] no-underline"
              >
                <ExternalLink size={12} strokeWidth={2.1} />
                {t.viewProof}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
