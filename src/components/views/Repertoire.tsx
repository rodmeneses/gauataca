/**
 * Repertoire view — a dashboard of songs. Each card shows the real-version
 * streaming links (YouTube / Apple Music / Spotify, any number of each), the
 * tabs/sheet-music links (several possible) and every recorded take, plus a sort
 * control (most recorded by default, by name, or fewest takes). The rehearsal
 * log entries link to their event.
 */
import { useEffect } from 'react';
import { ChevronDown, ChevronRight, Clock, FileText, Mic, Pencil, Plus, Search, Youtube } from 'lucide-react';
import { AppleMusicIcon, Pill, Segment, SpotifyIcon } from '@/components/ui';
import { useGuataca } from '@/store';
import type { LinkKind } from '@/types';

/** Shared classes for the labeled resource links (streaming / chart / take). */
const LINK =
  'flex items-center gap-[9px] p-[9px_12px] rounded-[10px] border border-line bg-surface text-ink-body hover:text-ink-body no-underline font-sans font-medium text-[12.5px] leading-[normal] hover:border-line-hover';
const EYEBROW = 'font-display font-semibold text-[10.5px] tracking-[.12em] uppercase text-ink-muted mb-[9px]';

/** Icon for a streaming link kind (chart links use FileText in their own block). */
function streamIcon(kind: LinkKind) {
  if (kind === 'youtube') return <Youtube size={15} strokeWidth={1.9} className="flex-none" color="var(--color-red)" />;
  if (kind === 'apple') return <AppleMusicIcon size={15} strokeWidth={1.9} className="flex-none text-fuchsia" />;
  return <SpotifyIcon size={15} strokeWidth={1.9} className="flex-none text-emerald" />;
}

