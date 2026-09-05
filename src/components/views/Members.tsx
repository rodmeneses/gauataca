/**
 * Members view — musician profile cards (design lines 589–635).
 * Card: avatar + name/title + role badge, instruments with proficiency bars,
 * vocal chips, and a footer with the join date and "view details".
 */
import { Pencil } from 'lucide-react';
import { Badge } from '@/components/ui';
import { useGuataca } from '@/store';

export function Members() {
  const { t, isAdmin, members, openMember } = useGuataca();

  return (
    <div className="flex flex-col gap-4 animate-fade">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(330px,1fr))] gap-[14px]">
      {members.map((m) => (
        <article key={m.id} className="bg-surface border border-line rounded-[14px] p-[19px] flex flex-col gap-4">
          <div className="flex gap-[13px] items-center">
            <span className="w-[46px] h-[46px] rounded-[13px] bg-[linear-gradient(145deg,var(--color-line),var(--color-raised))] border border-line-strong grid place-items-center font-display font-semibold text-[15px] text-violet-lighter flex-none">
              {m.initial}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="m-0 font-display font-semibold text-[15.5px] leading-[1.25] text-ink">{m.name}</h3>
              <div className="text-[12px] text-ink-muted mt-[5px]">{m.title}</div>
            </div>
            <Badge lg color={m.roleColor} className="flex-none" style={{ background: m.roleBg }}>
              {m.roleLabel}
            </Badge>
          </div>

          <div>
            <div className="font-display font-semibold text-[10px] tracking-[.12em] uppercase text-ink-dim mb-[10px]">{t.instruments}</div>
            <div className="flex flex-col gap-[10px]">
              {m.instruments.map((i) => (
                <div key={i.name}>
                  <div className="flex justify-between items-baseline mb-[6px]">
                    <span className="font-sans font-medium text-[13px] text-ink-body">{i.name}</span>
                    <span className="font-mono font-semibold text-[10.5px] text-ink-muted">{i.level}</span>
                  </div>
                  <div className="h-[5px] rounded-[3px] bg-line-soft overflow-hidden">
                    <div className="h-[5px] rounded-[3px]" style={{ background: i.color, width: i.pct }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="font-display font-semibold text-[10px] tracking-[.12em] uppercase text-ink-dim mb-[9px]">{t.vocalsL}</div>
            <div className="flex gap-[7px] flex-wrap">
              {m.vocals.map((v) => (
                <span
                  key={v.label}
                  className="font-sans font-medium text-[11.5px] text-ink-meta bg-raised border border-line-soft py-[5px] px-[10px] rounded-[20px] whitespace-nowrap"
                >
                  {v.label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-line-soft pt-[14px] mt-auto">
            <span className="text-[11.5px] text-ink-dim whitespace-nowrap">{m.since}</span>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => openMember(m.id, true)}
                  title={t.editInstruments}
                  aria-label={t.editInstruments}
                  className="grid place-items-center w-[34px] h-[34px] rounded-[9px] border border-line bg-raised text-ink-meta cursor-pointer hover:text-ink-body hover:border-ink-faint"
                >
                  <Pencil size={14} strokeWidth={2} />
                </button>
              )}
              <button
                type="button"
                onClick={() => openMember(m.id)}
                className="py-2 px-[13px] rounded-[9px] border border-line bg-raised text-ink-body font-sans font-semibold text-[12px] cursor-pointer whitespace-nowrap hover:border-ink-faint"
              >
                {t.viewDetails}
              </button>
            </div>
          </div>
        </article>
      ))}
      </div>
    </div>
  );
}
