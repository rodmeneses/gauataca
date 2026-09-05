/** Mobile "Repertorio" tab: search + genre/sort filters + song cards with streaming links, chart links, takes and a collapsible rehearsal log. */
import { useEffect } from 'react';
import { ChevronDown, ChevronRight, Clock, FileText, Mic, Pencil, Plus, Youtube } from 'lucide-react';
import { useGuataca } from '../../store';
import { AppleMusicIcon, Pill, Segment, SpotifyIcon } from '../ui';
import type { LinkKind } from '../../types';

const rowLink = 'flex items-center gap-2 min-h-[44px] py-2 px-3 rounded-lg border border-line bg-raised text-ink-body no-underline font-sans font-medium text-[14px]';
const chipLink = 'flex items-center gap-2 min-h-[44px] py-2 px-3 rounded-lg border border-line bg-raised text-ink-body no-underline font-sans font-medium text-[14px]';

function streamIcon(kind: LinkKind) {
  if (kind === 'youtube') return <Youtube size={16} strokeWidth={1.9} className="flex-none" color="var(--color-red)" />;
  if (kind === 'apple') return <AppleMusicIcon size={16} strokeWidth={1.9} className="flex-none text-pink" />;
  return <SpotifyIcon size={16} strokeWidth={1.9} className="flex-none text-emerald" />;
}

