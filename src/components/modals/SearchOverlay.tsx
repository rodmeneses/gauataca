/**
 * Mobile global search: full-screen overlay that searches events, songs, fund
 * movements, brainstorm ideas, polls, availability polls and links. Each hit shows its type; tapping it jumps to
 * the resource (see `searchResults` in useGuataca).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BarChart3, Calendar, CalendarCheck, Lightbulb, Link2, Music, Receipt, Search, X } from 'lucide-react';
import { useGuataca } from '../../store';
import type { SearchKind } from '../../lib/search';
import { clearRecentSearches, readRecentSearches, rememberSearch } from '../../lib/recentSearches';
import { useDialogChrome } from '../ui';

const KIND_STYLE: Record<SearchKind, { icon: ReactNode; color: string; bg: string }> = {
  event: { icon: <Calendar size={18} strokeWidth={1.9} />, color: 'var(--color-violet-light)', bg: 'var(--color-tint-violet)' },
  song: { icon: <Music size={18} strokeWidth={1.9} />, color: 'var(--color-emerald)', bg: 'var(--color-tint-emerald)' },
  fund: { icon: <Receipt size={18} strokeWidth={1.9} />, color: 'var(--color-amber)', bg: 'var(--color-tint-amber)' },
  idea: { icon: <Lightbulb size={18} strokeWidth={1.9} />, color: 'var(--color-sky)', bg: 'var(--color-tint-sky)' },
  poll: { icon: <BarChart3 size={18} strokeWidth={1.9} />, color: 'var(--color-sky)', bg: 'var(--color-tint-sky)' },
  availability: { icon: <CalendarCheck size={18} strokeWidth={1.9} />, color: 'var(--color-emerald)', bg: 'var(--color-tint-emerald)' },
  link: { icon: <Link2 size={18} strokeWidth={1.9} />, color: 'var(--color-violet-light)', bg: 'var(--color-tint-violet)' },
};

/** Height of the visible area, so the result list stays above the on-screen keyboard. */
function useVisibleHeight(): number | null {
  const [h, setH] = useState<number | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setH(vv.height);
    vv.addEventListener('resize', onResize);
    onResize();
    return () => vv.removeEventListener('resize', onResize);
  }, []);
  return h;
}

