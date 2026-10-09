/** Events: lifecycle, RSVP, polls, feedback, setlist, settlement, media. */
import { supabase } from '../supabase';
import { notifyCreated } from '../notify';
import { newId } from './shared';
import type {
  EventType, RsvpStatus,
} from '../../types';

export async function createEvent(
  input: { title: string; venue: string; date: string; time: string; hours: number; fee: number; cost: number; note: string; type: EventType },
  _userId: string,
): Promise<string> {
  const startsAt = `${input.date}T${input.time || '19:00'}:00Z`;
  const id = newId('x');
  await supabase.from('events').insert({
    id,
    type: input.type,
    state: 'active',
    starts_at: startsAt,
    duration_hours: input.hours || null,
    venue: input.venue,
    fee_cents: Math.round(input.fee * 100),
    cost_cents: Math.round(input.cost * 100),
    attend: 0,
    title_es: input.title,
    title_en: input.title,
    note_es: input.note,
    note_en: input.note,
  });
  void notifyCreated({ kind: 'event', id });
  return id;
}

/** Update an event's core fields (title / type / date / time / hours / venue / fee / cost / note). */
export async function updateEvent(
  id: string,
  input: { title: string; venue: string; date: string; time: string; hours: number; fee: number; cost: number; note: string; type: EventType },
  userId: string,
): Promise<void> {
  const { data: ev } = await supabase.from('events').select('settled').eq('id', id).single();
  const startsAt = `${input.date}T${input.time || '19:00'}:00Z`;
  await supabase.from('events').update({
    type: input.type,
    starts_at: startsAt,
    duration_hours: input.hours || null,
    venue: input.venue,
    fee_cents: Math.round(input.fee * 100),
    cost_cents: Math.round(input.cost * 100),
    title_es: input.title,
    title_en: input.title,
    note_es: input.note,
    note_en: input.note,
  }).eq('id', id);
  // A settled event's ledger movements mirror its fee/cost — keep them in sync
  // so a retroactive amount change flows through to the income/expense report.
  if (ev?.settled) {
    await syncEventTransactions(id, input.fee, input.cost, userId);
  }
}

/** Pin/unpin an event — pinned events sort to the top of the calendar's upcoming/history lists. */
export async function setEventPinned(id: string, pinned: boolean): Promise<void> {
  await supabase.from('events').update({ pinned }).eq('id', id);
}

/** Cancel or reinstate an event — cancelled events move to the history list. */
export async function setEventState(id: string, state: 'active' | 'cancelled'): Promise<void> {
  await supabase.from('events').update({ state }).eq('id', id);
}

/** Add a photo or video link to an event. */
export async function addEventMedia(
  eventId: string,
  input: { kind: 'photo' | 'video'; labelEs: string; labelEn: string; url: string },
  userId: string,
): Promise<void> {
  await supabase.from('event_media').insert({
    event_id: eventId,
    kind: input.kind,
    label_es: input.labelEs,
    label_en: input.labelEn,
    url: input.url,
    submitted_by: userId || null,
  });
}

/** Add several uploaded photo URLs to an event in a single insert; resolves true on success. */
export async function addEventPhotos(eventId: string, urls: string[], userId: string): Promise<boolean> {
  if (urls.length === 0) return false;
  const { error } = await supabase.from('event_media').insert(
    urls.map((url) => ({
      event_id: eventId,
      kind: 'photo',
      label_es: '',
      label_en: '',
      url,
      submitted_by: userId || null,
    })),
  );
  return !error;
}

/** Remove an event media row; also deletes the storage object when it's an uploaded photo. */
export async function deleteEventMedia(id: number): Promise<void> {
  const { data: row } = await supabase.from('event_media').select('url').eq('id', id).single();
  await supabase.from('event_media').delete().eq('id', id);
  if (row?.url) {
    const marker = '/storage/v1/object/public/event-photos/';
    const idx = row.url.indexOf(marker);
    if (idx >= 0) {
      const path = row.url.slice(idx + marker.length);
      await supabase.storage.from('event-photos').remove([path]);
    }
  }
}

