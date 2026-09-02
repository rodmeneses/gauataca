/** Mobile "Repertorio" tab: search + "New song" (admin) + first 14 filtered songs with streaming links, chart links and takes. */
import { FileText, Mic, Plus, Youtube } from 'lucide-react';
import { useBandSync } from '../../store';
import { AppleMusicIcon, SpotifyIcon } from '../ui';

const linkBox = 'grid place-items-center min-h-[48px] rounded-[12px] border no-underline';
const rowLink = 'flex items-center gap-[8px] py-[8px] px-[11px] rounded-[10px] border border-[#1e293b] bg-[#0b1220] text-[#cbd5e1] no-underline font-sans font-medium text-[12px] leading-[normal]';

export function MobileRepertoire() {
  const { t, isAdmin, state, setQ, filteredSongs, openNewSong } = useBandSync();
  const mobSongs = filteredSongs.slice(0, 14);
  return (
    <div className="flex flex-col gap-[11px]">
      <div className="flex items-center gap-2">
        <input
          value={state.q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.search}
          className="flex-1 min-w-0 min-h-[48px] py-0 px-[15px] rounded-[13px] border border-[#1e293b] bg-[#0b1220] text-[#e2e8f0] font-sans font-normal text-[15px] outline-none"
        />
        {isAdmin && (
          <button
            type="button"
            onClick={openNewSong}
            className="flex items-center gap-[6px] min-h-[48px] py-0 px-3 rounded-[13px] border-none text-white font-sans font-semibold text-[12.5px] cursor-pointer flex-none"
            style={{ background: 'linear-gradient(100deg,#8b5cf6,#d946ef)' }}
          >
            <Plus size={15} strokeWidth={2.2} />
            {t.newSong}
          </button>
        )}
      </div>
      {mobSongs.map((s) => (
        <div key={s.id} className="bg-[#0f172a] border border-[#1e293b] rounded-[14px] py-[13px] px-[14px] flex flex-col gap-[11px]">
          <div className="flex items-start gap-[11px]">
            <span className="w-1 h-[34px] rounded-[3px] flex-none" style={{ background: s.genreColor }} />
            <span className="min-w-0 flex-1">
              <span className="block font-display font-semibold text-[15.5px] leading-[1.25] text-[#f1f5f9]">{s.title}</span>
              <span className="block font-mono font-medium text-[11px] text-[#64748b] mt-[5px]">{s.key} · {s.bpm} BPM · {s.dur}</span>
            </span>
            {s.hasTakes && (
              <span
                className="flex items-center gap-[5px] font-mono font-semibold text-[10px] py-[3px] px-2 rounded-[20px] flex-none whitespace-nowrap"
                style={{ color: '#6ee7b7', background: '#34d3991c' }}
              >
                <Mic size={11} strokeWidth={2} />
                {s.takeCount}
              </span>
            )}
            <span
              className="font-mono font-semibold text-[10px] py-[3px] px-2 rounded-[20px] flex-none whitespace-nowrap"
              style={{ color: s.staleColor, background: s.staleBg }}
            >
              {s.lastLabel}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <a href={s.yt} target="_blank" rel="noreferrer" className={`${linkBox} border-[#1e293b] bg-[#0b1220] text-[#f87171]`}>
              <Youtube size={20} strokeWidth={1.8} />
            </a>
            <a href={s.am} target="_blank" rel="noreferrer" className={`${linkBox} border-[#1e293b] bg-[#0b1220] text-[#f472b6]`}>
              <AppleMusicIcon size={20} strokeWidth={1.8} />
            </a>
            <a href={s.sp} target="_blank" rel="noreferrer" className={`${linkBox} border-[#1e293b] bg-[#0b1220] text-[#34d399]`}>
              <SpotifyIcon size={20} strokeWidth={1.8} />
            </a>
          </div>
          {s.hasCharts && (
            <div className="flex flex-col gap-[6px]">
              {s.charts.map((c) => (
                <a key={c.url} href={c.url} target="_blank" rel="noreferrer" className={rowLink}>
                  <FileText size={14} strokeWidth={1.9} className="flex-none" color="#60a5fa" />
                  <span className="flex-1 min-w-0 truncate">{c.label}</span>
                </a>
              ))}
            </div>
          )}
          {s.hasTakes && (
            <div className="flex flex-col gap-[6px]">
              {s.takes.map((tk) => (
                <a key={tk.id} href={tk.url} target="_blank" rel="noreferrer" className={rowLink}>
                  <Mic size={13} strokeWidth={1.9} className="flex-none" color="#6ee7b7" />
                  <span className="flex-1 min-w-0 truncate">{tk.label}</span>
                  <span className="font-mono font-medium text-[10.5px] text-[#64748b] whitespace-nowrap">{tk.dateStr}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
