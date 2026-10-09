/** Read side: fetch every table and map rows into the domain shapes `vm.ts` consumes. */
import { supabase } from '../supabase';
import { retry } from '../retry';
import { Row, groupBy, shortName, initials } from './shared';
import type {
  BandEvent, BandLink, LinkCategory, EventFeedback, Gear, Instrument, LinkKind, Member, ReactionKind, ReactionTally, Song, Take, Thread, ThreadComment, ThreadPoll, Transaction,
} from '../../types';

export interface DataSnapshot {
  songs: Song[];
  events: BandEvent[];
  transactions: Transaction[];
  gear: Gear[];
  threads: Thread[];
  links: BandLink[];
  members: Member[];
  /** Shared instrument catalog (basic + custom). */
  instruments: Instrument[];
  /** Song recordings ("takes") on practice events. */
  takes: Take[];
  /** event id → poll option index the current user picked. */
  myPollPicks: Record<string, number>;
}

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
      pinned: !!e.pinned,
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
function tallyReactions(rows: Row[], userId: string | null): { tally: ReactionTally; mine: ReactionKind | null } {
  const likedBy: string[] = [];
  const dislikedBy: string[] = [];
  let mine: ReactionKind | null = null;
  for (const r of rows) {
    (r.kind === 'like' ? likedBy : dislikedBy).push(r.profile_id);
    if (userId && r.profile_id === userId) mine = r.kind;
  }
  return { tally: { like: likedBy.length, dislike: dislikedBy.length, likedBy, dislikedBy }, mine };
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
    const myOptionIds: number[] = [];
    const options = opts.map((o) => {
      const rows = votesByOpt.get(o.id) ?? [];
      if (userId && rows.some((v) => v.profile_id === userId)) myOptionIds.push(o.id);
      return { id: o.id, label: { es: o.label_es, en: o.label_en }, votes: rows.length, voterIds: rows.map((v) => v.profile_id) };
    });
    return { question: { es: poll.question_es, en: poll.question_en }, options, multiple: !!poll.multiple, myOptionIds };
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

  // Newest first; the store's pinnedFirst sort is stable, so this order holds within pinned/unpinned.
  const newestFirst = [...threads].sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
  return newestFirst.map((b) => {
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
      pinned: !!b.pinned,
      archived: !!b.archived,
    };
  });
}

/* ------------------------------------------------------------------ fetch */

/** A read that throws on a Supabase error (instead of silently yielding empty data), retried once on a flaky connection. */
const read = <T,>(query: () => PromiseLike<{ data: T; error: { message: string } | null }>) =>
  retry(async () => {
    const res = await query();
    if (res.error) throw new Error(res.error.message);
    return res;
  }, { tries: 2, timeoutMs: 15000 });

export async function fetchAll(userId: string | null): Promise<DataSnapshot> {
  const [
    profiles, profileInstruments, vocals, songs, songInstruments, songLinks, events, eventSongs, eventMedia, attendance,
    feedback, polls, pollOptions, pollVotes, gear, transactions, threads, threadReactions, threadComments, threadCommentReactions,
    threadMedia, threadRefs, threadPolls, threadPollOptions, threadPollVotes, instruments, takes, links,
  ] = await Promise.all([
    read(() => supabase.from('profiles').select('*')),
    read(() => supabase.from('profile_instruments').select('*')),
    read(() => supabase.from('profile_vocals').select('*')),
    read(() => supabase.from('songs').select('*')),
    read(() => supabase.from('song_instruments').select('*')),
    read(() => supabase.from('song_links').select('*')),
    read(() => supabase.from('events').select('*')),
    read(() => supabase.from('event_songs').select('*')),
    read(() => supabase.from('event_media').select('*')),
    read(() => supabase.from('event_attendance').select('*')),
    read(() => supabase.from('feedback').select('*')),
    read(() => supabase.from('polls').select('*')),
    read(() => supabase.from('poll_options').select('*')),
    read(() => supabase.from('poll_votes').select('*')),
    read(() => supabase.from('gear').select('*')),
    read(() => supabase.from('transactions').select('*')),
    read(() => supabase.from('threads').select('*')),
    read(() => supabase.from('thread_reactions').select('*')),
    read(() => supabase.from('thread_comments').select('*')),
    read(() => supabase.from('thread_comment_reactions').select('*')),
    read(() => supabase.from('thread_media').select('*')),
    read(() => supabase.from('thread_refs').select('*')),
    read(() => supabase.from('thread_polls').select('*')),
    read(() => supabase.from('thread_poll_options').select('*')),
    read(() => supabase.from('thread_poll_votes').select('*')),
    read(() => supabase.from('instruments').select('*')),
    read(() => supabase.from('takes').select('*')),
    read(() => supabase.from('links').select('*').order('created_at', { ascending: false })),
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
    links: (links.data ?? []).map((l): BandLink => ({ id: l.id, title: l.title, url: l.url, category: l.category as LinkCategory, createdBy: l.created_by })),
    members,
    instruments: mapInstruments(instruments.data ?? []),
    takes: mapTakes(takes.data ?? []),
    myPollPicks,
  };
}
