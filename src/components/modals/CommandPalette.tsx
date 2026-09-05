/**
 * ⌘K command palette (design lines 1429–1458): search input, up to nine
 * results with group chip + numeric kbd, and an empty state.
 */
import { Search } from 'lucide-react';
import { useGuataca } from '@/store';

export function CommandPalette() {
  const { t, state, setPq, closePalette, paletteResults } = useGuataca();

  return (
    <div
      onClick={closePalette}
      className="fixed inset-0 z-[95] bg-[#020617d9] backdrop-blur-[8px] flex items-start justify-center p-[90px_20px] animate-fade-fast [animation-duration:.14s]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[580px] bg-raised border border-line-strong rounded-2xl overflow-hidden shadow-[0_40px_80px_-20px_#000] animate-rise [animation-duration:.2s]"
      >
        <div className="flex items-center gap-3 p-[16px_18px] border-b border-line-soft">
          <Search size={18} strokeWidth={2} color="#475569" className="flex-none" />
          <input
            value={state.pq}
            onChange={(e) => setPq(e.target.value)}
            placeholder={t.searchPlaceholder}
            autoFocus
            className="flex-1 border-none bg-transparent text-ink font-sans font-normal text-[15.5px] leading-[normal] outline-none"
          />
          <kbd className="font-mono font-medium text-[10.5px] leading-[normal] bg-line-soft border border-line-strong rounded-[5px] p-[3px_6px] text-ink-muted flex-none">
            esc
          </kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-2">
          {paletteResults.map((r) => (
            <button
              key={r.idx}
              type="button"
              onClick={r.run}
              className="flex items-center gap-[13px] w-full p-[11px_12px] rounded-[10px] border-none bg-transparent text-ink-body cursor-pointer text-left hover:bg-line-soft"
            >
              <span className="font-display font-semibold text-[9.5px] leading-[normal] tracking-[.09em] uppercase text-violet-deep bg-[#7c3aed1f] p-[3px_7px] rounded-[5px] flex-none min-w-[74px] text-center">
                {r.group}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-sans font-medium text-[14px] leading-[normal]">{r.label}</span>
                <span className="block font-mono font-medium text-[11px] leading-[normal] text-ink-dim mt-[3px]">{r.sub}</span>
              </span>
              <kbd className="font-mono font-medium text-[10px] leading-[normal] bg-line-soft border border-line-strong rounded-[4px] p-[2px_5px] text-ink-dim flex-none">
                {r.idx}
              </kbd>
            </button>
          ))}
          {paletteResults.length === 0 && (
            <div className="flex flex-col items-center gap-[9px] p-[34px_20px] text-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
                <path d="M8 11h6" />
              </svg>
              <span className="font-sans font-semibold text-[13.5px] leading-[normal] text-ink-muted">{t.noResults}</span>
              <span className="font-mono font-medium text-[11.5px] leading-[normal] text-ink-faint">{state.pq}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
