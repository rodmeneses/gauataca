/** Mobile "Fondo" tab: pool balance hero + "New movement" (admin) + in/out & date filters + transactions, contributions and the gear inventory. */
import { ArrowLeftRight, ExternalLink, Package, Plus } from 'lucide-react';
import { useGuataca } from '../../store';
import type { TxDate, TxFilter } from '../../types';

const SECTION = 'font-display font-semibold text-[12px] tracking-[.08em] uppercase text-ink-muted';

export function MobileFund() {
  const { t, isAdmin, balanceStr, incomeStr, expenseStr, tx, txFilter, txDate, setTxFilter, setTxDate, contributions, gear, gearValue, openNewTx, openNewGear, openCustody } = useGuataca();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="border border-emerald/30 rounded-2xl p-5 bg-surface">
          <div className="font-display font-semibold text-[12px] tracking-[.1em] uppercase text-emerald">{t.poolBalance}</div>
          <div className="font-mono font-semibold text-[32px] leading-none text-emerald mt-3">{balanceStr}</div>
          <div className="flex flex-wrap gap-y-1.5 gap-x-4 mt-3.5 font-mono font-medium text-[13px]">
            <span className="text-emerald whitespace-nowrap">↑ {incomeStr}</span>
            <span className="text-red whitespace-nowrap">↓ {expenseStr}</span>
          </div>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={openNewTx}
            className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-xl border-none text-white font-sans font-semibold text-[14px] cursor-pointer"
            style={{ background: 'linear-gradient(100deg,var(--color-violet),var(--color-fuchsia))' }}
          >
            <Plus size={16} strokeWidth={2.2} />
            {t.newTx}
          </button>
        )}

        {/* filters */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1 bg-raised border border-line rounded-xl p-1">
            {(['all', 'in', 'out'] as TxFilter[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTxFilter(k)}
                aria-pressed={txFilter === k}
                className={`flex-1 min-h-[40px] px-3 rounded-lg font-sans font-semibold text-[13px] leading-none cursor-pointer transition-colors ${
                  txFilter === k ? 'bg-surface text-ink border border-line' : 'text-ink-muted border border-transparent'
                }`}
              >
                {k === 'all' ? t.allMovements : k === 'in' ? t.income : t.expense}
              </button>
            ))}
          </div>
          <select
            value={txDate}
            onChange={(e) => setTxDate(e.target.value as TxDate)}
            aria-label={t.date}
            className="min-h-[44px] py-0 px-3 rounded-xl border border-line bg-raised text-ink-body font-sans font-medium text-[16px] outline-none w-full"
          >
            <option value="all">{t.allTime}</option>
            <option value="30">{t.last30}</option>
            <option value="90">{t.last90}</option>
            <option value="365">{t.last12m}</option>
          </select>
        </div>

        {tx.map((x) => (
          <div key={x.id} className="bg-surface border border-line rounded-xl py-3.5 px-4 flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <span
                className="w-7 h-7 rounded-lg grid place-items-center flex-none font-mono font-semibold text-[13px]"
                style={{ background: x.bg, color: x.color }}
              >
                {x.arrow}
              </span>
              <span className="min-w-0 flex-1 font-sans font-medium text-[14px] text-ink-base">{x.desc}</span>
              <span className="font-mono font-semibold text-[14px] flex-none" style={{ color: x.color }}>{x.amountStr}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[13px] text-ink-muted flex-1">{x.dateStr} · {x.by}</span>
              {x.hasProof && (
                <a
                  href={x.proof ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 min-h-[44px] py-0 px-3 rounded-lg border border-emerald/40 bg-[var(--color-tint-emerald)] text-emerald font-sans font-semibold text-[13px] no-underline"
                >
                  <ExternalLink size={14} strokeWidth={2.1} />
                  {t.viewProof}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* contributions */}
      <section className="flex flex-col gap-2.5">
        <div className={SECTION}>{t.contributions}</div>
        {contributions.map((c) => (
          <div key={c.memberId} className="bg-surface border border-line rounded-xl p-3.5 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-line grid place-items-center font-display font-semibold text-[13px] text-ink-meta flex-none">{c.initial}</span>
            <div className="min-w-0 flex-1">
              <div className="font-sans font-semibold text-[14px] text-ink-base">{c.name}</div>
              <div className="font-mono font-medium text-[13px] text-ink-muted mt-0.5">
                {t.thisMonth} {c.monthStr} · {t.totalL} {c.totalStr}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* gear */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className={SECTION}>{t.gear}</div>
          <span className="font-mono font-semibold text-[12px] text-ink-muted bg-raised border border-line py-1 px-2.5 rounded-full">{gearValue}</span>
          {isAdmin && (
            <button
              type="button"
              onClick={openNewGear}
              className="flex items-center gap-1.5 ml-auto min-h-[44px] py-0 px-3 rounded-lg border border-emerald/40 bg-[var(--color-tint-emerald)] text-emerald font-sans font-semibold text-[13px] cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.2} />
              {t.newGear}
            </button>
          )}
        </div>
        {gear.map((g) => (
          <div key={g.id} className="bg-surface border border-line rounded-xl p-3.5 flex flex-col gap-2.5">
            <div className="flex gap-3 items-start">
              <span className="w-10 h-10 rounded-xl bg-line grid place-items-center text-ink-muted flex-none">
                <Package size={18} strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-sans font-semibold text-[15px] leading-snug text-ink-base">{g.name}</div>
                <div className="font-mono font-semibold text-[13px] text-ink-muted mt-1.5">
                  {g.costStr} · {g.dateStr}
                </div>
              </div>
              <span
                className="font-display font-semibold text-[11px] tracking-[.05em] uppercase whitespace-nowrap py-1 px-2 rounded-md flex-none"
                style={{ color: g.condColor, background: g.condBg }}
              >
                {g.condLabel}
              </span>
            </div>
            {g.note && <p className="m-0 text-[13px] text-ink-muted leading-relaxed">{g.note}</p>}
            <div className="flex items-center gap-2.5 border-t border-line-soft pt-3">
              <span className="w-8 h-8 rounded-lg bg-[var(--color-tint-violet)] grid place-items-center font-display font-semibold text-[12px] text-violet-lighter flex-none">{g.holderInitial}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-display font-semibold text-[11px] tracking-[.08em] uppercase text-ink-muted">{t.custodian}</span>
                <span className="block font-sans font-semibold text-[14px] text-ink-body mt-0.5">{g.holder}</span>
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => openCustody(g.id)}
                  className="flex items-center gap-1.5 min-h-[44px] px-3 rounded-lg border border-line bg-raised text-ink-body font-sans font-semibold text-[13px] cursor-pointer"
                >
                  <ArrowLeftRight size={14} strokeWidth={2} />
                  {t.transfer}
                </button>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
