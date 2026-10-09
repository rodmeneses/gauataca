/**
 * The expensive part of the `useGuataca` view-model: every list/total derived from the
 * data layer. Memoised on the data and the few state fields it actually reads — NOT on
 * form drafts, modals, toasts, palette or search state — so typing in a form no longer
 * rebuilds every song, event, transaction and thread view-model.
 */
import { useMemo } from 'react';
import { T } from '../i18n';
import { GENRES, GENRE_IDS } from '../data';
import type { BandEvent, Member, Profile, Song, Transaction } from '../types';
import { useStore } from './store';
import { useAuth } from '../lib/auth';
import { useData } from '../lib/data';
import { bucketEvents, contributionTotals, filterSongs, filterTx, ledgerTotals, mergeInstruments, pinnedFirst, sortTxNewestFirst } from './derive';
import { L, contributionVm, eventVm, gearVm, memberById, memberVm, songVm, threadVm, txVm, type Ctx } from './vm';
import type { GenreChip } from './guataca.types';

export function profileToMember(p: Profile): Member {
  return {
    id: p.id,
    name: p.name,
    short: p.name.split(/\s+/)[0],
    initial: p.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase(),
    role: p.role,
    title: { es: '', en: '' },
    email: p.email,
    joined: (p.joined_at ?? '').slice(0, 10),
    instruments: [],
    vocals: [],
  };
}

export function useDerived() {
  const { state: st, props } = useStore();
  const { user, profile } = useAuth();
  const { songs: dbSongs, events: dbEvents, transactions: dbTx, gear: dbGear, threads: dbThreads, members: dbMembers, instruments: dbInstruments, takes: dbTakes } = useData();
  const { lang, openSong, genre, staleOnly, q, songSort, calTab, txFilter, txDate, forumTab, role, customInstruments } = st;

  return useMemo(() => {
    const t = T[lang];
    const isAdmin = profile?.role === 'admin' || (!user && role === 'admin');
    const staleDays = props.staleDays || 30;
    const me = user && profile ? profileToMember(profile) : memberById(dbMembers, isAdmin ? 'm1' : 'm2');
    const instruments = mergeInstruments(dbInstruments, customInstruments);
    const ctx: Ctx = { lang, t, staleDays, meId: me.id, isAdmin, members: dbMembers, events: dbEvents, songs: dbSongs, gear: dbGear, instruments, takes: dbTakes };
    const Lx = (v: { es: string; en: string } | string | null | undefined) => L(lang, v);

    /* ---- raw collections (from the data layer) */
    const allSongs: Song[] = dbSongs;
    const allEvents: BandEvent[] = dbEvents;
    const allTx: Transaction[] = sortTxNewestFirst(dbTx);

    const { income, expense, balance } = ledgerTotals(allTx);
    const { upcoming: upcomingRaw, history: historyRaw, next: nextRaw } = bucketEvents(allEvents);

    const songs = allSongs.map((s) => songVm(s, allEvents, openSong, ctx));
    const staleSongs = songs.filter((s) => s.isStale).sort((a, b) => (a.lastDate < b.lastDate ? -1 : 1));
    const filteredSongs = filterSongs(songs, { genre, staleOnly, query: q, sort: songSort });
    const genreChips: GenreChip[] = [
      { id: 'all', label: t.allGenres, color: 'var(--color-violet-light)', active: genre === 'all' },
      ...GENRE_IDS.map((k): GenreChip => ({ id: k, label: Lx(GENRES[k].label), color: GENRES[k].color, active: genre === k })),
    ];

    const evm = (e: BandEvent) => eventVm(e, allSongs, ctx);
    // Pinned events float to the top of each list, keeping date order within each group.
    const upcoming = pinnedFirst(upcomingRaw.map(evm));
    const history = pinnedFirst(historyRaw.map(evm));
    const events = [...upcoming, ...history];
    const nextEvent = nextRaw ? evm(nextRaw) : null;
    const dashUpcoming = upcomingRaw.filter((e) => e.state !== 'cancelled').slice(0, 3).map(evm);

    const tx = filterTx(allTx, txFilter, txDate).map((x) => txVm(x, ctx));
    const recentTx = allTx.slice(0, 4).map((x) => txVm(x, ctx));

    // Voluntary contributions per member (DTV income is the org's, not a member's).
    const contributions = contributionTotals(allTx, dbMembers)
      .map((c) => contributionVm(c.member, c.total, c.month))
      .sort((a, b) => a.name.localeCompare(b.name));

    const gear = dbGear.map((g) => gearVm(g, g.holder, ctx));
    const threads = dbThreads.map((b) => threadVm(b, ctx));
    const forumList = pinnedFirst(threads.filter((b) => (forumTab === 'archived' ? b.archived : !b.archived)));
    const members = dbMembers.map((m) => memberVm(m, ctx));

    return {
      t, lang, Lx, ctx, isAdmin, staleDays, me, instruments,
      allSongs, allEvents, allTx, income, expense, balance, upcomingRaw, nextRaw,
      songs, staleSongs, filteredSongs, genreChips, evm,
      upcoming, history, events, nextEvent, dashUpcoming, calList: calTab === 'upcoming' ? upcoming : history,
      tx, recentTx, contributions, gear, threads, forumList, members,
    };
  }, [lang, openSong, genre, staleOnly, q, songSort, calTab, txFilter, txDate, forumTab, role, customInstruments, props.staleDays, user, profile, dbSongs, dbEvents, dbTx, dbGear, dbThreads, dbMembers, dbInstruments, dbTakes]);
}
