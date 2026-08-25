/**
 * Repertoire view — search + genre filter chips + song rows with resource links,
 * and an expandable panel (resources / rehearsal log) per song.
 * Faithful port of the design's `isRep` section.
 */
import { Clock, FileText, Mic, Plus, Search, Youtube } from 'lucide-react';
import { IconLink, Pill, SpotifyIcon } from '@/components/ui';
import { useBandSync } from '@/store';

/** Shared classes for the three neutral resource links in the expanded panel. */
const RESOURCE_LINK =
  'flex items-center gap-[11px] p-[11px_13px] rounded-[10px] border border-[#1e293b] bg-[#0f172a] text-[#cbd5e1] hover:text-[#cbd5e1] no-underline font-sans font-medium text-[13px] hover:border-[#334155]';

export function Repertoire() {
  const { state, t, isAdmin, setQ, openNewSong, genreChips, setGenre, toggleStale, filteredSongs, statSongs, toggleSong } = useBandSync();

  return (
    <div className="flex flex-col gap-4 animate-fade">
      {/* ---- search + new song */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <span className="absolute left-[14px] top-1/2 -translate-y-1/2 flex text-[#475569]">
            <Search size={17} strokeWidth={2} />
          </span>
          <input
            value={state.q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.search}
            className="w-full p-[13px_14px_13px_42px] rounded-[12px] border border-[#1e293b] bg-[#0b1220] text-[#e2e8f0] font-sans text-[15px] outline-none"
          />
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={openNewSong}
            className="inline-flex items-center gap-2 p-[12px_16px] rounded-[11px] border border-[#34d39955] bg-[#34d39918] hover:bg-[#34d39928] text-[#6ee7b7] font-sans font-semibold text-[13px] cursor-pointer whitespace-nowrap"
          >
            <Plus size={15} strokeWidth={2.2} />
            {t.newSong}
          </button>
        )}
      </div>

      {/* ---- genre chips + stale toggle + count */}
      <div className="flex gap-[7px] items-center flex-wrap bg-[#0b1220] border border-[#172033] rounded-[12px] p-[7px_9px]">
        {genreChips.map((g) => (
          <Pill key={g.id} color={g.color} active={g.active} onClick={() => setGenre(g.id)}>
            {g.label}
          </Pill>
        ))}
        <span className="w-px h-5 bg-[#1e293b] mx-1" />
        <Pill color="#fbbf24" active={state.staleOnly} onClick={toggleStale}>
          ⚠ {t.onlyStale}
        </Pill>
        <span className="ml-auto font-mono font-medium text-[11.5px] text-[#475569] pr-[6px]">
          {filteredSongs.length} / {statSongs}
        </span>
      </div>

      {/* ---- song rows */}
      <div className="flex flex-col gap-2">
        {filteredSongs.map((s) => (
          <div key={s.id} className="bg-[#0f172a] border border-[#1e293b] rounded-[13px] overflow-hidden">
            <div className="flex items-center gap-x-[14px] gap-y-3 flex-wrap p-[14px_16px] min-h-[72px]">
              <button
                type="button"
                onClick={() => toggleSong(s.id)}
                className="flex items-center gap-[14px] flex-[1_1_300px] min-w-0 border-none bg-transparent cursor-pointer text-left p-0 text-inherit"
              >
                <span className="w-1 h-10 rounded-[3px] flex-none opacity-[.85]" style={{ background: s.genreColor }} />
                <span className="min-w-0 flex-1">
                  <span className="block font-display font-semibold text-[16px] leading-[1.25] text-[#f1f5f9] tracking-[-.01em]">{s.title}</span>
                  <span className="flex items-center gap-[9px] mt-[6px] font-sans font-medium text-[11.5px] text-[#64748b] flex-nowrap whitespace-nowrap min-w-0 overflow-hidden">
                    <span className="flex-none" style={{ color: s.genreColor }}>{s.genreShort}</span>
                    <span className="divider-dot" />
                    <span className="font-mono flex-none">{s.key}</span>
                    <span className="divider-dot" />
                    <span className="font-mono flex-none">{s.bpm} BPM</span>
                    <span className="divider-dot" />
                    <span className="font-mono flex-none">{s.dur}</span>
                  </span>
                </span>
                <span className="flex items-center gap-[7px] flex-none pr-1" title={t.lastRehearsed}>
                  <Clock size={13} strokeWidth={2} color={s.staleColor} className="flex-none opacity-80" />
                  <span
                    className="font-mono font-semibold text-[11.5px] p-[3px_9px] rounded-[20px] whitespace-nowrap"
                    style={{ color: s.staleColor, background: s.staleBg }}
                  >
                    {s.lastLabel}
                  </span>
                </span>
              </button>
              <div className="flex gap-[7px] flex-none">
                <IconLink href={s.chart} color="#60a5fa" title={t.chart}>
                  <FileText size={19} strokeWidth={1.8} />
                </IconLink>
                <IconLink href={s.yt} color="#f87171" title={t.ytLink}>
                  <Youtube size={19} strokeWidth={1.8} />
                </IconLink>
                <IconLink href={s.sp} color="#34d399" title={t.spLink}>
                  <SpotifyIcon size={19} strokeWidth={1.8} />
                </IconLink>
                <IconLink href={s.rec} color="#c4b5fd" hoverColor="#a78bfa" title={t.recLink}>
                  <Mic size={19} strokeWidth={1.8} />
                </IconLink>
              </div>
            </div>

            {s.open && (
              <div className="border-t border-[#172033] bg-[#0b1220] p-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-[18px] animate-[bsFade_.2s_ease]">
                {/* resources */}
                <div>
                  <div className="font-display font-semibold text-[10.5px] tracking-[.12em] uppercase text-[#64748b] mb-[11px]">{t.resources}</div>
                  <div className="flex flex-col gap-[7px]">
                    <a href={s.chart} target="_blank" rel="noreferrer" className={RESOURCE_LINK}>
                      <FileText size={16} strokeWidth={1.9} color="#60a5fa" className="flex-none" />
                      <span className="flex-1">{t.chart}</span>
                      <span className="text-[11px] text-[#475569]">Google Docs</span>
                    </a>
                    <a href={s.yt} target="_blank" rel="noreferrer" className={RESOURCE_LINK}>
                      <Youtube size={16} strokeWidth={1.9} color="#f87171" className="flex-none" />
                      <span className="flex-1">{t.ytLink}</span>
                      <span className="text-[11px] text-[#475569]">{t.reference}</span>
                    </a>
                    <a href={s.sp} target="_blank" rel="noreferrer" className={RESOURCE_LINK}>
                      <SpotifyIcon size={16} strokeWidth={1.9} className="flex-none text-[#34d399]" />
                      <span className="flex-1">{t.spLink}</span>
                      <span className="text-[11px] text-[#475569]">{t.streaming}</span>
                    </a>
                    <a
                      href={s.rec}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-[11px] p-[11px_13px] rounded-[10px] border border-[#a78bfa33] bg-[#7c3aed12] text-[#e9d5ff] hover:text-[#e9d5ff] no-underline font-sans font-medium text-[13px] hover:border-[#a78bfa66]"
                    >
                      <Mic size={16} strokeWidth={1.9} color="#c4b5fd" className="flex-none" />
                      <span className="flex-1">{t.recLink}</span>
                      <span className="text-[11px] text-[#a78bfa]">Drive</span>
                    </a>
                  </div>
                </div>

                {/* rehearsal log */}
                <div>
                  <div className="font-display font-semibold text-[10.5px] tracking-[.12em] uppercase text-[#64748b] mb-[11px]">{t.rehearsalLog}</div>
                  <div className="flex flex-col gap-[7px]">
                    {s.logs.map((l) => (
                      <div key={l.id} className="flex items-center gap-[11px] p-[10px_12px] rounded-[10px] border border-[#172033] bg-[#0f172a]">
                        <span className="w-[6px] h-[6px] rounded-full bg-[#34d399] flex-none" />
                        <span className="flex-1 min-w-0 font-sans font-medium text-[12.5px] text-[#cbd5e1]">{l.title}</span>
                        <span className="font-mono font-medium text-[11px] text-[#64748b] whitespace-nowrap">{l.date}</span>
                      </div>
                    ))}
                    <div className="text-[11.5px] text-[#475569] p-[8px_2px]">
                      {t.lastRehearsed}: {s.lastDate}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