export function SearchOverlay() {
  const { t, state, setSq, setSearchKind, closeSearch, searchResults } = useGuataca();
  const [recent, setRecent] = useState(readRecentSearches);
  const height = useVisibleHeight();
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogChrome(dialogRef);
  const q = state.sq;
  const kindLabel: Record<SearchKind, string> = { event: t.refEvents, song: t.refSongs, fund: t.fund, idea: t.brainstorm, poll: t.poll, availability: t.availability, link: t.links };
  const run = (r: (typeof searchResults)[number]) => {
    setRecent(rememberSearch(q));
    r.run();
  };
  const px = 'pl-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))]';

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={t.search}
      className="fixed top-0 inset-x-0 z-[95] flex flex-col bg-base animate-fade-fast [animation-duration:.14s]"
      style={{ height: height ?? '100%' }}
    >
      <div className={`flex items-center gap-3 pt-[calc(env(safe-area-inset-top)+8px)] pb-3 border-b border-line-faint flex-none ${px}`}>
        <label className="flex items-center gap-2.5 flex-1 min-w-0 min-h-[44px] px-3.5 rounded-xl border border-line bg-raised focus-within:border-line-strong">
          <Search size={18} strokeWidth={2} color="var(--color-ink-dim)" className="flex-none" />
          <input
            value={q}
            onChange={(e) => setSq(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchResults[0]) run(searchResults[0]);
            }}
            placeholder={t.searchAllPlaceholder}
            aria-label={t.search}
            type="search"
            enterKeyHint="go"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            className="flex-1 min-w-0 border-none bg-transparent text-ink font-sans font-normal text-[16px] leading-[normal] outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button
              type="button"
              aria-label={t.close}
              onClick={() => setSq('')}
              className="grid place-items-center w-6 h-6 -mr-1 rounded-full border-none bg-line-soft text-ink-muted cursor-pointer flex-none"
            >
              <X size={14} strokeWidth={2.2} />
            </button>
          )}
        </label>
        <button
          type="button"
          onClick={closeSearch}
          className="min-h-[44px] border-none bg-transparent font-sans font-semibold text-[14px] text-ink-muted cursor-pointer flex-none"
        >
          {t.cancel}
        </button>
      </div>

      <div role="group" aria-label={t.search} className={`flex gap-2 py-2 overflow-x-auto flex-none border-b border-line-faint ${px}`}>
        {(['all', 'event', 'song', 'fund', 'idea', 'poll', 'availability', 'link'] as const).map((k) => {
          const active = state.searchKind === k;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={active}
              onClick={() => setSearchKind(k)}
              className={`flex-none min-h-[36px] px-3.5 rounded-full border font-sans font-semibold text-[12.5px] cursor-pointer ${active ? 'border-violet/40 bg-[var(--color-tint-violet)] text-violet-light' : 'border-line bg-raised text-ink-muted'}`}
            >
              {k === 'all' ? t.searchAllKinds : kindLabel[k]}
            </button>
          );
        })}
      </div>

      <div className={`flex-1 overflow-y-auto overscroll-contain py-2 pb-[calc(env(safe-area-inset-bottom)+8px)] ${px}`}>
        {searchResults.map((r) => {
          const k = KIND_STYLE[r.kind];
          return (
            <button
              key={`${r.kind}-${r.id}`}
              type="button"
              onClick={() => run(r)}
              className="flex items-center gap-3 w-full min-h-[60px] py-2.5 px-1 border-none border-b border-line-faint bg-transparent text-left cursor-pointer"
            >
              <span className="grid place-items-center w-10 h-10 rounded-[11px] flex-none" style={{ background: k.bg, color: k.color }}>
                {k.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-sans font-medium text-[15px] leading-tight text-ink truncate">{r.title}</span>
                {r.sub && <span className="block font-mono font-medium text-[11.5px] leading-tight text-ink-dim mt-1 truncate">{r.sub}</span>}
              </span>
              <span
                className="font-display font-semibold text-[9.5px] leading-[normal] tracking-[.09em] uppercase py-[3px] px-[7px] rounded-[5px] flex-none"
                style={{ background: k.bg, color: k.color }}
              >
                {kindLabel[r.kind]}
              </span>
            </button>
          );
        })}

        {q.trim() === '' && recent.length > 0 && (
          <div className="pt-3 pb-1">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-semibold text-[10.5px] tracking-[.11em] uppercase text-ink-muted">{t.searchRecent}</span>
              <button
                type="button"
                onClick={() => { clearRecentSearches(); setRecent([]); }}
                className="min-h-[36px] px-1 border-none bg-transparent font-sans font-semibold text-[12.5px] text-ink-muted cursor-pointer"
              >
                {t.searchClearRecent}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSq(r)}
                  className="min-h-[36px] px-3.5 rounded-full border border-line bg-raised text-ink-body font-sans text-[13px] cursor-pointer"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
        {q.trim() === '' && (
          <div className="flex flex-col items-center gap-2.5 py-12 px-5 text-center">
            <Search size={22} strokeWidth={1.8} color="var(--color-ink-faint)" />
            <span className="font-sans text-[13.5px] text-ink-muted">{t.searchHint}</span>
          </div>
        )}
        {q.trim() !== '' && searchResults.length === 0 && (
          <div className="flex flex-col items-center gap-2.5 py-12 px-5 text-center">
            <span className="font-sans font-semibold text-[13.5px] text-ink-muted">{t.noResults}</span>
            <span className="font-mono font-medium text-[11.5px] text-ink-faint break-all">{q}</span>
          </div>
        )}
      </div>
    </div>
  );
}
