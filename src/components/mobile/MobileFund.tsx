/** Mobile "Fondo" tab: pool balance hero + "New movement" (admin) + in/out & date filters + transactions, contributions and the gear inventory. */
import { ArrowLeftRight, ExternalLink, Package, Plus } from 'lucide-react';
import { useGuataca } from '../../store';
import type { TxDate, TxFilter } from '../../types';

export function MobileFund() {
  const { t, isAdmin, balanceStr, incomeStr, expenseStr, tx, txFilter, txDate, setTxFilter, setTxDate, contributions, gear, gearValue, openNewTx, openNewGear, openCustody } = useGuataca();
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

      {/* filters */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-[3px] bg-[#0b1220] border border-[#1e293b] rounded-[10px] p-[3px] flex-1">
          {(['all', 'in', 'out'] as TxFilter[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTxFilter(k)}
              className={`flex-1 py-[7px] px-[10px] rounded-[8px] font-sans font-semibold text-[12px] leading-[normal] cursor-pointer transition-colors ${
                txFilter === k ? 'bg-[#0f172a] text-[#f1f5f9] border border-[#1e293b]' : 'text-[#64748b] border border-transparent'
              }`}
            >
              {k === 'all' ? t.allMovements : k === 'in' ? t.income : t.expense}
            </button>
          ))}
        </div>
        <select
          value={txDate}
          onChange={(e) => setTxDate(e.target.value as TxDate)}
          className="min-h-[38px] py-0 px-[10px] rounded-[10px] border border-[#1e293b] bg-[#0b1220] text-[#cbd5e1] font-sans font-medium text-[12px] outline-none flex-none"
        >
          <option value="all">{t.allTime}</option>
          <option value="30">{t.last30}</option>
          <option value="90">{t.last90}</option>
          <option value="365">{t.last12m}</option>
        </select>
      </div>

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

      {/* contributions */}
      <div className="mt-2">
        <div className="font-display font-semibold text-[10px] tracking-[.12em] uppercase text-[#64748b] mb-2">{t.contributions}</div>
        <div className="flex flex-col gap-2">
          {contributions.map((c) => (
            <div key={c.memberId} className="bg-[#0f172a] border border-[#1e293b] rounded-[13px] p-3.5 flex items-center gap-3">
              <span className="w-9 h-9 rounded-[10px] bg-[#1e293b] grid place-items-center font-display font-semibold text-[12px] text-[#94a3b8] flex-none">{c.initial}</span>
              <div className="min-w-0 flex-1">
                <div className="font-sans font-semibold text-[13.5px] text-[#e2e8f0]">{c.name}</div>
                <div className="font-mono font-medium text-[11.5px] text-[#64748b] mt-[3px]">
                  {t.thisMonth} {c.monthStr} · {t.totalL} {c.totalStr}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* gear */}
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="font-display font-semibold text-[10px] tracking-[.12em] uppercase text-[#64748b]">{t.gear}</div>
          <span className="font-mono font-semibold text-[11px] text-[#64748b] bg-[#0b1220] border border-[#1e293b] py-1 px-[10px] rounded-[20px]">{gearValue}</span>
          {isAdmin && (
            <button
              type="button"
              onClick={openNewGear}
              className="flex items-center gap-[6px] ml-auto min-h-[36px] py-0 px-3 rounded-[10px] border border-[#34d39944] bg-[#34d3990f] text-[#6ee7b7] font-sans font-semibold text-[12px] cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.2} />
              {t.newGear}
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {gear.map((g) => (
            <div key={g.id} className="bg-[#0f172a] border border-[#1e293b] rounded-[13px] p-3.5 flex flex-col gap-2.5">
              <div className="flex gap-3 items-start">
                <span className="w-9 h-9 rounded-[10px] bg-[#1e293b] grid place-items-center text-[#64748b] flex-none">
                  <Package size={18} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-sans font-semibold text-[14px] leading-[1.35] text-[#e2e8f0]">{g.name}</div>
                  <div className="font-mono font-semibold text-[12px] text-[#64748b] mt-[6px]">
                    {g.costStr} · {g.dateStr}
                  </div>
                </div>
                <span
                  className="font-display font-semibold text-[9px] tracking-[.08em] uppercase whitespace-nowrap py-1 px-2 rounded-[6px] flex-none"
                  style={{ color: g.condColor, background: g.condBg }}
                >
                  {g.condLabel}
                </span>
              </div>
              {g.note && <p className="m-0 text-[12.5px] text-[#64748b] leading-[1.6]">{g.note}</p>}
              <div className="flex items-center gap-[10px] border-t border-[#172033] pt-[11px]">
                <span className="w-[26px] h-[26px] rounded-lg bg-[#7c3aed24] grid place-items-center font-display font-semibold text-[10.5px] text-[#c4b5fd] flex-none">{g.holderInitial}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display font-semibold text-[9.5px] tracking-[.1em] uppercase text-[#475569]">{t.custodian}</span>
                  <span className="block font-sans font-semibold text-[12.5px] text-[#cbd5e1] mt-[3px]">{g.holder}</span>
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => openCustody(g.id)}
                    className="flex items-center gap-[7px] py-2 px-[11px] rounded-[9px] border border-[#1e293b] bg-[#0b1220] text-[#64748b] font-sans font-semibold text-[11.5px] cursor-pointer"
                  >
                    <ArrowLeftRight size={13} strokeWidth={2} />
                    {t.transfer}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
