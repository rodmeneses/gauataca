/** Read side: load the whole snapshot via the per-entity mappers in `./map`. */
import { supabase } from '../supabase';
import type { DataSnapshot } from './shared';
import type { BandLink, LinkCategory } from '../../types';
import { mapMembers, mapInstruments } from './map/members';
import { mapSongs, mapTakes } from './map/songs';
import { mapEvents } from './map/events';
import { mapTransactions, mapGear } from './map/ledger';
import { mapThreads } from './map/forum';
import { mapAvailability } from './map/availability';

/* ------------------------------------------------------------------ fetch */
export async function fetchAll(userId: string | null): Promise<DataSnapshot> {
  const [
    profiles, profileInstruments, vocals, songs, songInstruments, songLinks, events, eventSongs, eventMedia, eventLinks, attendance,
    feedback, polls, pollOptions, pollVotes, gear, transactions, threads, threadReactions, threadComments, threadCommentReactions,
    threadMedia, threadRefs, threadPolls, threadPollOptions, threadPollVotes, instruments, takes, links,
    availabilityPolls, availabilityDates, availabilityVotes,
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
    supabase.from('event_links').select('*'),
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
    supabase.from('links').select('*').order('created_at', { ascending: false }),
    supabase.from('availability_polls').select('*'),
    supabase.from('availability_dates').select('*'),
    supabase.from('availability_votes').select('*'),
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
      events.data ?? [], eventSongs.data ?? [], eventMedia.data ?? [], eventLinks.data ?? [], attendance.data ?? [],
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
    availability: mapAvailability(availabilityPolls.data ?? [], availabilityDates.data ?? [], availabilityVotes.data ?? []),
    myPollPicks,
  };
}
