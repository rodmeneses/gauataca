/** Mobile "Repertorio" tab: search + first 14 filtered songs with 4 link boxes each. */
import { FileText, Mic, Youtube } from 'lucide-react';
import { useBandSync } from '../../store';
import { SpotifyIcon } from '../ui';

const linkBox = 'grid place-items-center min-h-[48px] rounded-[12px] border no-underline';

export function MobileRepertoire() {
  const { t, state, setQ, filteredSongs } = useBandSync();
  const mobSongs = filteredSongs.slice(0, 14);
  return (
    <div className="flex flex-col gap-[11px]">
      <input
        value={state.q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t.search}
        className="w-full min-h-[48px] py-0 px-[15px] rounded-[13px] border border-[#1e293b] bg-[#0b1220] text-[#e2e8f0] font-sans font-normal text-[15px] outline-none"
      />
      {mobSongs.map((s) => (
        <div key={s.id} className="bg-[#0f172a] border border-[#1e293b] rounded-[14px] py-[13px] px-[14px] flex flex-col gap-[11px]">
          <div className="flex items-start gap-[11px]">
            <span className="w-1 h-[34px] rounded-[3px] flex-none" style={{ background: s.genreColor }} />
            <span className="min-w-0 flex-1">
              <span className="block font-display font-semibold text-[15.5px] leading-[1.25] text-[#f1f5f9]">{s.title}</span>
              <span className="block font-mono font-medium text-[11px] text-[#64748b] mt-[5px]">{s.key} · {s.bpm} BPM · {s.dur}</span>
            </span>
            <span
              className="font-mono font-semibold text-[10px] py-[3px] px-2 rounded-[20px] flex-none whitespace-nowrap"
              style={{ color: s.staleColor, background: s.staleBg }}
            >
              {s.lastLabel}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <a href={s.chart} target="_blank" rel="noreferrer" className={`${linkBox} border-[#1e293b] bg-[#0b1220] text-[#60a5fa]`}>
              <FileText size={20} strokeWidth={1.8} />
            </a>
            <a href={s.yt} target="_blank" rel="noreferrer" className={`${linkBox} border-[#1e293b] bg-[#0b1220] text-[#f87171]`}>
              <Youtube size={20} strokeWidth={1.8} />
            </a>
            <a href={s.sp} target="_blank" rel="noreferrer" className={`${linkBox} border-[#1e293b] bg-[#0b1220] text-[#34d399]`}>
              <SpotifyIcon size={20} strokeWidth={1.8} />
            </a>
            <a href={s.rec} target="_blank" rel="noreferrer" className={`${linkBox} border-[#a78bfa33] bg-[#7c3aed14] text-[#c4b5fd]`}>
              <Mic size={20} strokeWidth={1.8} />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