export function Repertoire() {
  const { state, t, isAdmin, setQ, openNewSong, openEditSong, openEvent, genreChips, setGenre, toggleStale, filteredSongs, statSongs, setSongSort, toggleSong, clearScrollToSong } = useGuataca();

  // After a cross-view jump (goToSong), scroll the target song card into view.
  useEffect(() => {
    if (!state.scrollToSong) return;
    const el = document.getElementById(`song-${state.scrollToSong}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    clearScrollToSong();
  }, [state.scrollToSong, clearScrollToSong]);

  return (
    <div className="flex flex-col gap-4 animate-fade">
      {/* ---- search + sort + new song */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <span className="absolute left-[14px] top-1/2 -translate-y-1/2 flex text-ink-dim">
            <Search size={17} strokeWidth={2} />
          </span>
          <input
            value={state.q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.search}
            className="w-full p-[13px_14px_13px_42px] rounded-[12px] border border-line bg-raised text-ink-base font-sans text-[15px] outline-none"
          />
        </div>
        <Segment>
          <Pill active={state.songSort === 'recorded'} color="var(--color-violet-light)" onClick={() => setSongSort('recorded')}>
            {t.sortRecorded}
          </Pill>
          <Pill active={state.songSort === 'name'} color="var(--color-violet-light)" onClick={() => setSongSort('name')}>
            {t.sortName}
          </Pill>
          <Pill active={state.songSort === 'takes'} color="var(--color-violet-light)" onClick={() => setSongSort('takes')}>
            {t.sortTakes}
          </Pill>
        </Segment>
        {isAdmin && (
          <button
            type="button"
            onClick={openNewSong}
            className="inline-flex items-center gap-2 p-[12px_16px] rounded-[11px] border border-emerald/40 bg-[var(--color-tint-emerald)] hover:bg-[var(--color-tint-emerald)] text-emerald-light font-sans font-semibold text-[13px] cursor-pointer whitespace-nowrap"
          >
            <Plus size={15} strokeWidth={2.2} />
            {t.newSong}
          </button>
        )}
      </div>

      {/* ---- genre chips + stale toggle + count */}
      <div className="flex gap-[7px] items-center flex-wrap bg-raised border border-line-soft rounded-[12px] p-[7px_9px]">
        {genreChips.map((g) => (
          <Pill key={g.id} color={g.color} active={g.active} onClick={() => setGenre(g.id)}>
            {g.label}
          </Pill>
        ))}
        <span className="w-px h-5 bg-line mx-1" />
        <Pill color="var(--color-amber)" active={state.staleOnly} onClick={toggleStale}>
          ⚠ {t.onlyStale}
        </Pill>
        <span className="ml-auto font-mono font-medium text-[11.5px] text-ink-dim pr-[6px]">
          {filteredSongs.length} / {statSongs}
        </span>
      </div>

      {/* ---- song cards */}
      <div className="flex flex-col gap-2">
        {filteredSongs.map((s) => (
          <div key={s.id} id={`song-${s.id}`} className="bg-surface border border-line rounded-[13px] overflow-hidden">
            {/* header (title toggles the rehearsal log) */}
            <div className="flex items-center gap-x-[14px] gap-y-3 flex-wrap p-[14px_16px]">
              <span className="w-1 h-10 rounded-[3px] flex-none opacity-[.85]" style={{ background: s.genreColor }} />
              <button
                type="button"
                onClick={() => toggleSong(s.id)}
                className="min-w-0 flex-1 border-none bg-transparent cursor-pointer text-left text-inherit"
              >
                <span className="block font-display font-semibold text-[16px] leading-[1.25] text-ink tracking-[-.01em]">{s.title}</span>
                <span className="flex items-center gap-[9px] mt-[6px] font-sans font-medium text-[11.5px] text-ink-muted flex-nowrap whitespace-nowrap min-w-0 overflow-hidden">
                  <span className="flex-none" style={{ color: s.genreColor }}>{s.genreShort}</span>
                  <span className="divider-dot" />
                  <span className="font-mono flex-none">{s.key}</span>
                  <span className="divider-dot" />
                  <span className="font-mono flex-none">{s.bpm} BPM</span>
                  <span className="divider-dot" />
                  <span className="font-mono flex-none">{s.dur}</span>
                </span>
              </button>
              {s.hasTakes && (
                <span
                  className="flex items-center gap-[6px] font-mono font-semibold text-[11.5px] p-[3px_9px] rounded-[20px] whitespace-nowrap flex-none"
                  style={{ color: 'var(--color-emerald-light)', background: 'color-mix(in srgb, var(--color-emerald) 11%, transparent)' }}
                  title={t.takesCount.replace('%d', String(s.takeCount))}
                >
                  <Mic size={12} strokeWidth={2} />
                  {s.takeCount}
                </span>
              )}
              <span className="flex items-center gap-[7px] flex-none" title={t.lastRehearsed}>
                <Clock size={13} strokeWidth={2} color={s.staleColor} className="flex-none opacity-80" />
                <span
                  className="font-mono font-semibold text-[11.5px] p-[3px_9px] rounded-[20px] whitespace-nowrap"
                  style={{ color: s.staleColor, background: s.staleBg }}
                >
                  {s.lastLabel}
                </span>
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => openEditSong(s.id)}
                  title={t.editSong}
                  aria-label={t.editSong}
                  className="grid place-items-center w-[30px] h-[30px] rounded-[9px] border border-line bg-raised text-ink-muted hover:text-ink-body hover:border-line-hover cursor-pointer flex-none"
                >
                  <Pencil size={14} strokeWidth={2} />
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleSong(s.id)}
                title={t.rehearsalLog}
                aria-label={t.rehearsalLog}
                className="grid place-items-center w-[30px] h-[30px] rounded-[9px] border border-line bg-raised text-ink-muted hover:text-ink-body hover:border-line-hover cursor-pointer flex-none"
              >
                <ChevronDown size={16} strokeWidth={2} className={s.open ? 'rotate-180' : ''} />
              </button>
            </div>

            {/* links + takes (always visible) */}
            <div className="border-t border-line-soft bg-raised p-[14px_16px] flex flex-col gap-[14px]">
              {/* real-version streaming links */}
              {s.hasStreaming && (
                <div className="flex gap-[7px] flex-wrap">
                  {s.streaming.map((l) => (
                    <a key={l.kind + l.url} href={l.url} target="_blank" rel="noreferrer" className={LINK}>
                      {streamIcon(l.kind)}
                      <span>{l.label}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* tabs / sheet-music links */}
              {s.hasCharts && (
                <div>
                  <div className={EYEBROW}>{t.charts}</div>
                  <div className="flex flex-col gap-[6px]">
                    {s.charts.map((c) => (
                      <a key={c.url} href={c.url} target="_blank" rel="noreferrer" className={LINK}>
                        <FileText size={15} strokeWidth={1.9} className="flex-none" color="var(--color-blue)" />
                        <span className="flex-1 min-w-0 truncate">{c.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* recorded takes */}
              {s.hasTakes && (
                <div>
                  <div className={EYEBROW}>{t.recordings}</div>
                  <div className="flex flex-col gap-[6px]">
                    {s.takes.map((tk) => (
                      <a key={tk.id} href={tk.url} target="_blank" rel="noreferrer" className={LINK}>
                        <Mic size={13} strokeWidth={1.9} className="flex-none" color="var(--color-emerald-light)" />
                        <span className="flex-1 min-w-0 truncate">{tk.label}</span>
                        <span className="font-mono font-medium text-[11px] text-ink-muted whitespace-nowrap">{tk.dateStr}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* rehearsal log (collapsible) — each entry links to its event */}
            {s.open && (
              <div className="border-t border-line-soft bg-raised p-[14px_16px]">
                <div className={EYEBROW}>{t.rehearsalLog}</div>
                <div className="flex flex-col gap-[7px]">
                  {s.logs.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => openEvent(l.id)}
                      className="flex items-center gap-[11px] p-[10px_12px] rounded-[10px] border border-line-soft bg-surface text-left cursor-pointer hover:border-line-hover"
                    >
                      <span className="w-[6px] h-[6px] rounded-full bg-emerald flex-none" />
                      <span className="flex-1 min-w-0 font-sans font-medium text-[12.5px] text-ink-body">{l.title}</span>
                      <span className="font-mono font-medium text-[11px] text-ink-muted whitespace-nowrap">{l.date}</span>
                      <ChevronRight size={14} strokeWidth={2} className="flex-none" color="var(--color-ink-dim)" />
                    </button>
                  ))}
                  <div className="text-[11.5px] text-ink-dim p-[8px_2px]">
                    {t.lastRehearsed}: {s.lastDate}
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
