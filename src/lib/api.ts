/**
 * Supabase data layer: fetch + map rows into the domain shapes `vm.ts` consumes,
 * and the write mutations the actions call. Pure functions over `supabase` —
 * no React. `data.tsx` wraps these with a demo fallback and a reload hook.
 */
import { supabase } from './supabase';
import type {
  BandEvent, EventFeedback, EventType, Gear, GearCondition, GenreId, Instrument, LinkKind, Member, Proficiency, ProofKind, RsvpStatus, Song, Take, Thread, Transaction, TxCategory, TxKind, VocalFlag,
} from '../types';

type Row = Record<string, any>;

export interface DataSnapshot {
  songs: Song[];
  events: BandEvent[];
  transactions: Transaction[];
  gear: Gear[];
  threads: Thread[];
  members: Member[];
  /** Shared instrument catalog (basic + custom). */
  instruments: Instrument[];
  /** Song recordings ("takes") on practice events. */
  takes: Take[];
  /** Thread ids the current user has upvoted. */
  myThreadVotes: string[];
  /** event id → poll option index the current user picked. */
  myPollPicks: Record<string, number>;
}

const groupBy = (rows: Row[], key: string): Map<string, Row[]> => {
  const m = new Map<string, Row[]>();
  for (const r of rows) {
    const k = r[key];
    if (k == null) continue;
    const arr = m.get(k) ?? [];
    arr.push(r);
    m.set(k, arr);
  }
  return m;
};

const shortName = (name: string): string => name.split(/\s+/)[0];
const initials = (name: string): string =>
  name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const newId = (prefix: string): string =>
  prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ------------------------------------------------------------------ members */
function mapMembers(profiles: Row[], instruments: Row[], vocals: Row[]): Member[] {
  const instr = groupBy(instruments, 'profile_id');
  const voc = groupBy(vocals, 'profile_id');
  return profiles.map((p) => ({
    id: p.id,
    name: p.name,
    short: shortName(p.name),
    initial: initials(p.name),
    role: p.role,
    title: { es: p.title_es ?? '', en: p.title_en ?? '' },
    email: p.email ?? '',
    joined: (p.joined_at ?? '').slice(0, 10),
    instruments: (instr.get(p.id) ?? []).map((i) => ({
      id: i.instrument_id,
      lv: i.proficiency,
    })),
    vocals: (voc.get(p.id) ?? []).map((v) => v.flag),
  }));
}

/* ------------------------------------------------------------- instruments */
function mapInstruments(rows: Row[]): Instrument[] {
  return rows.map((i) => ({
    id: i.id,
    name: { es: i.name_es, en: i.name_en },
    isBasic: !!i.is_basic,
  }));
}

/* ------------------------------------------------------------------- takes */
function mapTakes(rows: Row[]): Take[] {
  return rows.map((r) => ({
    id: r.id,
    eventId: r.event_id,
    songId: r.song_id,
    url: r.url,
    n: r.n,
  }));
}

/* -------------------------------------------------------------------- songs */
function mapSongs(rows: Row[], songInstruments: Row[], songLinks: Row[]): Song[] {
  const instrBySong = groupBy(songInstruments, 'song_id');
  const linksBySong = groupBy(songLinks, 'song_id');
  return rows.map((s) => ({
    id: s.id,
    title: s.title_es ?? s.title_en,
    genre: s.genre,
    key: s.key,
    bpm: s.bpm,
    dur: s.duration,
    last: s.last_rehearsed_at ?? null,
    instruments: (instrBySong.get(s.id) ?? []).map((r) => r.instrument_id),
    links: (linksBySong.get(s.id) ?? [])
      .sort((a, b) => a.position - b.position)
      .map((l) => ({ kind: l.kind as LinkKind, label: { es: l.label_es, en: l.label_en }, url: l.url })),
  }));
}

/* ------------------------------------------------------------------ events */
function buildFeedback(
  fbRows: Row[],
  poll: Row | undefined,
  optsByPoll: Map<string, Row[]>,
  votesByOpt: Map<string, Row[]>,
  memberShort: Map<string, string>,
): EventFeedback {
  const n = fbRows.length;
  const avg = (k: string): number => fbRows.reduce((a, r) => a + Number(r[k] ?? 0), 0) / n;
  const entry = (r: Row, es: string, en: string) => ({
    by: r.anonymous ? null : (memberShort.get(r.profile_id) ?? null),
    anon: !!r.anonymous,
    text: { es: r[es] ?? '', en: r[en] ?? '' },
  });
  const options = poll
    ? (optsByPoll.get(poll.id) ?? []).map((o) => ({
        label: { es: o.label_es, en: o.label_en },
        v: (votesByOpt.get(o.id) ?? []).length,
      }))
    : [];
  return {
    sound: avg('sound'),
    perf: avg('performance'),
    log: avg('logistics'),
    energy: avg('energy'),
    responses: n,
    well: fbRows.filter((r) => r.went_well_es || r.went_well_en).map((r) => entry(r, 'went_well_es', 'went_well_en')),
    improve: fbRows.filter((r) => r.improve_es || r.improve_en).map((r) => entry(r, 'improve_es', 'improve_en')),
    poll: {
      q: { es: poll?.question_es ?? '', en: poll?.question_en ?? '' },
      options,
    },
  };
}

