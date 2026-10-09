/** Songs: repertoire, links, required instruments, takes, instrument catalog. */
import { supabase } from '../supabase';
import { newId } from './shared';
import type {
  GenreId, LinkKind,
} from '../../types';

export async function createSong(
  input: { title: string; genre: GenreId; key: string; bpm: number; dur: string },
  _userId: string,
): Promise<string> {
  const id = newId('z');
  await supabase.from('songs').insert({
    id,
    title_es: input.title,
    title_en: input.title,
    genre: input.genre,
    key: input.key,
    bpm: input.bpm,
    duration: input.dur,
  });
  return id;
}

/** Update a song's core fields (title / genre / key / bpm / duration). */
export async function updateSong(
  id: string,
  input: { title: string; genre: GenreId; key: string; bpm: number; dur: string },
  _userId: string,
): Promise<void> {
  await supabase.from('songs').update({
    title_es: input.title,
    title_en: input.title,
    genre: input.genre,
    key: input.key,
    bpm: input.bpm,
    duration: input.dur,
  }).eq('id', id);
}

/** Replace a song's links (delete then insert, preserving order via position). */
export async function setSongLinks(
  songId: string,
  links: { kind: LinkKind; label: string; url: string }[],
): Promise<void> {
  await supabase.from('song_links').delete().eq('song_id', songId);
  if (links.length) {
    await supabase.from('song_links').insert(
      links.map((l, i) => ({ song_id: songId, kind: l.kind, label_es: l.label, label_en: l.label, url: l.url, position: i + 1 })),
    );
  }
}

/** Create a custom instrument in the catalog; returns its id. */
export async function createInstrument(name: string): Promise<string> {
  const id = newId('i');
  await supabase.from('instruments').insert({ id, name_es: name, name_en: name, is_basic: false });
  return id;
}

/** Replace a song's required instruments. */
export async function setSongInstruments(songId: string, instrumentIds: string[]): Promise<void> {
  await supabase.from('song_instruments').delete().eq('song_id', songId);
  if (instrumentIds.length) {
    await supabase.from('song_instruments').insert(instrumentIds.map((iid) => ({ song_id: songId, instrument_id: iid })));
  }
}

/** Add a recording ("take") of a song during a practice event. */
export async function addTake(eventId: string, songId: string, url: string): Promise<void> {
  const { data } = await supabase.from('takes').select('n').eq('song_id', songId).order('n', { ascending: false }).limit(1);
  const n = (data?.[0]?.n ?? 0) + 1;
  await supabase.from('takes').insert({ id: newId('k'), event_id: eventId, song_id: songId, url, n });
}

/** Remove a recording ("take"). */
export async function deleteTake(id: string): Promise<void> {
  await supabase.from('takes').delete().eq('id', id);
}
