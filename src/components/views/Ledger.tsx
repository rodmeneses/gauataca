/**
 * Ledger & gear view — pool balance cards, the transactions table and the
 * equipment inventory grid (design lines 454–551).
 */
import { ArrowLeftRight, ExternalLink, Package, Plus } from 'lucide-react';
import { Badge, Button, Select } from '@/components/ui';
import { useGuataca } from '@/store';
import type { TxDate, TxFilter } from '@/types';

const TX_GRID = 'min-w-[800px] grid grid-cols-[120px_1fr_130px_150px_120px] gap-3';

export function Ledger() {
  const { t, isAdmin, balanceStr, incomeStr, expenseStr, txCount, tx, txFilter, txDate, setTxFilter, setTxDate, gear, gearValue, openNewTx, openNewGear, openCustody, contributions } = useGuataca();

  return (
    <div className="flex flex-col gap-5 animate-fade">
      {/* ---------------------------------------------------- headline cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-[14px]">
        <div className="bg-[linear-gradient(150deg,#0f172a,#0b1220)] border border-[#34d39933] rounded-2xl p-[22px]">
          <div className="font-display font-semibold text-[10.5px] tracking-[.12em] uppercase text-[#6ee7b7]">{t.poolBalance}</div>
          <div className="font-mono font-semibold text-[clamp(26px,3.4vw,38px)] leading-none text-emerald mt-[14px] tracking-[-.02em] whitespace-nowrap">{balanceStr}</div>
          <div className="text-[12px] text-ink-muted mt-[14px] leading-[1.6]">
            {t.treasurer}: Diego Salazar · {txCount} {t.movements}
          </div>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-[22px]">
          <div className="font-display font-semibold text-[10.5px] tracking-[.12em] uppercase text-ink-muted">{t.income}</div>
          <div className="font-mono font-semibold text-[clamp(19px,2.3vw,25px)] leading-none text-emerald mt-[14px] whitespace-nowrap">{incomeStr}</div>
          <div className="text-[12px] text-ink-dim mt-[14px]">{t.incomeHint}</div>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-[22px]">
          <div className="font-display font-semibold text-[10.5px] tracking-[.12em] uppercase text-ink-muted">{t.expense}</div>
          <div className="font-mono font-semibold text-[clamp(19px,2.3vw,25px)] leading-none text-red mt-[14px] whitespace-nowrap">{expenseStr}</div>
          <div className="text-[12px] text-ink-dim mt-[14px]">{t.expenseHint}</div>
        </div>
      </div>

      {/* ------------------------------------------------------ transactions */}
      <section>
        <div className="flex items-center gap-3 mb-[13px]">
          <h2 className="m-0 font-display font-semibold text-[15px] leading-none text-ink">{t.ledger}</h2>
          <span className="text-[12px] text-ink-muted whitespace-nowrap">— {t.subLedger}</span>
          {isAdmin && (
            <Button variant="primary" className="ml-auto py-[10px] px-[15px]" onClick={openNewTx}>
              <Plus size={15} strokeWidth={2.2} />
              {t.newTx}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3 mb-[13px]">
          <div className="flex items-center gap-[3px] bg-raised border border-line rounded-[10px] p-[3px]">
            {(['all', 'in', 'out'] as TxFilter[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTxFilter(k)}
                className={`py-[6px] px-[12px] rounded-[8px] font-sans font-semibold text-[12px] leading-[normal] cursor-pointer transition-colors ${
                  txFilter === k ? 'bg-surface text-ink-bright border border-line' : 'text-ink-meta border border-transparent hover:text-ink-body'
                }`}
              >
                {k === 'all' ? t.allMovements : k === 'in' ? t.income : t.expense}
              </button>
            ))}
          </div>
          <Select value={txDate} onChange={(e) => setTxDate(e.target.value as TxDate)} className="w-auto py-[6px] px-[10px] text-[12px]">
            <option value="all">{t.allTime}</option>
            <option value="30">{t.last30}</option>
            <option value="90">{t.last90}</option>
            <option value="365">{t.last12m}</option>
          </Select>
        </div>
        <div className="bg-surface border border-line rounded-[14px] overflow-x-auto">
          <div className={`${TX_GRID} py-3 px-[18px] bg-raised border-b border-line font-display font-semibold text-[10px] tracking-[.12em] uppercase text-ink-dim`}>
            <span>{t.date}</span>
            <span>{t.desc}</span>
            <span>{t.addedBy}</span>
            <span>{t.proof}</span>
            <span className="text-right">{t.amount}</span>
          </div>
          {tx.map((x) => (
            <div key={x.id} className={`${TX_GRID} py-[14px] px-[18px] border-b border-line-faint items-center hover:bg-[#0d1526]`}>
              <span className="font-mono font-medium text-[12px] text-ink-muted">{x.dateStr}</span>
              <span className="flex items-center gap-[10px] min-w-0">
                <span className="w-[22px] h-[22px] rounded-[7px] grid place-items-center flex-none font-mono font-semibold text-[12px]" style={{ background: x.bg, color: x.color }}>
                  {x.arrow}
                </span>
                <span className="min-w-0">
                  <span className="block font-sans font-medium text-[13.5px] text-ink-base">{x.desc}</span>
                  {(x.eventLabel || x.gearLabel) && (
                    <span className="flex items-center gap-[6px] mt-[3px]">
                      {x.eventLabel && (
                        <span className="inline-flex items-center font-sans font-semibold text-[10.5px] leading-[normal] text-[#a78bfa] bg-[#7c3aed1f] border border-[#7c3aed33] py-[2px] px-[7px] rounded-md">{x.eventLabel}</span>
                      )}
                      {x.gearLabel && (
                        <span className="inline-flex items-center font-sans font-semibold text-[10.5px] leading-[normal] text-[#38bdf8] bg-[#0ea5e91f] border border-[#0ea5e933] py-[2px] px-[7px] rounded-md">{x.gearLabel}</span>
                      )}
                    </span>
                  )}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-[22px] h-[22px] rounded-[7px] bg-line grid place-items-center font-display font-semibold text-[9.5px] text-ink-meta flex-none">{x.byInitial}</span>
                <span className="text-[12.5px] text-ink-meta">{x.by}</span>
              </span>
              <span>
                {x.hasProof && x.proof && (
                  x.proofIsImage ? (
                    <a href={x.proof} target="_blank" rel="noreferrer" className="inline-flex items-center gap-[7px] no-underline group">
                      <img src={x.proof} alt={x.proofKind} className="h-[40px] w-[40px] object-cover rounded-[8px] border border-[#1e293b] group-hover:border-[#34d39955]" />
                      <span className="font-sans font-semibold text-[11px] text-[#6ee7b7]">{x.proofKind}</span>
                    </a>
                  ) : (
                    <a
                      href={x.proof}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-[7px] font-sans font-semibold text-[11.5px] text-[#6ee7b7] border border-[#34d39944] bg-[#34d3990f] py-[6px] px-[10px] rounded-lg no-underline hover:bg-[#34d39922]"
                    >
                      <ExternalLink size={12} strokeWidth={2.1} />
                      {x.proofKind}
                    </a>
                  )
                )}
              </span>
              <span className="font-mono font-semibold text-[14.5px] text-right" style={{ color: x.color }}>{x.amountStr}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ contributions */}
      <section>
        <div className="flex items-center gap-3 mb-[13px]">
          <h2 className="m-0 font-display font-semibold text-[15px] leading-none text-ink">{t.contributions}</h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[14px]">
          {contributions.map((c) => (
            <article key={c.memberId} className="bg-surface border border-line rounded-[14px] p-[16px] flex items-center gap-[13px]">
              <span className="w-9 h-9 rounded-[10px] bg-raised border border-line-soft grid place-items-center font-display font-semibold text-[12px] text-ink-meta flex-none">{c.initial}</span>
              <div className="min-w-0 flex-1">
                <div className="font-sans font-semibold text-[13.5px] text-ink">{c.name}</div>
                <div className="font-mono font-medium text-[11.5px] text-ink-meta mt-[3px]">
                  {t.thisMonth} {c.monthStr} · {t.totalL} {c.totalStr}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- gear */}
      <section>
        <div className="flex items-center gap-3 mb-[13px]">
          <h2 className="m-0 font-display font-semibold text-[15px] leading-none text-ink">{t.gear}</h2>
          <span className="font-mono font-semibold text-[11.5px] text-ink-meta bg-raised border border-line py-1 px-[10px] rounded-[20px]">{gearValue}</span>
          {isAdmin && (
            <Button variant="primary" className="ml-auto py-[10px] px-[15px]" onClick={openNewGear}>
              <Plus size={15} strokeWidth={2.2} />
              {t.newGear}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-[14px]">
          {gear.map((g) => (
            <article key={g.id} className="bg-surface border border-line rounded-[14px] p-[17px] flex flex-col gap-[13px]">
              <div className="flex gap-3 items-start">
                <span className="w-9 h-9 rounded-[10px] bg-raised border border-line-soft grid place-items-center text-ink-meta flex-none">
                  <Package size={18} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="m-0 font-sans font-semibold text-[14px] leading-[1.35] text-ink">{g.name}</h3>
                  <div className="font-mono font-semibold text-[12px] text-ink-meta mt-[6px]">
                    {g.costStr} · {g.dateStr}
                  </div>
                </div>
                <Badge lg color={g.condColor} className="tracking-[.08em] flex-none" style={{ background: g.condBg }}>
                  {g.condLabel}
                </Badge>
              </div>
              <p className="m-0 text-[12.5px] text-ink-meta leading-[1.6]">{g.note}</p>
              {g.boughtBy && (
                <div className="flex items-center gap-[7px]">
                  <span className="w-[20px] h-[20px] rounded-md bg-[#0ea5e91f] grid place-items-center font-display font-semibold text-[9px] text-[#7dd3fc] flex-none">{g.boughtByInitial}</span>
                  <span className="font-sans font-medium text-[11.5px] text-ink-meta">{t.boughtBy}: {g.boughtBy}</span>
                </div>
              )}
              <div className="flex items-center gap-[10px] border-t border-line-soft pt-[13px]">
                <span className="w-[26px] h-[26px] rounded-lg bg-[#7c3aed24] grid place-items-center font-display font-semibold text-[10.5px] text-[#c4b5fd] flex-none">{g.holderInitial}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display font-semibold text-[9.5px] tracking-[.1em] uppercase text-ink-dim">{t.custodian}</span>
                  <span className="block font-sans font-semibold text-[12.5px] text-ink-body mt-[3px]">{g.holder}</span>
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => openCustody(g.id)}
                    className="flex items-center gap-[7px] py-2 px-[11px] rounded-[9px] border border-line bg-raised text-ink-meta font-sans font-semibold text-[11.5px] cursor-pointer hover:border-[#a78bfa55] hover:text-[#c4b5fd]"
                  >
                    <ArrowLeftRight size={13} strokeWidth={2} />
                    {t.transfer}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
