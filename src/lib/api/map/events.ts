/** Read side: map PostgREST rows into events domain shapes. */
import { type Row, groupBy } from '../shared';
import type { BandEvent, EventFeedback, Member } from '../../../types';

/* ------------------------------------------------------------------ events */
export function buildFeedback(
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

export function mapEvents(
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
