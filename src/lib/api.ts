/**
 * Supabase data layer: fetch + map rows into the domain shapes `vm.ts` consumes,
 * and the write mutations the actions call. Pure functions over `supabase` —
 * no React. `data.tsx` wraps these with a reload hook.
 */
import { supabase } from './supabase';
import { notifyCreated } from './notify';
import type {
  BandEvent, EventFeedback, EventType, Gear, GearCondition, GenreId, Instrument, LinkKind, Member, Proficiency, ProofKind, ReactionKind, RsvpStatus, Song, Take, Thread, ThreadComment, ThreadPoll, Transaction, TxCategory, TxKind, VocalFlag,
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
      media: (mediaByEvent.get(e.id) ?? []).map((m) => ({ id: m.id, kind: m.kind, label: { es: m.label_es, en: m.label_en }, url: m.url })),
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
function tallyReactions(rows: Row[], userId: string | null): { tally: { like: number; dislike: number }; mine: ReactionKind | null } {
  let like = 0;
  let dislike = 0;
  let mine: ReactionKind | null = null;
  for (const r of rows) {
    if (r.kind === 'like') like += 1;
    else dislike += 1;
    if (userId && r.profile_id === userId) mine = r.kind;
  }
  return { tally: { like, dislike }, mine };
}

function mapThreads(
  threads: Row[],
  threadReactions: Row[],
  commentReactions: Row[],
  comments: Row[],
  media: Row[],
  refs: Row[],
  threadPolls: Row[],
  threadPollOptions: Row[],
  threadPollVotes: Row[],
  userId: string | null,
): Thread[] {
  const reactionsByThread = groupBy(threadReactions, 'thread_id');
  const reactionsByComment = groupBy(commentReactions, 'comment_id');
  const mediaByThread = groupBy(media, 'thread_id');
  const refsByThread = groupBy(refs, 'thread_id');
  const commentsByThread = groupBy(comments, 'thread_id');
  const pollsByThread = groupBy(threadPolls, 'thread_id');
  const optsByPoll = groupBy(threadPollOptions, 'poll_id');
  const votesByOpt = groupBy(threadPollVotes, 'option_id');

  const pollFor = (threadId: string): ThreadPoll | undefined => {
    const poll = pollsByThread.get(threadId)?.[0];
    if (!poll) return undefined;
    const opts = (optsByPoll.get(poll.id) ?? []).sort((a, b) => a.id - b.id);
    let myOptionId: number | null = null;
    const options = opts.map((o) => {
      const rows = votesByOpt.get(o.id) ?? [];
      if (userId && rows.some((v) => v.profile_id === userId)) myOptionId = o.id;
      return { id: o.id, label: { es: o.label_es, en: o.label_en }, votes: rows.length };
    });
    return { question: { es: poll.question_es, en: poll.question_en }, options, myOptionId };
  };

  const commentVm = (c: Row): ThreadComment => {
    const r = tallyReactions(reactionsByComment.get(c.id) ?? [], userId);
    return {
      id: c.id,
      parentId: c.parent_id,
      by: c.author_id,
      text: { es: c.body_es, en: c.body_en },
      createdAt: c.created_at,
      reactions: r.tally,
      myReaction: r.mine,
      media: (mediaByThread.get(c.thread_id) ?? [])
        .filter((m) => m.comment_id === c.id)
        .map((m) => ({ id: m.id, url: m.url, authorId: m.author_id })),
      refs: (refsByThread.get(c.thread_id) ?? [])
        .filter((r2) => r2.comment_id === c.id)
        .map((r2) => ({ id: r2.id, kind: r2.ref_kind, refId: r2.ref_id })),
      replies: [],
    };
  };

  return threads.map((b) => {
    const sorted = (commentsByThread.get(b.id) ?? []).sort((a, c) => a.id - c.id);
    const r = tallyReactions(reactionsByThread.get(b.id) ?? [], userId);
    return {
      id: b.id,
      by: b.author_id,
      date: (b.created_at ?? '').slice(0, 10),
      title: { es: b.title_es, en: b.title_en },
      body: { es: b.body_es, en: b.body_en },
      reactions: r.tally,
      myReaction: r.mine,
      media: (mediaByThread.get(b.id) ?? []).filter((m) => m.comment_id == null).map((m) => ({ id: m.id, url: m.url, authorId: m.author_id })),
      refs: (refsByThread.get(b.id) ?? []).filter((m) => m.comment_id == null).map((m) => ({ id: m.id, kind: m.ref_kind, refId: m.ref_id })),
      comments: sorted
        .filter((c) => c.parent_id == null)
        .map((c) => {
          const cm = commentVm(c);
          cm.replies = sorted.filter((r2) => r2.parent_id === c.id).map(commentVm);
          return cm;
        }),
      poll: pollFor(b.id),
    };
  });
}

/* ------------------------------------------------------------------ fetch */
export async function fetchAll(userId: string | null): Promise<DataSnapshot> {
  const [
    profiles, profileInstruments, vocals, songs, songInstruments, songLinks, events, eventSongs, eventMedia, attendance,
    feedback, polls, pollOptions, pollVotes, gear, transactions, threads, threadReactions, threadComments, threadCommentReactions,
    threadMedia, threadRefs, threadPolls, threadPollOptions, threadPollVotes, instruments, takes,
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
    supabase.from('thread_reactions').select('*'),
    supabase.from('thread_comments').select('*'),
    supabase.from('thread_comment_reactions').select('*'),
    supabase.from('thread_media').select('*'),
    supabase.from('thread_refs').select('*'),
    supabase.from('thread_polls').select('*'),
    supabase.from('thread_poll_options').select('*'),
    supabase.from('thread_poll_votes').select('*'),
    supabase.from('instruments').select('*'),
    supabase.from('takes').select('*'),
  ]);

  const members = mapMembers(profiles.data ?? [], profileInstruments.data ?? [], vocals.data ?? []);
  const tx = mapTransactions(transactions.data ?? []);

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
    threads: mapThreads(
      threads.data ?? [], threadReactions.data ?? [], threadCommentReactions.data ?? [], threadComments.data ?? [],
      threadMedia.data ?? [], threadRefs.data ?? [], threadPolls.data ?? [], threadPollOptions.data ?? [], threadPollVotes.data ?? [], userId,
    ),
    members,
    instruments: mapInstruments(instruments.data ?? []),
    takes: mapTakes(takes.data ?? []),
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

/** Replace a member's instruments + vocals (delete then insert). */
export async function updateMemberInstruments(
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
  await updateMemberInstruments(profileId, instruments, vocals);
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

/** Update an existing transaction's fields (amount, kind, date, desc, proof, links, category). */
export async function updateTransaction(
  id: string,
  input: { kind: TxKind; amt: number; date: string; desc: string; proof: string | null; proofKind: ProofKind; event?: string; gear?: string; category?: TxCategory; contributor?: string },
  _userId: string,
): Promise<void> {
  await supabase.from('transactions').update({
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
  }).eq('id', id);
}

/** Delete a transaction. */
export async function deleteTransaction(id: string): Promise<void> {
  await supabase.from('transactions').delete().eq('id', id);
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

/* ------------------------------------------------------------- event media */
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

/** Create a forum idea; returns its id. */
export async function createThread(input: { title: string; body: string }, userId: string): Promise<string> {
  const id = newId('t');
  await supabase.from('threads').insert({
    id,
    author_id: userId,
    title_es: input.title,
    title_en: input.title,
    body_es: input.body,
    body_en: input.body,
  });
  void notifyCreated({ kind: 'thread', id });
  return id;
}

/** Add a comment (or, with `parentId`, a one-level reply) to an idea; returns the new comment id. */
export async function addComment(threadId: string, body: string, userId: string, parentId: number | null = null): Promise<number> {
  const { data } = await supabase.from('thread_comments').insert({
    thread_id: threadId,
    parent_id: parentId,
    author_id: userId,
    body_es: body,
    body_en: body,
  }).select('id').single();
  const cid = data?.id ?? 0;
  if (cid) void notifyCreated({ kind: 'comment', id: threadId, commentId: cid });
  return cid;
}

/** Attach a poll (question + options) to an idea, created alongside it. */
export async function createThreadPoll(
  threadId: string,
  question: string,
  options: string[],
  _userId: string,
): Promise<void> {
  const { data } = await supabase.from('thread_polls').insert({
    thread_id: threadId,
    question_es: question,
    question_en: question,
  }).select('id').single();
  const pollId = data?.id;
  if (pollId && options.length) {
    await supabase.from('thread_poll_options').insert(
      options.map((o) => ({ poll_id: pollId, label_es: o, label_en: o })),
    );
  }
}

/** Set the signed-in member's vote on a poll option; re-picking moves the vote. */
export async function voteThreadPoll(optionId: number, userId: string): Promise<void> {
  const { data: opt } = await supabase.from('thread_poll_options').select('poll_id').eq('id', optionId).single();
  const pollId = opt?.poll_id;
  if (!pollId) return;
  const { data: opts } = await supabase.from('thread_poll_options').select('id').eq('poll_id', pollId);
  const optIds = (opts ?? []).map((o) => o.id);
  await supabase.from('thread_poll_votes').delete().in('option_id', optIds).eq('profile_id', userId);
  await supabase.from('thread_poll_votes').insert({ option_id: optionId, profile_id: userId });
}

/** Set the signed-in member's like/dislike on an idea; `null` removes it. */
export async function setThreadReaction(threadId: string, kind: ReactionKind | null, userId: string): Promise<void> {
  if (kind === null) {
    await supabase.from('thread_reactions').delete().eq('thread_id', threadId).eq('profile_id', userId);
  } else {
    await supabase.from('thread_reactions').upsert(
      { thread_id: threadId, profile_id: userId, kind },
      { onConflict: 'thread_id,profile_id' },
    );
    if (kind === 'like') void notifyCreated({ kind: 'reaction', id: threadId });
  }
}

/** Set the signed-in member's like/dislike on a comment; `null` removes it. */
export async function setCommentReaction(commentId: number, kind: ReactionKind | null, userId: string): Promise<void> {
  if (kind === null) {
    await supabase.from('thread_comment_reactions').delete().eq('comment_id', commentId).eq('profile_id', userId);
  } else {
    await supabase.from('thread_comment_reactions').upsert(
      { comment_id: commentId, profile_id: userId, kind },
      { onConflict: 'comment_id,profile_id' },
    );
    if (kind === 'like') void notifyCreated({ kind: 'reaction', commentId });
  }
}

/** Attach uploaded photo URLs to an idea or one of its comments; true on success. */
export async function addThreadMedia(threadId: string, urls: string[], userId: string, commentId: number | null = null): Promise<boolean> {
  if (urls.length === 0) return false;
  const { error } = await supabase.from('thread_media').insert(
    urls.map((url) => ({ thread_id: threadId, comment_id: commentId, url, author_id: userId })),
  );
  return !error;
}

/** Remove a thread-media row; also deletes the storage object when it's an uploaded photo. */
export async function deleteThreadMedia(id: number): Promise<void> {
  const { data: row } = await supabase.from('thread_media').select('url').eq('id', id).single();
  await supabase.from('thread_media').delete().eq('id', id);
  if (row?.url) {
    const marker = '/storage/v1/object/public/forum-photos/';
    const idx = row.url.indexOf(marker);
    if (idx >= 0) {
      const path = row.url.slice(idx + marker.length);
      await supabase.storage.from('forum-photos').remove([path]);
    }
  }
}

/** Attach song/event references to an idea or one of its comments, skipping dups; true on success. */
export async function addThreadRefs(
  threadId: string,
  refs: { kind: 'song' | 'event'; id: string }[],
  userId: string,
  commentId: number | null = null,
): Promise<boolean> {
  if (refs.length === 0) return false;
  const { data: existing } = await supabase
    .from('thread_refs')
    .select('ref_kind, ref_id')
    .eq('thread_id', threadId)
    .eq('comment_id', commentId);
  const have = new Set((existing ?? []).map((r) => `${r.ref_kind}:${r.ref_id}`));
  const fresh = refs.filter((r) => !have.has(`${r.kind}:${r.id}`));
  if (fresh.length === 0) return true;
  const { error } = await supabase.from('thread_refs').insert(
    fresh.map((r) => ({ thread_id: threadId, comment_id: commentId, ref_kind: r.kind, ref_id: r.id, author_id: userId })),
  );
  return !error;
}

/** Upload a forum photo to the public `forum-photos` bucket; returns its public URL. */
export async function uploadForumPhoto(blob: Blob): Promise<string> {
  const path = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from('forum-photos').upload(path, blob, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('forum-photos').getPublicUrl(path);
  return data.publicUrl;
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