export function MobileRepertoire() {
  const { t, isAdmin, state, setQ, filteredSongs, statSongs, openNewSong, openEditSong, openEvent, genreChips, setGenre, toggleStale, setSongSort, toggleSong, clearScrollToSong } = useGuataca();

  // After a cross-view jump (goToSong), scroll the target song card into view.
  useEffect(() => {
    if (!state.scrollToSong) return;
    const el = document.getElementById(`song-${state.scrollToSong}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    clearScrollToSong();
  }, [state.scrollToSong, clearScrollToSong]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <input
          value={state.q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.search}
          aria-label={t.search}
          className="w-full min-h-[48px] py-0 px-4 rounded-xl border border-line bg-raised text-ink-base font-sans font-normal text-[16px] outline-none"
        />
        {isAdmin && (
          <button
            type="button"
            onClick={openNewSong}
            className="flex items-center justify-center gap-2 w-full min-h-[44px] px-3 rounded-xl border-none text-white font-sans font-semibold text-[14px] cursor-pointer"
            style={{ background: 'linear-gradient(100deg,var(--color-violet),var(--color-fuchsia))' }}
          >
            <Plus size={16} strokeWidth={2.2} />
            {t.newSong}
          </button>
        )}
      </div>

      {/* genre chips + stale toggle */}
      <div className="flex gap-1.5 items-center overflow-x-auto pb-1 -mx-1 px-1" role="group" aria-label={t.allGenres}>
        {genreChips.map((g) => (
          <Pill key={g.id} color={g.color} active={g.active} size="md" onClick={() => setGenre(g.id)} className="flex-none">
            {g.label}
          </Pill>
        ))}
        <Pill color="var(--color-amber)" active={state.staleOnly} size="md" onClick={toggleStale} className="flex-none">
          ⚠ {t.onlyStale}
        </Pill>
      </div>

      {/* sort */}
      <div className="flex flex-col gap-1.5">
        <Segment className="w-full">
          <Pill active={state.songSort === 'recorded'} color="var(--color-violet-light)" size="md" className="flex-1" onClick={() => setSongSort('recorded')}>
            {t.sortRecorded}
          </Pill>
          <Pill active={state.songSort === 'name'} color="var(--color-violet-light)" size="md" className="flex-1" onClick={() => setSongSort('name')}>
            {t.sortName}
          </Pill>
          <Pill active={state.songSort === 'takes'} color="var(--color-violet-light)" size="md" className="flex-1" onClick={() => setSongSort('takes')}>
            {t.sortTakes}
          </Pill>
        </Segment>
        <span className="font-mono font-medium text-[13px] text-ink-muted self-end">{filteredSongs.length} / {statSongs}</span>
      </div>

      {filteredSongs.map((s) => (
        <div key={s.id} id={`song-${s.id}`} className="bg-surface border border-line rounded-2xl py-3.5 px-4 flex flex-col gap-3">
          <div className="flex items-stretch gap-3">
            <span className="w-1 rounded-full flex-none" style={{ background: s.genreColor }} />
            <button type="button" onClick={() => toggleSong(s.id)} aria-expanded={s.open} className="min-w-0 flex-1 border-none bg-transparent cursor-pointer text-left text-inherit">
              <span className="block font-display font-semibold text-[16px] leading-snug text-ink">{s.title}</span>
              <span className="block font-mono font-medium text-[13px] text-ink-muted mt-1">{s.key} · {s.bpm} BPM · {s.dur}</span>
            </button>
            <div className="flex items-start gap-1.5 flex-none">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => openEditSong(s.id)}
                  title={t.editSong}
                  aria-label={`${t.editSong} — ${s.title}`}
                  className="grid place-items-center w-11 h-11 rounded-lg border border-line bg-raised text-ink-muted cursor-pointer"
                >
                  <Pencil size={16} strokeWidth={2} />
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleSong(s.id)}
                title={t.rehearsalLog}
                aria-label={t.rehearsalLog}
                className="grid place-items-center w-11 h-11 rounded-lg border border-line bg-raised text-ink-muted cursor-pointer"
              >
                <ChevronDown size={18} strokeWidth={2} className={s.open ? 'rotate-180' : ''} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {s.hasTakes && (
              <span
                className="flex items-center gap-1 font-mono font-semibold text-[12px] py-1 px-2 rounded-full whitespace-nowrap"
                style={{ color: 'var(--color-emerald)', background: 'var(--color-tint-emerald)' }}
              >
                <Mic size={12} strokeWidth={2} />
                {s.takeCount}
              </span>
            )}
            <span
              className="font-mono font-semibold text-[12px] py-1 px-2 rounded-full whitespace-nowrap"
              style={{ color: s.staleColor, background: s.staleBg }}
            >
              {s.lastLabel}
            </span>
          </div>
          {s.hasStreaming && (
            <div className="flex gap-1.5 flex-wrap">
              {s.streaming.map((l) => (
                <a key={l.kind + l.url} href={l.url} target="_blank" rel="noreferrer" className={chipLink}>
                  {streamIcon(l.kind)}
                  <span>{l.label}</span>
                </a>
              ))}
            </div>
          )}
          {s.hasCharts && (
            <div className="flex flex-col gap-1.5">
              {s.charts.map((c) => (
                <a key={c.url} href={c.url} target="_blank" rel="noreferrer" className={rowLink}>
                  <FileText size={16} strokeWidth={1.9} className="flex-none" color="var(--color-blue)" />
                  <span className="flex-1 min-w-0 truncate">{c.label}</span>
                </a>
              ))}
            </div>
          )}
          {s.hasTakes && (
            <div className="flex flex-col gap-1.5">
              {s.takes.map((tk) => (
                <a key={tk.id} href={tk.url} target="_blank" rel="noreferrer" className={rowLink}>
                  <Mic size={15} strokeWidth={1.9} className="flex-none" color="var(--color-emerald)" />
                  <span className="flex-1 min-w-0 truncate">{tk.label}</span>
                  <span className="font-mono font-medium text-[12px] text-ink-muted whitespace-nowrap">{tk.dateStr}</span>
                </a>
              ))}
            </div>
          )}
          {s.open && (
            <div className="flex flex-col gap-1.5 border-t border-line-soft pt-3">
              <div className="font-display font-semibold text-[12px] tracking-[.08em] uppercase text-ink-muted">{t.rehearsalLog}</div>
              {s.logs.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => openEvent(l.id)}
                  className="flex items-center gap-2.5 min-h-[44px] py-2 px-3 rounded-lg border border-line-soft bg-raised text-left cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald flex-none" />
                  <span className="flex-1 min-w-0 font-sans font-medium text-[14px] text-ink-body truncate">{l.title}</span>
                  <span className="font-mono font-medium text-[12px] text-ink-muted whitespace-nowrap">{l.date}</span>
                  <ChevronRight size={15} strokeWidth={2} className="flex-none" color="var(--color-ink-dim)" />
                </button>
              ))}
              <div className="flex items-center gap-1.5 text-[13px] text-ink-muted py-1.5 px-0.5">
                <Clock size={13} strokeWidth={2} color={s.staleColor} className="flex-none opacity-80" />
                {t.lastRehearsed}: {s.lastDate}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
