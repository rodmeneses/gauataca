/**
 * Setlist builder (code-first addition, see HANDOFF.md §4). Read-only list with an
 * "edit" affordance for admins; editing swaps in a draft with add / remove / reorder
 * and a live runtime total. Save persists the ordered song ids via the store action.
 */
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Search, X } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { durationSeconds } from '@/lib/format';
import type { Dict } from '@/i18n';
import type { SongVm } from '@/store';

interface SetlistEditorProps {
  currentIds: string[];
  songs: SongVm[];
  setlistLabel: string;
  isAdmin: boolean;
  onSave: (songIds: string[]) => Promise<void>;
  onOpenSong: (id: string) => void;
  t: Dict;
}

const rowCls = 'flex items-center gap-[12px] py-[10px] px-[12px] rounded-[10px] bg-surface border border-line-soft';
const iconBtn = 'grid place-items-center w-[26px] h-[26px] rounded-[7px] border border-line bg-raised text-ink-muted hover:text-ink-body hover:border-emerald/40 cursor-pointer flex-none disabled:opacity-30 disabled:cursor-default';

export function SetlistEditor({ currentIds, songs, setlistLabel, isAdmin, onSave, onOpenSong, t }: SetlistEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>(currentIds);
  const [query, setQuery] = useState('');

  const byId = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);
  const draftSongs = draft.map((id) => byId.get(id)).filter((s): s is SongVm => !!s);
  const sec = draftSongs.reduce((a, s) => a + durationSeconds(s.dur), 0);
  const runtime = Math.floor(sec / 60) + ' min';

  const q = query.trim().toLowerCase();
  const available = songs.filter(
    (s) => !draft.includes(s.id) && (!q || s.title.toLowerCase().includes(q) || s.key.toLowerCase() === q),
  );

  const startEdit = () => {
    setDraft(currentIds);
    setQuery('');
    setEditing(true);
  };
  const cancel = () => {
    setDraft(currentIds);
    setQuery('');
    setEditing(false);
  };
  const save = async () => {
    await onSave(draft);
    setEditing(false);
  };

  const add = (id: string) => setDraft((d) => [...d, id]);
  const remove = (id: string) => setDraft((d) => d.filter((x) => x !== id));
  const move = (i: number, dir: -1 | 1) =>
    setDraft((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.length) return d;
      const next = [...d];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div className="py-5 px-6 border-b border-line-soft">
      <div className="flex items-baseline gap-[11px] mb-[13px]">
        <h3 className="m-0 font-display font-semibold text-[13px] leading-[normal] tracking-[.02em] text-ink-body">{setlistLabel}</h3>
        <span className="font-mono font-medium text-[11.5px] leading-[normal] text-ink-muted whitespace-nowrap">
          {draftSongs.length} · {t.runtime} {runtime}
        </span>
        {isAdmin && !editing && (
          <Button variant="ghost" onClick={startEdit} className="ml-auto py-[6px] px-[12px] text-[12.5px]">
            {t.editSetlist}
          </Button>
        )}
      </div>

      {!editing ? (
        draftSongs.length === 0 ? (
          <p className="m-0 font-sans font-normal text-[12.5px] leading-[normal] text-ink-dim">{t.noSongsYet}</p>
        ) : (
          <div className="flex flex-col gap-[5px]">
            {draftSongs.map((s, i) => (
              <div key={s.id} className={rowCls}>
                <span className="font-mono font-semibold text-[12px] leading-[normal] text-ink-dim flex-none">{String(i + 1).padStart(2, '0')}</span>
                <span className="w-[3px] h-[22px] rounded-[2px] flex-none" style={{ background: s.genreColor }} />
                <button
                  type="button"
                  onClick={() => onOpenSong(s.id)}
                  title={t.openSong}
                  className="flex-1 min-w-0 font-sans font-semibold text-[14px] leading-[normal] text-ink-base text-left border-none bg-transparent cursor-pointer hover:text-emerald-light hover:underline"
                >
                  {s.title}
                </button>
                <span className="font-mono font-medium text-[11.5px] leading-[normal] text-ink-muted flex-none">{s.key}</span>
                <span className="font-mono font-medium text-[11.5px] leading-[normal] text-ink-meta flex-none min-w-[38px] text-right">{s.dur}</span>
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          {/* draft list with controls */}
          <div className="flex flex-col gap-[5px] mb-4">
            {draftSongs.length === 0 && (
              <p className="m-0 font-sans font-normal text-[12.5px] leading-[normal] text-ink-dim">{t.noSongsYet}</p>
            )}
            {draftSongs.map((s, i) => (
              <div key={s.id} className={rowCls}>
                <span className="font-mono font-semibold text-[12px] leading-[normal] text-ink-dim flex-none">{String(i + 1).padStart(2, '0')}</span>
                <span className="w-[3px] h-[22px] rounded-[2px] flex-none" style={{ background: s.genreColor }} />
                <span className="flex-1 min-w-0 font-sans font-semibold text-[14px] leading-[normal] text-ink-base">{s.title}</span>
                <span className="font-mono font-medium text-[11.5px] leading-[normal] text-ink-muted flex-none">{s.key}</span>
                <span className="font-mono font-medium text-[11.5px] leading-[normal] text-ink-meta flex-none min-w-[38px] text-right">{s.dur}</span>
                <button type="button" className={iconBtn} onClick={() => move(i, -1)} disabled={i === 0} title={t.moveUp} aria-label={t.moveUp}>
                  <ArrowUp size={14} strokeWidth={2.2} />
                </button>
                <button type="button" className={iconBtn} onClick={() => move(i, 1)} disabled={i === draftSongs.length - 1} title={t.moveDown} aria-label={t.moveDown}>
                  <ArrowDown size={14} strokeWidth={2.2} />
                </button>
                <button type="button" className={iconBtn} onClick={() => remove(s.id)} title={t.removeSong} aria-label={t.removeSong}>
                  <X size={14} strokeWidth={2.2} />
                </button>
              </div>
            ))}
          </div>

          {/* add songs picker */}
          <div className="mb-4">
            <div className="font-display font-semibold text-[10.5px] leading-[normal] tracking-[.11em] uppercase text-ink-muted mb-[9px]">{t.addSongs}</div>
            <div className="relative mb-[9px]">
              <Search size={15} strokeWidth={1.9} className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-ink-dim)' }} />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchSongs}
                className="pl-[36px]"
              />
            </div>
            <div className="max-h-[180px] overflow-y-auto flex flex-col gap-[4px]">
              {available.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => add(s.id)}
                  className="flex items-center gap-[12px] py-[9px] px-[12px] rounded-[10px] border border-line bg-raised text-left cursor-pointer hover:border-emerald/40"
                >
                  <span className="w-[3px] h-[18px] rounded-[2px] flex-none" style={{ background: s.genreColor }} />
                  <span className="flex-1 min-w-0 font-sans font-medium text-[13px] leading-[normal] text-ink-body">{s.title}</span>
                  <span className="font-mono font-medium text-[11px] leading-[normal] text-ink-muted flex-none">{s.key} · {s.dur}</span>
                  <Plus size={15} strokeWidth={2.2} className="flex-none" style={{ color: 'var(--color-emerald)' }} />
                </button>
              ))}
              {available.length === 0 && (
                <p className="m-0 font-sans font-normal text-[12.5px] leading-[normal] text-ink-dim">{t.noResults}</p>
              )}
            </div>
          </div>

          {/* actions */}
          <div className="flex gap-[10px] justify-end">
            <Button variant="surface" onClick={cancel} className="py-[9px] px-[16px]">
              {t.cancel}
            </Button>
            <Button variant="primary" onClick={save} className="py-[9px] px-[16px]">
              {t.save}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
