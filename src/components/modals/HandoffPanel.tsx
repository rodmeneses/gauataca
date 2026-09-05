/**
 * Handoff notes side panel (design lines 1460–1490): a fixed right-hand drawer
 * listing the "for Claude Code — Phase 2" notes, grouped by heading.
 */
import { BookOpen } from 'lucide-react';
import { useGuataca } from '@/store';
import { CloseButton } from '@/components/ui';

export function HandoffPanel() {
  const { state, t, handoffNotes, closeHandoff } = useGuataca();
  if (!state.handoff) return null;

  return (
    <div className="fixed top-0 right-0 bottom-0 w-[480px] max-w-[92vw] z-[88] bg-raised border-l border-line-strong shadow-[-30px_0_70px_-20px_#000] flex flex-col animate-slide">
      <div className="p-[20px_22px] border-b border-line-soft flex items-center gap-[14px]">
        <span className="w-[34px] h-[34px] rounded-[10px] bg-[#7c3aed1f] border border-[#7c3aed4d] grid place-items-center text-violet-lighter flex-none">
          <BookOpen size={17} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display font-semibold text-[15px] leading-[normal] text-ink-bright">{t.handoff}</div>
          <div className="text-[11.5px] text-ink-muted mt-[4px]">{t.handoffSub}</div>
        </div>
        <CloseButton size={32} onClick={closeHandoff} />
      </div>
      <div className="flex-1 overflow-y-auto p-[20px_22px] flex flex-col gap-[20px]">
        {handoffNotes.map((h) => (
          <div key={h.h}>
            <div className="font-display font-semibold text-[12.5px] leading-[normal] text-violet-lighter mb-[11px]">{h.h}</div>
            <div className="flex flex-col gap-[9px]">
              {h.items.map((i) => (
                <div key={i} className="flex gap-[10px] items-start">
                  <span className="w-[4px] h-[4px] rounded-full bg-ink-faint flex-none mt-[7px]" />
                  <span className="font-sans text-[12.5px] leading-[1.7] text-ink-meta">{i}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
