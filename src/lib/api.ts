/**
 * Supabase data layer: fetch + map rows into the domain shapes `vm.ts` consumes,
 * and the write mutations the actions call. Pure functions over `supabase` —
 * no React. `data.tsx` wraps these with a demo fallback and a reload hook.
 */
import { supabase } from './supabase';
import type {
  BandEvent, EventFeedback, EventType, Gear, GenreId, Member, RsvpStatus, Song, Thread, Transaction, TxKind,
} from '../types';

type Row = Record<string, any>;

export interface DataSnapshot {
  songs: Song[];
  events: BandEvent[];
  transactions: Transaction[];
  gear: Gear[];
  threads: Thread[];
  members: Member[];
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
      n: { es: i.instrument_es, en: i.instrument_en },
      lv: i.proficiency,
    })),
    vocals: (voc.get(p.id) ?? []).map((v) => v.flag),
  }));
}

/* -------------------------------------------------------------------- songs */
function mapSongs(rows: Row[]): Song[] {
  return rows.map((s) => ({
    id: s.id,
    title: s.title_es ?? s.title_en,
    genre: s.genre,
    key: s.key,
    bpm: s.bpm,
    dur: s.duration,
    last: s.last_rehearsed_at ?? null,
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
      money: (e.fee_cents ?? 0) / 100,
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
    profiles, instruments, vocals, songs, events, eventSongs, eventMedia, attendance,
    feedback, polls, pollOptions, pollVotes, gear, transactions, threads, threadVotes, threadComments,
  ] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('profile_instruments').select('*'),
    supabase.from('profile_vocals').select('*'),
    supabase.from('songs').select('*'),
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
  ]);

  const members = mapMembers(profiles.data ?? [], instruments.data ?? [], vocals.data ?? []);
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
    songs: mapSongs(songs.data ?? []),
    events: mapEvents(
      events.data ?? [], eventSongs.data ?? [], eventMedia.data ?? [], attendance.data ?? [],
      feedback.data ?? [], polls.data ?? [], pollOptions.data ?? [], pollVotes.data ?? [], members,
    ),
    transactions: tx,
    gear: mapGear(gear.data ?? [], transactions.data ?? []),
    threads: mapThreads(threads.data ?? [], threadVotes.data ?? [], threadComments.data ?? []),
    members,
    myThreadVotes,
    myPollPicks,
  };
}

/* -------------------------------------------------------------- mutations */
export async function createEvent(
  input: { title: string; venue: string; date: string; time: string; hours: number; money: number; note: string; type: EventType },
  _userId: string,
): Promise<void> {
  const startsAt = `${input.date}T${input.time || '19:00'}:00Z`;
  await supabase.from('events').insert({
    id: newId('x'),
    type: input.type,
    state: 'active',
    starts_at: startsAt,
    duration_hours: input.hours || null,
    venue: input.venue,
    fee_cents: Math.round(input.money * 100),
    attend: 0,
    title_es: input.title,
    title_en: input.title,
    note_es: input.note,
    note_en: input.note,
  });
}

export async function createSong(
  input: { title: string; genre: GenreId; key: string; bpm: number; dur: string },
  _userId: string,
): Promise<void> {
  await supabase.from('songs').insert({
    id: newId('z'),
    title_es: input.title,
    title_en: input.title,
    genre: input.genre,
    key: input.key,
    bpm: input.bpm,
    duration: input.dur,
    last_rehearsed_at: null,
  });
}

export async function createTransaction(
  input: { kind: TxKind; amt: number; date: string; desc: string; proof: string | null },
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
    proof_kind: 'receipt',
    created_by: userId,
  });
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