function mapEvents(
  events: Row[],
  eventSongs: Row[],
  eventMedia: Row[],
  attendance: Row[],
  feedback: Row[],
  polls: Row[],
  pollOptions: Row[],
  pollVotes: Row[],
  members: Member[],
): BandEvent[] {
  const songsByEvent = groupBy(eventSongs, 'event_id');
  const mediaByEvent = groupBy(eventMedia, 'event_id');
  const attByEvent = groupBy(attendance, 'event_id');
  const fbByEvent = groupBy(feedback, 'event_id');
  const pollsByEvent = groupBy(polls, 'event_id');
  const optsByPoll = groupBy(pollOptions, 'poll_id');
  const votesByOpt = groupBy(pollVotes, 'option_id');
  const memberShort = new Map(members.map((m) => [m.id, m.short]));

  return events.map((e) => {
    const att = attByEvent.get(e.id) ?? [];
    const fbRows = fbByEvent.get(e.id) ?? [];
    const poll = pollsByEvent.get(e.id)?.[0];
    return {
      id: e.id,
      type: e.type,
      state: e.state,
      date: (e.starts_at ?? '').slice(0, 10),
      time: (e.starts_at ?? '').slice(11, 16),
      hours: e.duration_hours != null ? Number(e.duration_hours) : undefined,
      title: { es: e.title_es, en: e.title_en },
      venue: e.venue,
      fee: (e.fee_cents ?? 0) / 100,
      cost: (e.cost_cents ?? 0) / 100,
      settled: !!e.settled,
      setlist: (songsByEvent.get(e.id) ?? [])
        .sort((a, b) => a.position - b.position)
        .map((s) => s.song_id),
      attend: e.attend ?? 0,
      attendance: att.length ? Object.fromEntries(att.map((a) => [a.profile_id, a.status])) : undefined,
      note: { es: e.note_es ?? '', en: e.note_en ?? '' },
      flyer: e.flyer_url ?? undefined,
      prevDate: e.previous_starts_at ? e.previous_starts_at.slice(0, 10) : undefined,
      media: (mediaByEvent.get(e.id) ?? []).map((m) => ({ label: { es: m.label_es, en: m.label_en }, url: m.url })),
      feedback: fbRows.length ? buildFeedback(fbRows, poll, optsByPoll, votesByOpt, memberShort) : undefined,
    };
  });
}

/* ------------------------------------------------------------ transactions */
function mapTransactions(rows: Row[]): Transaction[] {
  return rows.map((t) => ({
    id: t.id,
    kind: t.kind,
    amt: (t.amount_cents ?? 0) / 100,
    date: t.occurred_on,
    by: t.created_by,
    desc: { es: t.description_es, en: t.description_en },
    proof: t.proof_url ?? null,
    proofKind: t.proof_kind,
    event: t.event_id ?? undefined,
    gear: t.gear_id ?? undefined,
    category: t.category ?? undefined,
    contributor: t.contributor_id ?? undefined,
  }));
}

/* -------------------------------------------------------------------- gear */
function mapGear(rows: Row[], transactions: Row[]): Gear[] {
  const txByGear = new Map(transactions.filter((t) => t.gear_id).map((t) => [t.gear_id, t.id]));
  return rows.map((g) => ({
    id: g.id,
    name: { es: g.name_es, en: g.name_en },
    cost: (g.cost_cents ?? 0) / 100,
    date: g.purchased_on,
    holder: g.custodian_id,
    tx: txByGear.get(g.id),
    cond: g.condition,
    note: { es: g.note_es ?? '', en: g.note_en ?? '' },
    boughtBy: g.purchased_by ?? undefined,
  }));
}