/** Upload an event photo to the public `event-photos` bucket; returns its public URL. */
export async function uploadEventPhoto(blob: Blob): Promise<string> {
  const path = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from('event-photos').upload(path, blob, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('event-photos').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Keep an event's settled ledger movements in sync with its fee/cost. The settle
 * flow tags the income movement `category = 'fee'` and creates a single expense
 * movement, so those are matched by (event, kind, category). Called on settle and
 * again when a settled event is edited, so a retroactive amount change flows
 * through to the income/expense report.
 */
async function syncEventTransactions(
  eventId: string,
  fee: number,
  cost: number,
  userId: string,
): Promise<void> {
  const { data: ev } = await supabase.from('events').select('starts_at, title_es, title_en').eq('id', eventId).single();
  const date = (ev?.starts_at ?? '').slice(0, 10);
  const titleEs = ev?.title_es ?? '';
  const titleEn = ev?.title_en ?? '';

  // Income (honorarios) — matched by the settle flow's `category = 'fee'` tag.
  const { data: feeTx } = await supabase.from('transactions').select('id').eq('event_id', eventId).eq('kind', 'in').eq('category', 'fee');
  if (fee > 0) {
    if (feeTx?.length) {
      await supabase.from('transactions').update({ amount_cents: Math.round(fee * 100) }).eq('id', feeTx[0].id);
    } else {
      await supabase.from('transactions').insert({
        id: newId('y'),
        kind: 'in',
        amount_cents: Math.round(fee * 100),
        occurred_on: date,
        description_es: 'Honorarios — ' + titleEs,
        description_en: 'Fee — ' + titleEn,
        proof_url: null,
        proof_kind: 'zelle',
        event_id: eventId,
        category: 'fee',
        created_by: userId,
      });
    }
  } else if (feeTx?.length) {
    await supabase.from('transactions').delete().eq('id', feeTx[0].id);
  }

  // Expense (cost) — the settle flow creates a single 'out' movement for the event.
  const { data: costTx } = await supabase.from('transactions').select('id').eq('event_id', eventId).eq('kind', 'out');
  if (cost > 0) {
    if (costTx?.length) {
      await supabase.from('transactions').update({ amount_cents: Math.round(cost * 100) }).eq('id', costTx[0].id);
    } else {
      await supabase.from('transactions').insert({
        id: newId('y'),
        kind: 'out',
        amount_cents: Math.round(cost * 100),
        occurred_on: date,
        description_es: 'Costo — ' + titleEs,
        description_en: 'Cost — ' + titleEn,
        proof_url: null,
        proof_kind: 'receipt',
        event_id: eventId,
        created_by: userId,
      });
    }
  } else if (costTx?.length) {
    await supabase.from('transactions').delete().eq('id', costTx[0].id);
  }
}

export async function settleEvent(
  eventId: string,
  input: { happened: boolean; fee: number; cost: number },
  userId: string,
): Promise<void> {
  // A cancelled event still records its cost (e.g. a lost deposit), so only the
  // income is gated on `happened`.
  await syncEventTransactions(eventId, input.happened ? input.fee : 0, input.cost, userId);
  await supabase.from('events').update({ settled: true }).eq('id', eventId);
}

export async function setRsvp(eventId: string, status: RsvpStatus | null, userId: string): Promise<void> {
  if (status === null) {
    await supabase.from('event_attendance').delete().eq('event_id', eventId).eq('profile_id', userId);
  } else {
    await supabase.from('event_attendance').upsert({
      event_id: eventId,
      profile_id: userId,
      status,
      updated_at: new Date().toISOString(),
    });
  }
}

export async function submitFeedback(
  eventId: string,
  input: { sound: number; perf: number; log: number; energy: number; well: string; improve: string; anon: boolean },
  userId: string,
): Promise<void> {
  await supabase.from('feedback').upsert({
    event_id: eventId,
    profile_id: userId,
    anonymous: input.anon,
    sound: input.sound,
    performance: input.perf,
    logistics: input.log,
    energy: input.energy,
    went_well_es: input.well,
    went_well_en: input.well,
    improve_es: input.improve,
    improve_en: input.improve,
  });
}

export async function pickPoll(eventId: string, optionIndex: number, userId: string): Promise<void> {
  const { data: polls } = await supabase.from('polls').select('id').eq('event_id', eventId);
  const poll = polls?.[0];
  if (!poll) return;
  const { data: opts } = await supabase.from('poll_options').select('id').eq('poll_id', poll.id).order('id');
  const opt = opts?.[optionIndex];
  if (!opt) return;
  const optIds = (opts ?? []).map((o) => o.id);
  await supabase.from('poll_votes').delete().in('option_id', optIds).eq('profile_id', userId);
  await supabase.from('poll_votes').insert({ option_id: opt.id, profile_id: userId });
}

export async function setEventSetlist(eventId: string, songIds: string[], _userId: string): Promise<void> {
  await supabase.from('event_songs').delete().eq('event_id', eventId);
  if (songIds.length) {
    await supabase.from('event_songs').insert(
      songIds.map((songId, i) => ({ event_id: eventId, song_id: songId, position: i + 1 })),
    );
  }
}
