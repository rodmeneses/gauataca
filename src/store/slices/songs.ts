/** Repertoire: filters, the song form and saving songs. */
import type { GenreId, SongSort } from '../../types';
import { normalizeUrl, parseNum } from '../../lib/validate';
import type { ActionCtx } from './ctx';

export interface SongActions {
  toggleSong: (id: string) => void;
  setQ: (q: string) => void;
  setGenre: (g: GenreId | 'all') => void;
  toggleStale: () => void;
  setSongSort: (s: SongSort) => void;
  openNewSong: () => void;
  openEditSong: (id: string) => void;
  saveSong: () => Promise<void>;
}

export function songActions({ st, set, toast, t, Lx, data }: ActionCtx): SongActions {
  const f = st.form;
  return {
    toggleSong: (id) => set((s) => ({ openSong: s.openSong === id ? null : id })),
    setQ: (v) => set({ q: v }),
    setGenre: (g) => set({ genre: g }),
    toggleStale: () => set((s) => ({ staleOnly: !s.staleOnly })),
    setSongSort: (s) => set({ songSort: s }),
    openNewSong: () => set({ modal: { kind: 'newSong' }, form: {} }),
    openEditSong: (id) => {
      const s = data.songs.find((x) => x.id === id);
      if (!s) return;
      set({
        modal: { kind: 'newSong', id },
        form: {
          title: s.title, genre: s.genre, key: s.key, bpm: String(s.bpm), dur: s.dur,
          songInstruments: s.instruments || [],
          songLinks: (s.links || []).map((l) => ({ kind: l.kind, label: Lx(l.label), url: l.url })),
        },
      });
    },
    saveSong: async () => {
      const editingId = st.modal?.kind === 'newSong' ? st.modal.id : undefined;
      const songInstruments = f.songInstruments || [];
      const songLinks = (f.songLinks || [])
        .filter((l) => l.url.trim())
        .map((l) => ({ ...l, label: l.label.trim(), url: normalizeUrl(l.url) ?? l.url.trim() }));
      set({ modal: null, form: {} });
      const input = { title: (f.title || '').trim() || 'Canción nueva', genre: f.genre || 'joropo', key: f.key || 'Am', bpm: parseNum(f.bpm) || 120, dur: f.dur || '3:30' };
      if (editingId) {
        await data.updateSong(editingId, input);
        await data.setSongLinks(editingId, songLinks);
        await data.setSongInstruments(editingId, songInstruments);
      } else {
        const id = await data.createSong(input);
        if (id) {
          if (songLinks.length) await data.setSongLinks(id, songLinks);
          if (songInstruments.length) await data.setSongInstruments(id, songInstruments);
        }
      }
      toast(editingId ? t.songSaved : t.songAdded);
    },
  };
}