/* ----------------------------------------------------------------- threads */
function mapThreads(threads: Row[], votes: Row[], comments: Row[]): Thread[] {
  const votesByThread = groupBy(votes, 'thread_id');
  const commentsByThread = groupBy(comments, 'thread_id');
  return threads.map((b) => ({
    id: b.id,
    by: b.author_id,
    date: (b.created_at ?? '').slice(0, 10),
    votes: (votesByThread.get(b.id) ?? []).length,
    title: { es: b.title_es, en: b.title_en },
    body: { es: b.body_es, en: b.body_en },
    comments: (commentsByThread.get(b.id) ?? [])
      .sort((a, b) => a.id - b.id)
      .map((c) => ({ by: c.author_id, text: { es: c.body_es, en: c.body_en } })),
  }));
}

/* ------------------------------------------------------------------ fetch */
export async function fetchAll(userId: string | null): Promise<DataSnapshot> {
  const [
    profiles, profileInstruments, vocals, songs, songInstruments, songLinks, events, eventSongs, eventMedia, attendance,
    feedback, polls, pollOptions, pollVotes, gear, transactions, threads, threadVotes, threadComments, instruments, takes,
  ] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('profile_instruments').select('*'),
    supabase.from('profile_vocals').select('*'),
    supabase.from('songs').select('*'),
    supabase.from('song_instruments').select('*'),
    supabase.from('song_links').select('*'),
    supabase.from('events').select('*'),
    supabase.from('event_songs').select('*'),
    supabase.from('event_media').select('*'),
    supabase.from('event_attendance').select('*'),
    supabase.from('feedback').select('*'),
    supabase.from('polls').select('*'),
    supabase.from('poll_options').select('*'),
    supabase.from('poll_votes').select('*'),
    supabase.from('gear').select('*'),
    supabase.from('transactions').select('*'),
    supabase.from('threads').select('*'),
    supabase.from('thread_votes').select('*'),
    supabase.from('thread_comments').select('*'),
    supabase.from('instruments').select('*'),
    supabase.from('takes').select('*'),
  ]);

  const members = mapMembers(profiles.data ?? [], profileInstruments.data ?? [], vocals.data ?? []);
  const tx = mapTransactions(transactions.data ?? []);

  const myThreadVotes = userId
    ? (threadVotes.data ?? []).filter((v) => v.profile_id === userId).map((v) => v.thread_id)
    : [];

  const myPollPicks: Record<string, number> = {};
  if (userId) {
    for (const v of (pollVotes.data ?? []).filter((v) => v.profile_id === userId)) {
      const opt = (pollOptions.data ?? []).find((o) => o.id === v.option_id);
      if (!opt) continue;
      const poll = (polls.data ?? []).find((p) => p.id === opt.poll_id);
      if (!poll) continue;
      const opts = (pollOptions.data ?? []).filter((o) => o.poll_id === poll.id).sort((a, b) => a.id - b.id);
      const idx = opts.findIndex((o) => o.id === opt.id);
      if (idx >= 0) myPollPicks[poll.event_id] = idx;
    }
  }

  return {
    songs: mapSongs(songs.data ?? [], songInstruments.data ?? [], songLinks.data ?? []),
    events: mapEvents(
      events.data ?? [], eventSongs.data ?? [], eventMedia.data ?? [], attendance.data ?? [],
      feedback.data ?? [], polls.data ?? [], pollOptions.data ?? [], pollVotes.data ?? [], members,
    ),
    transactions: tx,
    gear: mapGear(gear.data ?? [], transactions.data ?? []),
    threads: mapThreads(threads.data ?? [], threadVotes.data ?? [], threadComments.data ?? []),
    members,
    instruments: mapInstruments(instruments.data ?? []),
    takes: mapTakes(takes.data ?? []),
    myThreadVotes,
    myPollPicks,
  };
}

/* -------------------------------------------------------------- mutations */
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
  return id;
}

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
    last_rehearsed_at: null,
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

/** Replace a member's instruments + vocals (delete then insert). */
async function replaceMemberInstruments(
  profileId: string,
  instruments: { id: string; lv: Proficiency }[],
  vocals: VocalFlag[],
): Promise<void> {
  await supabase.from('profile_instruments').delete().eq('profile_id', profileId);
  if (instruments.length) {
    await supabase.from('profile_instruments').insert(
      instruments.map((i) => ({ profile_id: profileId, instrument_id: i.id, proficiency: i.lv })),
    );
  }
  await supabase.from('profile_vocals').delete().eq('profile_id', profileId);
  if (vocals.length) {
    await supabase.from('profile_vocals').insert(vocals.map((v) => ({ profile_id: profileId, flag: v })));
  }
}

