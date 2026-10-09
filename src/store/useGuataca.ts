/**
 * The one hook every view/modal uses. Returns the current state, all derived
 * view-models and every action — the typed equivalent of the design's renderVals().
 */
import { useMemo } from 'react';
import { T, type Dict } from '../i18n';
import { COLOR_TOKENS, GENRES, GENRE_IDS, HANDOFF_NOTES, TOUR_STEPS, TYPE_SCALE } from '../data';
import { money, money0 } from '../lib/format';
import type { BandEvent, Member, Profile, RsvpStatus, Song, Transaction, View } from '../types';
import { useStore } from './store';
import { writeLangPref, writeThemePref } from '../lib/prefs';
import { itemUrl } from '../lib/deepLink';
import { searchAll } from '../lib/search';
import { useAuth } from '../lib/auth';
import { useData } from '../lib/data';
import { UNDO_WINDOW_MS } from '../lib/optimistic';
import { compressImage } from '../lib/image';
import { useMediaQuery } from '../lib/useMediaQuery';
import { bucketEvents, contributionTotals, filterPalette, filterSongs, filterTx, layoutTier, ledgerTotals, mergeInstruments, pinnedFirst, sortTxNewestFirst } from './derive';
import { L, contributionVm, eventVm, feedbackVm, gearVm, igCaption, memberById, memberVm, songVm, threadVm, txVm, type Ctx } from './vm';

import type { Guataca, FormVm, GenreChip, PaletteItem, SearchResult, TourVm } from './guataca.types';
export type * from './guataca.types';

