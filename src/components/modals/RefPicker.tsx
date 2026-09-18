/**
 * Structured "reference a song/event" picker for the forum composers. A search box
 * filters the chosen pool (songs / events); tapping a row adds a removable chip.
 * The same references are also recorded from @-mentions (see src/lib/mentions.ts).
 */
import { useMemo, useState } from 'react';
import { Music, Plus, Search, X } from 'lucide-react';
import { useGuataca } from '@/store';
import { Input, Pill, Segment } from '@/components/ui';
import type { EventVm, SongVm } from '@/store/vm';

export interface PickedRef {
  kind: 'song' | 'event';
  id: string;
}

export function RefPicker({
  selected,
  onChange,
}: {
  selected: PickedRef[];
  onChange: (refs: PickedRef[]) => void;
}) {
  const { t, L, songs, events } = useGuataca();
  const [tab, setTab] = useState<'song' | 'event'>('song');
  const [q, setQ] = useState('');

  const byId = useMemo(() => {
    const m = new Map<string, { kind: 'song' | 'event'; title: string; sub: string }>();
    for (const s of songs) m.set(s.id, { kind: 'song', title: s.title, sub: `${s.key} · ${s.dur}` });
    for (const e of events) m.set(e.id, { kind: 'event', title: e.title, sub: e.dateStr });
    return m;
  }, [songs, events]);

  const query = q.trim().toLowerCase();
  const pool = tab === 'song' ? songs : events;
  const available = pool.filter(
    (x) => !selected.some((r) => r.kind === tab && r.id === x.id) && (!query || x.title.toLowerCase().includes(query)),
  );

  const add = (id: string) => onChange([...selected, { kind: tab, id }]);
  const remove = (i: number) => onChange(selected.filter((_, n) => n !== i));

  return (
    <div>
      <div className="flex items-center justify-between mb-[9px]">
        <div className="font-display font-semibold text-[10.5px] leading-[normal] tracking-[.11em] uppercase text-ink-muted">{t.references}</div>
        <Segment role="group" aria-label={t.references}>
          <Pill active={tab === 'song'} onClick={() => setTab('song')} color="var(--color-emerald)">
            <Music size={12} strokeWidth={2.2} className="inline-block mr-1 -mt-[1px]" />
            {t.refSongs}
          </Pill>
          <Pill active={tab === 'event'} onClick={() => setTab('event')} color="var(--color-violet)">
            {t.refEvents}
          </Pill>
        </Segment>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-[6px] mb-[9px]">
          {selected.map((r, i) => {
            const meta = byId.get(r.id);
            return (
              <span
                key={r.kind + r.id}
                className="inline-flex items-center gap-[7px] py-[5px] pl-[11px] pr-[6px] rounded-[20px] text-[12px] font-sans font-medium"
                style={{
                  background: 'color-mix(in srgb, ' + (r.kind === 'song' ? 'var(--color-emerald)' : 'var(--color-violet)') + ' 13%, transparent)',
                  color: r.kind === 'song' ? 'var(--color-emerald-light)' : 'var(--color-violet-lighter)',
                  border: '1px solid color-mix(in srgb, ' + (r.kind === 'song' ? 'var(--color-emerald)' : 'var(--color-violet)') + ' 35%, transparent)',
                }}
              >
                {meta?.title ?? L({ es: '¿Eliminado?', en: 'Removed?' })}
                <button
                  type="button"
                  title={t.removeRef}
                  aria-label={t.removeRef}
                  onClick={() => remove(i)}
                  className="grid place-items-center w-[18px] h-[18px] rounded-full bg-black/15 text-current cursor-pointer hover:bg-black/30 p-0 border-none"
                >
                  <X size={11} strokeWidth={2.4} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="relative mb-[9px]">
        <Search size={14} strokeWidth={1.9} className="absolute left-[11px] top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-ink-dim)' }} />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.searchRefs} className="pl-[34px]" />
      </div>

      <div className="max-h-[150px] overflow-y-auto flex flex-col gap-[4px]">
        {available.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => add(x.id)}
            className="flex items-center gap-[12px] py-[8px] px-[12px] rounded-[10px] border border-line bg-raised text-left cursor-pointer hover:border-emerald/40"
          >
            <span className="w-[3px] h-[18px] rounded-[2px] flex-none" style={{ background: tab === 'song' ? (x as SongVm).genreColor : 'var(--color-violet)' }} />
            <span className="flex-1 min-w-0 font-sans font-medium text-[13px] leading-[normal] text-ink-body truncate">{x.title}</span>
            <span className="font-mono font-medium text-[11px] leading-[normal] text-ink-muted flex-none">{tab === 'song' ? `${(x as SongVm).key} · ${(x as SongVm).dur}` : (x as EventVm).dateStr}</span>
            <Plus size={15} strokeWidth={2.2} className="flex-none" style={{ color: tab === 'song' ? 'var(--color-emerald)' : 'var(--color-violet)' }} />
          </button>
        ))}
        {available.length === 0 && <p className="m-0 font-sans font-normal text-[12.5px] leading-[normal] text-ink-dim">{t.noResults}</p>}
      </div>
    </div>
  );
}