/** Complete sign-up onboarding: record instruments/vocals and mark onboarded. */
export async function onboard(
  profileId: string,
  instruments: { id: string; lv: Proficiency }[],
  vocals: VocalFlag[],
): Promise<void> {
  await replaceMemberInstruments(profileId, instruments, vocals);
  await supabase.from('profiles').update({ onboarded: true }).eq('id', profileId);
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

export async function createTransaction(
  input: { kind: TxKind; amt: number; date: string; desc: string; proof: string | null; proofKind: ProofKind; event?: string; gear?: string; category?: TxCategory; contributor?: string },
  userId: string,
): Promise<void> {
  await supabase.from('transactions').insert({
    id: newId('y'),
    kind: input.kind,
    amount_cents: Math.round(input.amt * 100),
    occurred_on: input.date,
    description_es: input.desc,
    description_en: input.desc,
    proof_url: input.proof,
    proof_kind: input.proofKind,
    event_id: input.event ?? null,
    gear_id: input.gear ?? null,
    category: input.category ?? null,
    contributor_id: input.contributor ?? null,
    created_by: userId,
  });
}

/** Upload a receipt/invoice image to the public `receipts` bucket; returns its public URL. */
export async function uploadProof(file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('receipts').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('receipts').getPublicUrl(path);
  return data.publicUrl;
}

/** Register a gear purchase: insert the gear row and the matching expense transaction. */
export async function createGear(
  input: { name: string; cost: number; date: string; custodian: string; cond: GearCondition; note: string; boughtBy: string; proof: string | null; proofKind: ProofKind },
  _userId: string,
): Promise<void> {
  const id = newId('g');
  await supabase.from('gear').insert({
    id,
    name_es: input.name,
    name_en: input.name,
    cost_cents: Math.round(input.cost * 100),
    purchased_on: input.date,
    custodian_id: input.custodian,
    condition: input.cond,
    note_es: input.note,
    note_en: input.note,
    purchased_by: input.boughtBy,
  });
  // Only log an expense movement when the gear actually cost something.
  if (input.cost > 0) {
    await supabase.from('transactions').insert({
      id: newId('y'),
      kind: 'out',
      amount_cents: Math.round(input.cost * 100),
      occurred_on: input.date,
      description_es: 'Compra — ' + input.name,
      description_en: 'Purchase — ' + input.name,
      proof_url: input.proof,
      proof_kind: input.proofKind,
      gear_id: id,
      created_by: input.boughtBy,
    });
  }
}

export async function settleEvent(
  eventId: string,
  input: { happened: boolean; fee: number; cost: number },
  userId: string,
): Promise<void> {
  const { data: ev } = await supabase.from('events').select('starts_at, title_es, title_en').eq('id', eventId).single();
  const date = (ev?.starts_at ?? '').slice(0, 10);
  const titleEs = ev?.title_es ?? '';
  const titleEn = ev?.title_en ?? '';

  if (input.happened && input.fee > 0) {
    await supabase.from('transactions').insert({
      id: newId('y'),
      kind: 'in',
      amount_cents: Math.round(input.fee * 100),
      occurred_on: date,
      description_es: 'Cachet — ' + titleEs,
      description_en: 'Fee — ' + titleEn,
      proof_url: null,
      proof_kind: 'zelle',
      event_id: eventId,
      category: 'fee',
      created_by: userId,
    });
  }
  if (input.cost > 0) {
    await supabase.from('transactions').insert({
      id: newId('y'),
      kind: 'out',
      amount_cents: Math.round(input.cost * 100),
      occurred_on: date,
      description_es: 'Costo — ' + titleEs,
      description_en: 'Cost — ' + titleEn,
      proof_url: null,
      proof_kind: 'receipt',
      event_id: eventId,
      created_by: userId,
    });
  }
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

export async function voteThread(threadId: string, userId: string): Promise<void> {
  const { data } = await supabase.from('thread_votes').select('thread_id').eq('thread_id', threadId).eq('profile_id', userId);
  if (data && data.length > 0) {
    await supabase.from('thread_votes').delete().eq('thread_id', threadId).eq('profile_id', userId);
  } else {
    await supabase.from('thread_votes').insert({ thread_id: threadId, profile_id: userId });
  }
}

export async function addComment(threadId: string, body: string, userId: string): Promise<void> {
  await supabase.from('thread_comments').insert({
    thread_id: threadId,
    author_id: userId,
    body_es: body,
    body_en: body,
  });
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

export async function transferCustody(gearId: string, toMemberId: string, _userId: string): Promise<void> {
  const { data } = await supabase.from('gear').select('custodian_id').eq('id', gearId).single();
  const fromId = data?.custodian_id ?? null;
  await supabase.from('gear').update({ custodian_id: toMemberId }).eq('id', gearId);
  await supabase.from('gear_custody_log').insert({ gear_id: gearId, from_id: fromId, to_id: toMemberId });
}