function profileToMember(p: Profile): Member {
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

/** True while a poll vote is saving, so rapid taps don't stack votes or toasts. */
let votingThreadPoll = false;

export function useGuataca(): Guataca {
  const { state: st, props, set, toast, dismissToast } = useStore();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const {
    songs: dbSongs, events: dbEvents, transactions: dbTx, gear: dbGear, threads: dbThreads, members: dbMembers, links: dbLinks,
    instruments: dbInstruments, takes: dbTakes, myPollPicks, loading, mutating, error,
    createEvent, updateEvent, createSong, updateSong, setSongLinks: persistSongLinks, createTransaction, updateTransaction: persistUpdateTransaction, deleteTransaction: persistDeleteTransaction, createGear: persistGear, createInstrument: persistInstrument,
    onboard: persistOnboard, updateMemberInstruments: persistMemberInstruments, setSongInstruments: persistSongInstruments,
    addTake: persistTake, deleteTake: persistDeleteTake,
    addEventMedia: persistAddEventMedia, addEventPhotos: persistAddEventPhotos, deleteEventMedia: persistDeleteEventMedia, uploadEventPhoto: persistUploadEventPhoto,
    setRsvp: persistRsvp, setEventPinned: persistEventPinned, setEventState: persistEventState,
    createThread: persistCreateThread, addComment: persistComment, setThreadReaction: persistThreadReaction, setCommentReaction: persistCommentReaction, deleteComment: persistDeleteComment,
    setThreadPinned: persistThreadPinned, setThreadArchived: persistThreadArchived,
    addThreadMedia: persistAddThreadMedia, deleteThreadMedia: persistDeleteThreadMedia, addThreadRefs: persistThreadRefs, uploadForumPhoto: persistUploadForumPhoto,
    createThreadPoll: persistCreateThreadPoll, addThreadPollOption: persistAddThreadPollOption, voteThreadPoll: persistVoteThreadPoll,
    submitFeedback: persistFeedback, pickPoll: persistPoll, transferCustody: persistCustody,
    setEventSetlist: persistSetlist, settleEvent: persistSettle, uploadProof: persistUpload,
  } = useData();
  const isPhoneViewport = useMediaQuery('(max-width: 767.98px)');
  const isTabletViewport = useMediaQuery('(min-width: 768px) and (max-width: 1023.98px)');
  const isCoarsePointer = useMediaQuery('(pointer: coarse)');
  // Touch devices up to tablet width get the phone layout: landscape phones,
  // tablets, and "Request Desktop Site" all report > 768px but are still touch-first.
  const isMobileViewport = isPhoneViewport || (isCoarsePointer && isTabletViewport);

  return useMemo<Guataca>(() => {
    const lang = st.lang;
    const t = T[lang];
    /** Copy to the clipboard and toast the outcome — "copied" only if it really was. */
    const copyText = (text: string, okMsg: string) => {
      const fail = () => toast(t.copyFailed, 'err');
      if (!navigator.clipboard) return fail();
      navigator.clipboard.writeText(text).then(() => toast(okMsg), fail);
    };
    const isAdmin = profile?.role === 'admin' || (!user && st.role === 'admin');
    // Layout tier. `device` is the dev preview override; 'auto' follows the viewport.
    const layout = layoutTier(st.device, isMobileViewport, isTabletViewport);
    const isPhone = layout === 'phone';
    const isTablet = layout === 'tablet';
    const isMobile = isPhone; // back-compat alias
    const isDesktop = layout === 'desktop';
    const staleDays = props.staleDays || 30;
    const me = user && profile ? profileToMember(profile) : memberById(dbMembers, isAdmin ? 'm1' : 'm2');
    const instruments = mergeInstruments(dbInstruments, st.customInstruments);
    const ctx: Ctx = { lang, t, staleDays, meId: me.id, isAdmin, members: dbMembers, events: dbEvents, songs: dbSongs, gear: dbGear, instruments, takes: dbTakes };
    const Lx = (v: { es: string; en: string } | string | null | undefined) => L(lang, v);

    /* ---- raw collections (from the data layer) */
    const allSongs: Song[] = dbSongs;
    const allEvents: BandEvent[] = dbEvents;
    const allTx: Transaction[] = sortTxNewestFirst(dbTx);

    const { income, expense, balance } = ledgerTotals(allTx);

    const { upcoming: upcomingRaw, history: historyRaw, next: nextRaw } = bucketEvents(allEvents);

    const songs = allSongs.map((s) => songVm(s, allEvents, st.openSong, ctx));
    const staleSongs = songs.filter((s) => s.isStale).sort((a, b) => (a.lastDate < b.lastDate ? -1 : 1));
    const filteredSongs = filterSongs(songs, { genre: st.genre, staleOnly: st.staleOnly, query: st.q, sort: st.songSort });
    const genreChips: GenreChip[] = [
      { id: 'all', label: t.allGenres, color: 'var(--color-violet-light)', active: st.genre === 'all' },
      ...GENRE_IDS.map((k): GenreChip => ({ id: k, label: Lx(GENRES[k].label), color: GENRES[k].color, active: st.genre === k })),
    ];

    const evm = (e: BandEvent) => eventVm(e, allSongs, ctx);
    // Pinned events float to the top of each list, keeping date order within each group.
    const upcoming = pinnedFirst(upcomingRaw.map(evm));
    const history = pinnedFirst(historyRaw.map(evm));
    const events = [...upcoming, ...history];
    const nextEvent = nextRaw ? evm(nextRaw) : null;
    const dashUpcoming = upcomingRaw.filter((e) => e.state !== 'cancelled').slice(0, 3).map(evm);

    const txFiltered = filterTx(allTx, st.txFilter, st.txDate);
    const tx = txFiltered.map((x) => txVm(x, ctx));
    const recentTx = allTx.slice(0, 4).map((x) => txVm(x, ctx));

    // Voluntary contributions per member (DTV income is the org's, not a member's).
    const contributions = contributionTotals(allTx, dbMembers)
      .map((c) => contributionVm(c.member, c.total, c.month))
      .sort((a, b) => a.name.localeCompare(b.name));

    const gear = dbGear.map((g) => gearVm(g, g.holder, ctx));
    const threads = dbThreads.map((b) => threadVm(b, ctx));
    const forumList = pinnedFirst(threads.filter((b) => (st.forumTab === 'archived' ? b.archived : !b.archived)));
    const members = dbMembers.map((m) => memberVm(m, ctx));

    /* ---- modal selections */
    const modal = st.modal;
    const evSel = modal?.kind === 'event' ? allEvents.find((e) => e.id === modal.id) ?? null : null;
    const ev = evSel ? evm(evSel) : null;
    const fb = evSel?.feedback ? feedbackVm(evSel.feedback, myPollPicks[evSel.id] ?? null, ctx) : null;
    const thSel = modal?.kind === 'thread' ? dbThreads.find((x) => x.id === modal.id) ?? null : null;
    const th = thSel ? threadVm(thSel, ctx) : null;
    const mbSel = modal?.kind === 'member' ? dbMembers.find((x) => x.id === modal.id) ?? null : null;
    const mb = mbSel ? memberVm(mbSel, ctx) : null;

    /* ---- actions */
    const go = (v: View) => {
      set({ view: v, palette: false, openSong: null });
      window.scrollTo({ top: 0 });
    };
    const openShare = (eventId: string) => {
      const e = allEvents.find((x) => x.id === eventId);
      if (!e) return;
      set({ sheet: { title: Lx(e.title), caption: igCaption(e, lang), flyer: e.flyer || null }, modal: null });
    };
    const convertThread = (id: string) => {
      const b = dbThreads.find((x) => x.id === id);
      if (!b) return;
      set({ modal: { kind: 'newEvent' }, view: 'calendar', form: { title: Lx(b.title), note: Lx(b.body), type: 'gig' } });
      toast(t.ideaLoaded, 'violet');
    };

    /* ---- command palette */
    const paletteBase: Omit<PaletteItem, 'idx'>[] = [
      { group: t.navigate, label: t.dashboard, sub: '', run: () => go('dashboard') },
      { group: t.navigate, label: t.calendar, sub: '', run: () => go('calendar') },
      { group: t.navigate, label: t.repertoire, sub: '', run: () => go('repertoire') },
      { group: t.navigate, label: t.ledger, sub: '', run: () => go('ledger') },
      { group: t.navigate, label: t.brainstorm, sub: '', run: () => go('brainstorm') },
      { group: t.navigate, label: t.links, sub: '', run: () => go('links') },
      { group: t.navigate, label: t.members, sub: '', run: () => go('members') },
      { group: t.navigate, label: t.system, sub: '', run: () => go('system') },
      { group: t.actions, label: t.newEvent, sub: '', run: () => set({ palette: false, view: 'calendar', modal: { kind: 'newEvent' }, form: {} }) },
      { group: t.actions, label: t.newSong, sub: '', run: () => set({ palette: false, view: 'repertoire', modal: { kind: 'newSong' }, form: {} }) },
      { group: t.actions, label: t.newTx, sub: '', run: () => set({ palette: false, view: 'ledger', modal: { kind: 'newTx' }, form: {} }) },
      { group: t.actions, label: t.prepIg + ' — ' + (nextRaw ? Lx(nextRaw.title) : ''), sub: '', run: () => { if (nextRaw) openShare(nextRaw.id); set({ palette: false }); } },
      { group: t.actions, label: t.handoff, sub: '', run: () => set({ palette: false, handoff: true }) },
      { group: t.actions, label: t.switchLang, sub: '', run: () => set((s) => ({ lang: s.lang === 'es' ? 'en' : 'es', palette: false })) },
      { group: t.actions, label: t.roleHint, sub: '', run: () => set((s) => ({ role: s.role === 'admin' ? 'member' : 'admin', palette: false })) },
      { group: t.actions, label: user ? t.signOut : t.signIn, sub: '', run: () => { set({ palette: false }); if (!user) set({ modal: { kind: 'signin' } }); } },
      ...songs.slice(0, 40).map((s) => ({
        group: t.repertoire,
        label: s.title,
        sub: s.genreLabel + ' · ' + s.key,
        run: () => set({ palette: false, view: 'repertoire', openSong: s.id, q: '', genre: 'all', staleOnly: false }),
      })),
    ];
    const paletteResults: PaletteItem[] = filterPalette(paletteBase, st.pq);

    /* ---- global search (mobile): events, songs, fund movements, ideas, polls, links */
    const searchResults: SearchResult[] = st.search
      ? searchAll(st.sq, {
          events: allEvents.map((e) => ({ ...evm(e), date: e.date })),
          songs,
          tx: allTx.map((x) => ({ ...txVm(x, ctx), date: x.date })),
          threads: dbThreads.map((b) => ({
            ...threadVm(b, ctx),
            date: b.date,
            comments: b.comments.flatMap((c) => [c, ...c.replies]).map((c) => ({
              text: Lx(c.text),
              author: memberById(dbMembers, c.by).short,
              date: c.createdAt.slice(0, 10),
            })),
          })),
          polls: dbThreads.flatMap((b) =>
            b.poll
              ? [{
                  id: b.id,
                  date: b.date,
                  question: Lx(b.poll.question),
                  options: b.poll.options.map((o) => Lx(o.label)),
                  threadTitle: Lx(b.title),
                  author: memberById(dbMembers, b.by).short,
                }]
              : [],
          ),
          links: dbLinks.map((l) => ({
            id: l.id,
            title: l.title,
            url: l.url,
            categoryLabel: { docs: t.catDocs, music: t.catMusic, social: t.catSocial, logistics: t.catLogistics, other: t.catOther }[l.category],
            by: memberById(dbMembers, l.createdBy).short,
          })),
        }).map((h) => ({
          ...h,
          run:
            h.kind === 'event' ? () => set({ search: false, modal: { kind: 'event', id: h.id } })
            : h.kind === 'idea' || h.kind === 'poll' ? () => set({ search: false, mobileTab: 'brainstorm', view: 'brainstorm', modal: { kind: 'thread', id: h.id } })
            : h.kind === 'link' ? () => set({ search: false, modal: null, view: 'links', mobileTab: 'links' })
            : h.kind === 'song' ? () => set({ search: false, modal: null, view: 'repertoire', mobileTab: 'repertoire', openSong: h.id, scrollToSong: h.id, q: '', genre: 'all', staleOnly: false })
            : () => set({ search: false, modal: null, view: 'ledger', mobileTab: 'fund', scrollToTx: h.id, txFilter: 'all', txDate: 'all' }),
        }))
      : [];

    /* ---- tour */
    const step = TOUR_STEPS[st.tour] ?? TOUR_STEPS[0];
    const tour: TourVm = {
      on: st.tour >= 0 && st.tour < TOUR_STEPS.length,
      title: Lx(step.title),
      body: Lx(step.body),
      num: String((st.tour < 0 ? 0 : st.tour) + 1),
      total: String(TOUR_STEPS.length),
      isLast: st.tour === TOUR_STEPS.length - 1,
    };

    /* ---- forms */
    const f = st.form;
    const form: FormVm = {
      title: f.title || '', venue: f.venue || '', date: f.date || '', time: f.time || '', hours: f.hours || '', fee: f.fee || '', cost: f.cost || '', note: f.note || '',
      type: f.type || 'gig', desc: f.desc || '', amt: f.amt || '', proof: f.proof || '', proofKind: f.proofKind || 'receipt', kind: f.kind || 'in',
      event: f.event || '', gear: f.gear || '', category: f.category || 'fee', contributor: f.contributor || '',
      key: f.key || '', bpm: f.bpm || '', dur: f.dur || '', genre: f.genre || 'joropo', songLinks: f.songLinks || [],
      setlist: f.setlist || [],
      name: f.name || '', custodian: f.custodian || '', cond: f.cond || 'good', boughtBy: f.boughtBy || '',
      songInstruments: f.songInstruments || [],
      threadTitle: f.threadTitle || '', threadBody: f.threadBody || '', threadRefs: f.threadRefs || [],
    };

    const viewSubKey = ('sub' + st.view.charAt(0).toUpperCase() + st.view.slice(1)) as keyof Dict;

    /** Name the file(s) that didn't upload so a multi-photo pick says which one failed. */
    const uploadFailedMsg = (names: string[]) =>
      names.length === 1 ? t.uploadFailedFile.replace('%s', names[0]) : `${t.uploadFailed}: ${names.join(', ')}`;

    /* ---- forum photo upload (compress → bucket → attach); shared by idea
    /*      creation, the idea composer and the reply composer. */
    const uploadToThread = async (threadId: string, files: File[], commentId: number | null = null) => {
      const urls: string[] = [];
      const failed: string[] = [];
      for (const file of files) {
        try {
          let blob: Blob;
          try {
            blob = await compressImage(file);
          } catch (err) {
            // Compression can fail (unsupported format, oversized image, etc.).
            // Upload the original rather than silently dropping the photo.
            console.warn('Photo compression failed, uploading original:', file.name, err);
            blob = file;
          }
          const url = await persistUploadForumPhoto(blob);
          if (url) urls.push(url); else failed.push(file.name);
        } catch (err) {
          console.error('Photo upload failed:', file.name, err);
          failed.push(file.name);
        }
      }
      if (failed.length) toast(uploadFailedMsg(failed), 'err');
      if (urls.length === 0) return;
      const ok = await persistAddThreadMedia(threadId, urls, commentId);
      if (!ok) {
        toast(t.uploadFailed, 'err');
        return;
      }
      toast(urls.length === 1 ? t.photoUploaded : t.photosUploaded);
    };

    return {
      state: st, props, t, lang, L: Lx, isAdmin, isMember: !isAdmin, role: st.role,
      roleLabel: isAdmin ? t.admin : t.member, me, signedIn: !!user,
      bandName: props.bandName || 'GUATACA',
      view: st.view, viewTitle: t[st.view] || t.dashboard, viewSub: t[viewSubKey] || '',
      isDesktop, isMobile, layout, isPhone, isTablet, isCoarsePointer, isMobileViewport, staleDays, loading, mutating, error,

      songs, filteredSongs, staleSongs, genreChips,
      events, upcoming, history, calList: st.calTab === 'upcoming' ? upcoming : history, nextEvent, dashUpcoming,
      tx, recentTx, txFilter: st.txFilter, txDate: st.txDate,
      contributions,
      gear, gearValue: money0(dbGear.reduce((a, b) => a + b.cost, 0)),
      threads, forumList, members, instruments,

      balanceStr: money(balance), balanceNeg: balance < 0, incomeStr: money(income), expenseStr: money(expense),
      txCount: String(allTx.length), statSongs: String(allSongs.length),
      statUpcoming: String(upcomingRaw.filter((e) => e.state === 'active').length),
      statStale: String(staleSongs.length), staleHint: t.staleHint.replace('%d', String(staleDays)),

      modal, ev, fb, th, mb, mbRaw: mbSel,
      sheet: st.sheet, custody: st.custody, custodyTargets: dbMembers, settle: st.settle, form, paletteResults, searchResults, tour,
      toasts: st.toasts.map((x) => ({
        ...x,
        color: x.tone === 'violet' ? 'var(--color-violet-light)' : x.tone === 'err' ? 'var(--color-rose)' : 'var(--color-emerald)',
        border: x.tone === 'violet' ? 'color-mix(in srgb, var(--color-violet) 40%, transparent)' : x.tone === 'err' ? 'color-mix(in srgb, var(--color-rose) 40%, transparent)' : 'color-mix(in srgb, var(--color-emerald) 40%, transparent)',
        bg: x.tone === 'violet' ? 'var(--color-tint-violet)' : x.tone === 'err' ? 'var(--color-tint-rose)' : 'var(--color-tint-emerald)',
      })),
      tokens: COLOR_TOKENS.map((k) => ({ name: k.name, varName: k.varName, tw: k.tw, use: Lx(k.use) })),
      typeScale: TYPE_SCALE,
      handoffNotes: HANDOFF_NOTES.map((s) => ({ h: Lx(s.h), items: s.items.map((i) => Lx(i).replace('%STALE%', String(staleDays))) })),

      go,
      setLang: (l) => { writeLangPref(l); set({ lang: l }); },
      theme: st.theme,
      setTheme: (tp) => { writeThemePref(tp); set({ theme: tp }); },
      toggleRole: () => {
        const nx = isAdmin ? 'member' : 'admin';
        set({ role: nx, modal: null });
        toast(nx === 'admin' ? t.admin : t.memberView, nx === 'admin' ? 'ok' : 'violet');
      },
      setDevice: (dv) => set({ device: dv }),
      setCalTab: (tab) => set({ calTab: tab }),
      setForumTab: (tab) => set({ forumTab: tab }),
      setMobileTab: (tab) => set({ mobileTab: tab }),
      toggleSong: (id) => set((s) => ({ openSong: s.openSong === id ? null : id })),
      goToSong: (id) => set({ view: 'repertoire', mobileTab: 'repertoire', openSong: id, scrollToSong: id, q: '', genre: 'all', staleOnly: false, modal: null, palette: false }),
      clearScrollToSong: () => set({ scrollToSong: null }),
      goToTx: (id) => set({ view: 'ledger', mobileTab: 'fund', scrollToTx: id, modal: null, palette: false }),
      clearScrollToTx: () => set({ scrollToTx: null }),
      copyLink: (kind, id, commentId) => {
        copyText(itemUrl(kind, id, commentId), t.linkCopied);
      },
      setQ: (v) => set({ q: v }),
      setGenre: (g) => set({ genre: g }),
      toggleStale: () => set((s) => ({ staleOnly: !s.staleOnly })),
      setSongSort: (s) => set({ songSort: s }),
      openEvent: (id) => set({ modal: { kind: 'event', id } }),
      openThread: (id, commentId) => set({ modal: { kind: 'thread', id, commentId } }),
      openMember: (id, edit) => set({ modal: { kind: 'member', id, edit } }),
      openNewEvent: () => set({ modal: { kind: 'newEvent' }, form: {} }),
      openEditEvent: (id) => {
        const e = allEvents.find((x) => x.id === id);
        if (!e) return;
        set({
          modal: { kind: 'newEvent', id },
          form: {
            title: Lx(e.title), venue: e.venue, date: e.date, time: e.time,
            hours: e.hours != null ? String(e.hours) : '',
            fee: e.fee ? String(e.fee) : '', cost: e.cost ? String(e.cost) : '',
            note: Lx(e.note), type: e.type, setlist: e.setlist,
          },
        });
      },
      openNewSong: () => set({ modal: { kind: 'newSong' }, form: {} }),
      openEditSong: (id) => {
        const s = dbSongs.find((x) => x.id === id);
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
      // Pre-select the logged-in user as the contributor — the common case is
      // logging your own contribution; admins can change it for someone else.
      openNewTx: () => set({ modal: { kind: 'newTx' }, form: { contributor: me.id } }),
      openEditTx: (id) => {
        const x = allTx.find((t) => t.id === id);
        if (!x) return;
        set({
          modal: { kind: 'newTx', id },
          form: {
            kind: x.kind, amt: String(x.amt), date: x.date, desc: Lx(x.desc),
            proof: x.proof || '', proofKind: x.proofKind,
            event: x.event || '', gear: x.gear || '',
            category: x.category, contributor: x.contributor || '',
          },
        });
      },
      openNewGear: () => set({ modal: { kind: 'newGear' }, form: { custodian: me.id, boughtBy: me.id } }),
      openNewThread: () => set({ modal: { kind: 'newThread' }, form: {} }),
      onboard: async (instruments, vocals) => {
        await persistOnboard(instruments, vocals);
        await refreshProfile();
        set({ modal: null, onboardDismissed: true });
        toast(t.onboarded);
      },
      openOnboard: () => set({ modal: { kind: 'onboard' } }),
      skipOnboard: () => set({ modal: null, onboardDismissed: true }),
      saveMemberInstruments: async (profileId, instruments, vocals) => {
        await persistMemberInstruments(profileId, instruments, vocals);
        toast(t.instrumentsSaved);
      },
      createInstrument: async (name) => {
        const id = (await persistInstrument(name)) ?? 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        set((s) => ({ customInstruments: [...s.customInstruments, { id, name: { es: name, en: name } }] }));
        return id;
      },
      setTxFilter: (f) => set({ txFilter: f }),
      setTxDate: (d) => set({ txDate: d }),
      openSignIn: () => set({ modal: { kind: 'signin' } }),
      openNotifications: () => set({ modal: { kind: 'notifications' } }),
      openChangelog: (since) => set({ modal: { kind: 'changelog', since } }),
      signOut,
      closeModal: () => set({ modal: null }),
      openShare,
      closeSheet: () => set({ sheet: null }),
      copyCaption: () => {
        const c = st.sheet?.caption;
        if (!c) return;
        copyText(c, t.copied);
      },
      shareNow: () => {
        const s = st.sheet;
        if (!s) return;
        if (typeof navigator.share === 'function') navigator.share({ text: s.caption }).catch(() => {});
        else toast(t.shareIntent, 'violet');
      },
      openFlyer: () => {
        const s = st.sheet;
        if (s?.flyer) window.open(s.flyer, '_blank', 'noopener');
        toast(t.openingFlyer, 'violet');
      },
      openCustody: (gearId) => {
        const g = gear.find((x) => x.id === gearId);
        if (!g) return;
        set({ custody: { id: g.id, name: g.name, holder: g.holder } });
      },
      closeCustody: () => set({ custody: null }),
      transferCustody: async (memberId) => {
        const c = st.custody;
        if (!c) return;
        set({ custody: null });
        await persistCustody(c.id, memberId);
        toast(t.custodyTo + memberById(dbMembers, memberId).short);
      },
      openSettle: (eventId) => {
        const e = allEvents.find((x) => x.id === eventId);
        if (!e) return;
        set({ settle: { id: e.id, title: Lx(e.title), fee: e.fee, cost: e.cost } });
      },
      closeSettle: () => set({ settle: null }),
      settleEvent: async (eventId, input) => {
        set({ settle: null });
        await persistSettle(eventId, input);
        toast(t.eventSettled);
      },
      setRsvp: async (eventId, status) => {
        const current = events.find((e) => e.id === eventId)?.rsvp ?? null;
        const next: RsvpStatus | null = current === status ? null : status;
        await persistRsvp(eventId, next);
        toast(t.rsvpSaved);
      },
      toggleEventPin: async (eventId) => {
        const e = allEvents.find((x) => x.id === eventId);
        if (!e) return;
        await persistEventPinned(eventId, !e.pinned);
        toast(e.pinned ? t.unpinned : t.pinned);
      },
      toggleEventCancelled: async (eventId) => {
        const e = allEvents.find((x) => x.id === eventId);
        if (!e) return;
        const cancel = e.state !== 'cancelled';
        await persistEventState(eventId, cancel ? 'cancelled' : 'active');
        toast(cancel ? t.eventCancelled : t.eventReinstated);
      },
      setEventSetlist: async (eventId, songIds) => {
        await persistSetlist(eventId, songIds);
        toast(t.setlistSaved);
      },
      addTake: async (eventId, songId, url) => {
        await persistTake(eventId, songId, url);
        toast(t.recordingAdded);
      },
      deleteTake: async (id) => {
        await persistDeleteTake(id);
        toast(t.recordingDeleted);
      },
      addEventVideo: async (eventId, label, url) => {
        await persistAddEventMedia(eventId, 'video', label, url);
        toast(t.mediaAdded);
      },
      addEventPhotos: async (eventId, files) => {
        const urls: string[] = [];
        const failed: string[] = [];
        for (const file of files) {
          try {
            let blob: Blob;
            try {
              blob = await compressImage(file);
            } catch (err) {
              // Compression can fail (unsupported format, oversized image, etc.).
              // Upload the original rather than silently dropping the photo.
              console.warn('Photo compression failed, uploading original:', file.name, err);
              blob = file;
            }
            const url = await persistUploadEventPhoto(blob);
            if (url) urls.push(url); else failed.push(file.name);
          } catch (err) {
            console.error('Photo upload failed:', file.name, err);
            failed.push(file.name);
          }
        }
        if (failed.length) toast(uploadFailedMsg(failed), 'err');
        if (urls.length === 0) return;
        const ok = await persistAddEventPhotos(eventId, urls);
        if (!ok) {
          toast(t.uploadFailed, 'err');
          return;
        }
        toast(urls.length === 1 ? t.photoUploaded : t.photosUploaded);
      },
      deleteEventMedia: async (id) => {
        await persistDeleteEventMedia(id);
        toast(t.mediaRemoved);
      },
      setCommentDraft: (v) => set({ commentDraft: v }),
      setReplyTarget: (target) => set({ replyTarget: target, replyDraft: '' }),
      setReplyDraft: (s) => set({ replyDraft: s }),
      // compress → upload → attach to a thread or one of its comments; shared by
      // idea creation, the idea composer and the reply composer.
      addThreadPhotos: async (threadId, files, commentId = null) => {
        await uploadToThread(threadId, files, commentId);
      },
      deleteThreadMedia: async (id) => {
        await persistDeleteThreadMedia(id);
        toast(t.mediaRemoved);
      },
      addThreadRefs: async (threadId, refs, commentId = null) => {
        if (refs.length) await persistThreadRefs(threadId, refs, commentId);
      },
      setThreadReaction: async (threadId, kind) => {
        await persistThreadReaction(threadId, kind);
      },
      setCommentReaction: async (commentId, kind) => {
        await persistCommentReaction(commentId, kind);
      },
      deleteComment: async (commentId) => {
        const undo = persistDeleteComment(commentId);
        toast(t.commentDeleted, 'ok', { action: { label: t.undo, run: undo }, ttl: UNDO_WINDOW_MS });
      },
      sendComment: async (photos) => {
        const txt = st.commentDraft.trim();
        if (!txt || !thSel) return;
        set({ commentDraft: '' });
        const cid = await persistComment(thSel.id, txt, null);
        if (cid && photos && photos.length) await uploadToThread(thSel.id, photos, cid);
        toast(t.commentPosted);
      },
      sendReply: async (photos) => {
        const txt = st.replyDraft.trim();
        const target = st.replyTarget;
        if (!txt || !thSel || target == null) return;
        set({ replyDraft: '', replyTarget: null });
        const cid = await persistComment(thSel.id, txt, target);
        if (cid && photos && photos.length) await uploadToThread(thSel.id, photos, cid);
        toast(t.replyPosted);
      },
      saveThread: async (photos, poll) => {
        const title = (f.threadTitle || '').trim();
        const body = f.threadBody || '';
        const refs = f.threadRefs || [];
        set({ modal: null, form: {} });
        if (!title && !body) return;
        const id = await persistCreateThread({ title: title || '…', body });
        if (!id) return;
        if (refs.length) await persistThreadRefs(id, refs);
        const pollOpts = (poll?.options ?? []).map((o) => o.trim()).filter(Boolean);
        if (poll && (poll.question || '').trim() && pollOpts.length >= 2) {
          await persistCreateThreadPoll(id, poll.question.trim(), pollOpts, !!poll.multiple);
        }
        if (photos.length) await uploadToThread(id, photos);
        toast(t.ideaCreated);
      },
      convertThread,
      toggleThreadPin: async (id) => {
        const b = dbThreads.find((x) => x.id === id);
        if (!b) return;
        await persistThreadPinned(id, !b.pinned);
        toast(b.pinned ? t.unpinned : t.pinned);
      },
      toggleThreadArchive: async (id) => {
        const b = dbThreads.find((x) => x.id === id);
        if (!b) return;
        await persistThreadArchived(id, !b.archived);
        toast(b.archived ? t.unarchived : t.archived);
      },
      addThreadPollOption: async (label) => {
        const l = label.trim();
        if (!thSel?.poll || !l) return;
        await persistAddThreadPollOption(thSel.id, l);
        toast(t.optionAdded);
      },
      voteThreadPoll: async (optionId) => {
        if (votingThreadPoll) return;
        votingThreadPoll = true;
        try {
          const removing = !!thSel?.poll?.myOptionIds.includes(optionId);
          await persistVoteThreadPoll(optionId);
          toast(removing ? t.voteRemoved : t.voted);
        } finally {
          votingThreadPoll = false;
        }
      },
      pickPoll: async (i) => {
        if (!evSel) return;
        await persistPoll(evSel.id, i);
        toast(t.voted);
      },
      setRating: (k, n) => set((s) => ({ myRatings: { ...s.myRatings, [k]: n } })),
      toggleAnon: () => set((s) => ({ anon: !s.anon })),
      setFbWell: (v) => set({ fbWell: v }),
      setFbImprove: (v) => set({ fbImprove: v }),
      submitFb: async () => {
        if (!evSel) return;
        await persistFeedback(evSel.id, {
          sound: st.myRatings.sound, perf: st.myRatings.perf, log: st.myRatings.log, energy: st.myRatings.energy,
          well: st.fbWell, improve: st.fbImprove, anon: st.anon,
        });
        toast(t.fbSubmitted);
      },
      setForm: (k, v) => set((s) => ({ form: { ...s.form, [k]: v } })),
      uploadProof: async (file) => {
        try {
          const url = await persistUpload(file);
          return url ?? null;
        } catch {
          toast(t.uploadFailed, 'err');
          return null;
        }
      },
      saveEvent: async () => {
        const editingId = st.modal?.kind === 'newEvent' ? st.modal.id : undefined;
        const dte = f.date || '2026-11-07';
        const songIds = f.setlist || [];
        set({ modal: null, form: {} });
        const input = {
          title: f.title || 'Evento nuevo', venue: f.venue || 'Bay Area, CA', date: dte, time: f.time || '19:00', hours: +(f.hours || 0),
          fee: +(f.fee || 0), cost: +(f.cost || 0), note: f.note || '', type: f.type || 'gig',
        };
        if (editingId) {
          await updateEvent(editingId, input);
          await persistSetlist(editingId, songIds);
        } else {
          const id = await createEvent(input);
          if (id && songIds.length) await persistSetlist(id, songIds);
        }
        toast(editingId ? t.eventSaved : t.eventCreated);
      },
      saveTx: async () => {
        const editingId = st.modal?.kind === 'newTx' ? st.modal.id : undefined;
        set({ modal: null, form: {} });
        const input = {
          kind: f.kind || 'in', amt: +(f.amt || 0), date: f.date || '2026-08-25', desc: f.desc || 'Movimiento', proof: f.proof || null,
          proofKind: f.proofKind || 'receipt', event: f.event || undefined, gear: f.gear || undefined,
          category: (f.kind || 'in') === 'in' ? (f.category || undefined) : undefined,
          // DTV income is the org's — never attribute it to a member.
          contributor: f.category === 'DTV' ? undefined : f.contributor || undefined,
        };
        if (editingId) {
          await persistUpdateTransaction(editingId, input);
        } else {
          await createTransaction(input);
        }
        toast(editingId ? t.txSaved : t.txLogged);
      },
      deleteTx: async (id) => {
        await persistDeleteTransaction(id);
        toast(t.txDeleted);
      },
      saveSong: async () => {
        const editingId = st.modal?.kind === 'newSong' ? st.modal.id : undefined;
        const songInstruments = f.songInstruments || [];
        const songLinks = f.songLinks || [];
        set({ modal: null, form: {} });
        const input = { title: f.title || 'Canción nueva', genre: f.genre || 'joropo', key: f.key || 'Am', bpm: +(f.bpm || 120), dur: f.dur || '3:30' };
        if (editingId) {
          await updateSong(editingId, input);
          await persistSongLinks(editingId, songLinks);
          await persistSongInstruments(editingId, songInstruments);
        } else {
          const id = await createSong(input);
          if (id) {
            if (songLinks.length) await persistSongLinks(id, songLinks);
            if (songInstruments.length) await persistSongInstruments(id, songInstruments);
          }
        }
        toast(editingId ? t.songSaved : t.songAdded);
      },
      saveGear: async () => {
        set({ modal: null, form: {} });
        await persistGear({
          name: f.name || 'Equipo nuevo', cost: +(f.cost || 0), date: f.date || '2026-08-25', custodian: f.custodian || me.id,
          cond: f.cond || 'good', note: f.note || '', boughtBy: f.boughtBy || me.id, proof: f.proof || null, proofKind: f.proofKind || 'receipt',
        });
        toast(t.gearCreated);
      },
      openPalette: () => set({ palette: true, pq: '' }),
      closePalette: () => set({ palette: false }),
      setPq: (v) => set({ pq: v }),
      openSearch: () => set({ search: true, sq: '' }),
      closeSearch: () => set({ search: false }),
      setSq: (v) => set({ sq: v }),
      tourNext: () => set((s) => ({ tour: s.tour + 1 })),
      tourEnd: () => set({ tour: -1 }),
      toggleHandoff: () => set((s) => ({ handoff: !s.handoff })),
      closeHandoff: () => set({ handoff: false }),
      toast,
      dismissToast,
    };
  }, [st, props, set, toast, dismissToast, user, profile, signOut, refreshProfile, dbSongs, dbEvents, dbTx, dbGear, dbThreads, dbMembers, dbLinks, dbInstruments, dbTakes, myPollPicks, loading, mutating, error, isTabletViewport, isCoarsePointer, isMobileViewport, createEvent, updateEvent, createSong, updateSong, persistSongLinks, createTransaction, persistUpdateTransaction, persistDeleteTransaction, persistGear, persistInstrument, persistOnboard, persistMemberInstruments, persistSongInstruments, persistTake, persistDeleteTake, persistAddEventMedia, persistAddEventPhotos, persistDeleteEventMedia, persistUploadEventPhoto, persistRsvp, persistCreateThread, persistComment, persistThreadReaction, persistCommentReaction, persistDeleteComment, persistAddThreadMedia, persistDeleteThreadMedia, persistThreadRefs, persistUploadForumPhoto, persistCreateThreadPoll, persistAddThreadPollOption, persistVoteThreadPoll, persistFeedback, persistPoll, persistCustody, persistSetlist, persistSettle, persistUpload, persistEventPinned, persistEventState, persistThreadArchived, persistThreadPinned]);
}
