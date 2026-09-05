/** Mobile "Repertorio" tab: search + genre/sort filters + song cards with streaming links, chart links, takes and a collapsible rehearsal log. */
import { useEffect } from 'react';
import { ChevronDown, ChevronRight, Clock, FileText, Mic, Pencil, Plus, Youtube } from 'lucide-react';
import { useGuataca } from '../../store';
import { AppleMusicIcon, Pill, Segment, SpotifyIcon } from '../ui';
import type { LinkKind } from '../../types';

const rowLink = 'flex items-center gap-[8px] py-[8px] px-[11px] rounded-[10px] border border-[#1e293b] bg-[#0b1220] text-[#cbd5e1] no-underline font-sans font-medium text-[12px] leading-[normal]';
const chipLink = 'flex items-center gap-[7px] py-[7px] px-[10px] rounded-[10px] border border-[#1e293b] bg-[#0b1220] text-[#cbd5e1] no-underline font-sans font-medium text-[12px] leading-[normal]';

function streamIcon(kind: LinkKind) {
  if (kind === 'youtube') return <Youtube size={15} strokeWidth={1.9} className="flex-none" color="#f87171" />;
  if (kind === 'apple') return <AppleMusicIcon size={15} strokeWidth={1.9} className="flex-none text-[#f472b6]" />;
  return <SpotifyIcon size={15} strokeWidth={1.9} className="flex-none text-[#34d399]" />;
}

export function MobileRepertoire() {
  const { t, isAdmin, state, setQ, filteredSongs, statSongs, openNewSong, openEditSong, openEvent, genreChips, setGenre, toggleStale, setSongSort, toggleSong, clearScrollToSong } = useGuataca();
  const mobSongs = filteredSongs.slice(0, 14);

  // After a cross-view jump (goToSong), scroll the target song card into view.
  useEffect(() => {
    if (!state.scrollToSong) return;
    const el = document.getElementById(`song-${state.scrollToSong}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    clearScrollToSong();
  }, [state.scrollToSong, clearScrollToSong]);

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

      {/* genre chips + stale toggle */}
      <div className="flex gap-[6px] items-center overflow-x-auto pb-1 -mx-1 px-1">
        {genreChips.map((g) => (
          <Pill key={g.id} color={g.color} active={g.active} onClick={() => setGenre(g.id)} className="flex-none">
            {g.label}
          </Pill>
        ))}
        <Pill color="#fbbf24" active={state.staleOnly} onClick={toggleStale} className="flex-none">
          ⚠ {t.onlyStale}
        </Pill>
      </div>

      {/* sort */}
      <div className="flex items-center gap-2">
        <Segment className="flex-1">
          <Pill active={state.songSort === 'recorded'} color="#a78bfa" className="flex-1" onClick={() => setSongSort('recorded')}>
            {t.sortRecorded}
          </Pill>
          <Pill active={state.songSort === 'name'} color="#a78bfa" className="flex-1" onClick={() => setSongSort('name')}>
            {t.sortName}
          </Pill>
          <Pill active={state.songSort === 'takes'} color="#a78bfa" className="flex-1" onClick={() => setSongSort('takes')}>
            {t.sortTakes}
          </Pill>
        </Segment>
        <span className="font-mono font-medium text-[11.5px] text-[#475569] flex-none">{filteredSongs.length} / {statSongs}</span>
      </div>

      {mobSongs.map((s) => (
        <div key={s.id} id={`song-${s.id}`} className="bg-[#0f172a] border border-[#1e293b] rounded-[14px] py-[13px] px-[14px] flex flex-col gap-[11px]">
          <div className="flex items-start gap-[11px]">
            <span className="w-1 h-[34px] rounded-[3px] flex-none" style={{ background: s.genreColor }} />
            <button type="button" onClick={() => toggleSong(s.id)} className="min-w-0 flex-1 border-none bg-transparent cursor-pointer text-left text-inherit">
              <span className="block font-display font-semibold text-[15.5px] leading-[1.25] text-[#f1f5f9]">{s.title}</span>
              <span className="block font-mono font-medium text-[11px] text-[#64748b] mt-[5px]">{s.key} · {s.bpm} BPM · {s.dur}</span>
            </button>
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
            {isAdmin && (
              <button
                type="button"
                onClick={() => openEditSong(s.id)}
                title={t.editSong}
                aria-label={t.editSong}
                className="grid place-items-center w-[28px] h-[28px] rounded-[8px] border border-[#1e293b] bg-[#0b1220] text-[#64748b] cursor-pointer flex-none"
              >
                <Pencil size={13} strokeWidth={2} />
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleSong(s.id)}
              title={t.rehearsalLog}
              aria-label={t.rehearsalLog}
              className="grid place-items-center w-[28px] h-[28px] rounded-[8px] border border-[#1e293b] bg-[#0b1220] text-[#64748b] cursor-pointer flex-none"
            >
              <ChevronDown size={15} strokeWidth={2} className={s.open ? 'rotate-180' : ''} />
            </button>
          </div>
          {s.hasStreaming && (
            <div className="flex gap-[6px] flex-wrap">
              {s.streaming.map((l) => (
                <a key={l.kind + l.url} href={l.url} target="_blank" rel="noreferrer" className={chipLink}>
                  {streamIcon(l.kind)}
                  <span>{l.label}</span>
                </a>
              ))}
            </div>
          )}
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
          {s.open && (
            <div className="flex flex-col gap-[6px] border-t border-[#172033] pt-[10px]">
              <div className="font-display font-semibold text-[10px] tracking-[.12em] uppercase text-[#64748b]">{t.rehearsalLog}</div>
              {s.logs.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => openEvent(l.id)}
                  className="flex items-center gap-[10px] p-[10px_12px] rounded-[10px] border border-[#172033] bg-[#0b1220] text-left cursor-pointer"
                >
                  <span className="w-[6px] h-[6px] rounded-full bg-[#34d399] flex-none" />
                  <span className="flex-1 min-w-0 font-sans font-medium text-[12.5px] text-[#cbd5e1]">{l.title}</span>
                  <span className="font-mono font-medium text-[11px] text-[#64748b] whitespace-nowrap">{l.date}</span>
                  <ChevronRight size={14} strokeWidth={2} className="flex-none" color="#475569" />
                </button>
              ))}
              <div className="flex items-center gap-[6px] text-[11.5px] text-[#475569] p-[6px_2px]">
                <Clock size={12} strokeWidth={2} color={s.staleColor} className="flex-none opacity-80" />
                {t.lastRehearsed}: {s.lastDate}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
