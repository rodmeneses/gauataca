/** Mobile "Ideas" tab: the brainstorm thread list (vote, open, convert-to-event). */
import { ArrowUp, CalendarPlus, MessageSquare } from 'lucide-react';
import { useBandSync } from '../../store';

export function MobileBrainstorm() {
  const { t, isAdmin, threads, voteThread, openThread, convertThread } = useBandSync();

  return (
    <div className="flex flex-col gap-3">
      {threads.map((b) => (
        <article key={b.id} className="bg-[#0f172a] border border-[#1e293b] rounded-[14px] p-[15px] flex gap-3">
          <button
            type="button"
            onClick={() => voteThread(b.id)}
            className="flex flex-col items-center gap-[3px] py-2 px-[10px] rounded-[10px] cursor-pointer flex-none"
            style={{
              border: '1px solid ' + (b.voted ? '#34d39966' : '#1e293b'),
              background: b.voted ? '#34d3991a' : '#0b1220',
              color: b.voted ? '#6ee7b7' : '#94a3b8',
            }}
          >
            <ArrowUp size={16} strokeWidth={2.2} />
            <span className="font-mono font-semibold text-[13px]">{b.votes}</span>
          </button>
          <div className="min-w-0 flex-1">
            <button type="button" onClick={() => openThread(b.id)} className="border-none bg-transparent p-0 text-left cursor-pointer block w-full">
              <h3 className="m-0 font-display font-semibold text-[15.5px] leading-[1.3] text-[#f1f5f9]">{b.title}</h3>
            </button>
            <p className="mt-[7px] mb-0 text-[13px] text-[#64748b] leading-[1.6]">{b.body}</p>
            <div className="flex items-center gap-[12px] mt-[11px] flex-wrap">
              <span className="flex items-center gap-2">
                <span className="w-[22px] h-[22px] rounded-[7px] bg-[#1e293b] grid place-items-center font-display font-semibold text-[9.5px] text-[#94a3b8]">{b.initial}</span>
                <span className="text-[11.5px] text-[#64748b]">{b.author}</span>
              </span>
              <span className="text-[11.5px] text-[#475569]">{b.dateStr}</span>
              <button
                type="button"
                onClick={() => openThread(b.id)}
                className="flex items-center gap-[6px] border-none bg-transparent text-[#94a3b8] font-sans font-medium text-[11.5px] cursor-pointer p-0"
              >
                <MessageSquare size={13} strokeWidth={1.9} />
                {b.commentCount} {t.comments}
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => convertThread(b.id)}
                  className="ml-auto flex items-center gap-[6px] py-1.5 px-2.5 rounded-[8px] border border-[#7c3aed4d] bg-[#7c3aed14] text-[#c4b5fd] font-sans font-semibold text-[11.5px] cursor-pointer"
                >
                  <CalendarPlus size={12} strokeWidth={2} />
                  {t.convert}
                </button>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
