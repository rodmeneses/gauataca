/**
 * DataProvider: loads the whole dataset from Supabase and exposes it plus the
 * write mutations. Mutations write then reload silently (the on-screen data
 * stays put and swaps in place — no full-screen spinner). `mutating` is true
 * while a write + its refetch are in flight.
 */
import { createContext, useCallback, useRef, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './auth';
import { logError } from './log';
import { withTimeout } from './retry';
import * as opt from './optimistic';
import { createOfflineQueue } from './offlineQueue';
import {
  addComment as apiAddComment, addEventMedia as apiAddEventMedia, addEventPhotos as apiAddEventPhotos, addTake as apiAddTake, createEvent as apiCreateEvent, createGear as apiCreateGear, createInstrument as apiCreateInstrument, createLink as apiCreateLink, deleteLink as apiDeleteLink,
  createSong as apiCreateSong, createThread as apiCreateThread, addThreadPollOption as apiAddThreadPollOption, createThreadPoll as apiCreateThreadPoll, createTransaction as apiCreateTransaction, deleteComment as apiDeleteComment, deleteEventMedia as apiDeleteEventMedia, deleteTake as apiDeleteTake, deleteThreadMedia as apiDeleteThreadMedia, deleteTransaction as apiDeleteTransaction, buildSnapshot, fetchRaw, SCOPES, TABLES, onboard as apiOnboard, pickPoll as apiPickPoll,
  setEventPinned as apiSetEventPinned, setEventState as apiSetEventState, setEventSetlist as apiSetEventSetlist, setRsvp as apiSetRsvp, setSongInstruments as apiSetSongInstruments, setSongLinks as apiSetSongLinks,
  addThreadMedia as apiAddThreadMedia, addThreadRefs as apiAddThreadRefs, settleEvent as apiSettleEvent, setCommentReaction as apiSetCommentReaction, setThreadArchived as apiSetThreadArchived, setThreadPinned as apiSetThreadPinned, setThreadReaction as apiSetThreadReaction, submitFeedback as apiSubmitFeedback, transferCustody as apiTransferCustody, updateEvent as apiUpdateEvent, updateMemberInstruments as apiUpdateMemberInstruments, updateSong as apiUpdateSong, updateTransaction as apiUpdateTransaction, voteThreadPoll as apiVoteThreadPoll,
  uploadEventPhoto as apiUploadEventPhoto, uploadForumPhoto as apiUploadForumPhoto, uploadProof as apiUploadProof, type DataSnapshot, type RawTables, type TableName,
} from './api';
import type { EventType, LinkCategory, GearCondition, GenreId, LinkKind, Proficiency, ProofKind, ReactionKind, RsvpStatus, TxCategory, TxKind, VocalFlag } from '../types';

export interface CreateThreadInput { title: string; body: string; }
export interface CreateEventInput { title: string; venue: string; date: string; time: string; hours: number; fee: number; cost: number; note: string; type: EventType; }
export interface CreateSongInput { title: string; genre: GenreId; key: string; bpm: number; dur: string; }
export interface SongLinkInput { kind: LinkKind; label: string; url: string; }
export interface CreateTxInput { kind: TxKind; amt: number; date: string; desc: string; proof: string | null; proofKind: ProofKind; event?: string; gear?: string; category?: TxCategory; contributor?: string; }
export interface CreateGearInput { name: string; cost: number; date: string; custodian: string; cond: GearCondition; note: string; boughtBy: string; proof: string | null; proofKind: ProofKind; }
export interface FeedbackInput { sound: number; perf: number; log: number; energy: number; well: string; improve: string; anon: boolean; }

interface DataValue extends DataSnapshot {
  loading: boolean;
  /** Non-null when a live fetch failed (e.g. schema not applied yet). */
  error: string | null;
  /** True while a mutation and its follow-up refetch are in flight. */
  mutating: boolean;
  /** `tables` limits a silent reload to those tables (merged into the cached rows); omit for a full refetch. */
  reload: (opts?: { silent?: boolean; tables?: readonly TableName[] }) => Promise<void>;
  createEvent: (input: CreateEventInput) => Promise<string | undefined>;
  updateEvent: (id: string, input: CreateEventInput) => Promise<void>;
  createSong: (input: CreateSongInput) => Promise<string | undefined>;
  updateSong: (id: string, input: CreateSongInput) => Promise<void>;
  setSongLinks: (songId: string, links: SongLinkInput[]) => Promise<void>;
  createTransaction: (input: CreateTxInput) => Promise<void>;
  updateTransaction: (id: string, input: CreateTxInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  createGear: (input: CreateGearInput) => Promise<void>;
  createInstrument: (name: string) => Promise<string | undefined>;
  onboard: (instruments: { id: string; lv: Proficiency }[], vocals: VocalFlag[]) => Promise<void>;
  updateMemberInstruments: (profileId: string, instruments: { id: string; lv: Proficiency }[], vocals: VocalFlag[]) => Promise<void>;
  setSongInstruments: (songId: string, instrumentIds: string[]) => Promise<void>;
  addTake: (eventId: string, songId: string, url: string) => Promise<void>;
  deleteTake: (id: string) => Promise<void>;
  addEventMedia: (eventId: string, kind: 'photo' | 'video', label: string, url: string) => Promise<void>;
  /** Insert several uploaded photo URLs into an event in one write; resolves true on success. */
  addEventPhotos: (eventId: string, urls: string[]) => Promise<boolean | undefined>;
  deleteEventMedia: (id: number) => Promise<void>;
  /** Upload an event photo (already compressed); resolves to its public URL. */
  uploadEventPhoto: (blob: Blob) => Promise<string | undefined>;
  setRsvp: (eventId: string, status: RsvpStatus | null) => Promise<void>;
  /** Pin/unpin an event. */
  setEventPinned: (id: string, pinned: boolean) => Promise<void>;
  /** Cancel/reinstate an event. */
  setEventState: (id: string, state: 'active' | 'cancelled') => Promise<void>;
  createLink: (input: { title: string; url: string; category: LinkCategory }) => Promise<void>;
  deleteLink: (id: number) => Promise<void>;
  createThread: (input: CreateThreadInput) => Promise<string | undefined>;
  /** Add a comment — or, with `parentId`, a one-level reply. Resolves to the new comment id. */
  addComment: (threadId: string, body: string, parentId?: number | null) => Promise<number | undefined>;
  setThreadReaction: (threadId: string, kind: ReactionKind | null) => Promise<void>;
  setCommentReaction: (commentId: number, kind: ReactionKind | null) => Promise<void>;
  /** Delete a comment (and its replies). */
  deleteComment: (commentId: number) => Promise<void>;
  /** Pin/unpin a forum idea. */
  setThreadPinned: (id: string, pinned: boolean) => Promise<void>;
  /** Archive/unarchive a forum idea. */
  setThreadArchived: (id: string, archived: boolean) => Promise<void>;
  addThreadMedia: (threadId: string, urls: string[], commentId?: number | null) => Promise<boolean | undefined>;
  deleteThreadMedia: (id: number) => Promise<void>;
  addThreadRefs: (threadId: string, refs: { kind: 'song' | 'event'; id: string }[], commentId?: number | null) => Promise<boolean | undefined>;
  /** Upload a forum photo (already compressed); resolves to its public URL. */
  uploadForumPhoto: (blob: Blob) => Promise<string | undefined>;
  submitFeedback: (eventId: string, input: FeedbackInput) => Promise<void>;
  pickPoll: (eventId: string, optionIndex: number) => Promise<void>;
  transferCustody: (gearId: string, toMemberId: string) => Promise<void>;
  setEventSetlist: (eventId: string, songIds: string[]) => Promise<void>;
  settleEvent: (eventId: string, input: { happened: boolean; fee: number; cost: number }) => Promise<void>;
  /** Attach a poll to an idea (created alongside it). */
  createThreadPoll: (threadId: string, question: string, options: string[], multiple: boolean) => Promise<void>;
  /** Add an option to an idea's existing poll. */
  addThreadPollOption: (threadId: string, label: string) => Promise<void>;
  /** Set the signed-in member's vote on a poll option. */
  voteThreadPoll: (optionId: number) => Promise<void>;
  /** Upload a receipt/invoice file; resolves to its public URL. */
  uploadProof: (file: File) => Promise<string | undefined>;
}

const DataContext = createContext<DataValue | null>(null);

const EMPTY: DataSnapshot = {
  songs: [],
  events: [],
  transactions: [],
  gear: [],
  threads: [],
  links: [],
  members: [],
  instruments: [],
  takes: [],
  myPollPicks: {},
};

const offlineQueue = createOfflineQueue();

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [snap, setSnap] = useState<DataSnapshot>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawRef = useRef<RawTables | null>(null);

  const reload = useCallback(async (opts?: { silent?: boolean; tables?: readonly TableName[] }) => {
    // A silent reload (after a mutation) keeps the current screen mounted and
    // swaps the data in place — no full-screen spinner, no flicker.
    if (!opts?.silent) {
      setLoading(true);
      setError(null);
    }
    try {
      // A scoped reload refetches only the tables the write touched and rebuilds
      // the snapshot from the cached rows; anything else is a full refetch.
      const cache = rawRef.current;
      const fetched = await fetchRaw(opts?.tables && cache ? opts.tables : TABLES);
      rawRef.current = { ...cache, ...fetched } as RawTables;
      setSnap(buildSnapshot(rawRef.current, user?.id ?? null));
    } catch (err) {
      logError('Failed to load data:', err);
      if (opts?.silent) {
        // Don't tear down the screen for a failed background refetch — the
        // write itself likely succeeded; just surface it like any mutation error.
        window.dispatchEvent(new Event('guataca:mutation-error'));
      } else {
        rawRef.current = null;
        setSnap(EMPTY);
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Replay writes that were queued while offline, then refresh from the server.
  useEffect(() => {
    const onOnline = async () => {
      if (offlineQueue.size() === 0) return;
      const failed = await offlineQueue.flush();
      window.dispatchEvent(new CustomEvent('guataca:queue-flushed', { detail: { failed } }));
      await reload({ silent: true });
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [reload]);

  const value = useMemo<DataValue>(() => {
    const uid = user?.id ?? '';
    // `patch` paints the expected result immediately; the silent refetch below
    // replaces it with server truth (and so undoes it if the write failed).
    const run = async <T,>(fn: () => Promise<T>, patch?: opt.Patch, tables?: readonly TableName[]): Promise<T | undefined> => {
      // Don't let a write hang on a dead connection — queue it (and show the
      // expected result) to replay on reconnect; OfflineBanner tells the user.
      // The service worker never caches writes.
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        if (patch) setSnap(patch);
        offlineQueue.push(fn);
        window.dispatchEvent(new Event('guataca:offline-write'));
        return undefined;
      }
      if (patch) setSnap(patch);
      setMutating(true);
      try {
        const result = await withTimeout(fn(), 30000);
        await reload({ silent: true, tables });
        return result;
      } catch (err) {
        logError('Mutation failed:', err);
        window.dispatchEvent(new Event('guataca:mutation-error'));
        return undefined;
      } finally {
        setMutating(false);
      }
    };
    const scoped = (tables: readonly TableName[]) => <T,>(fn: () => Promise<T>, patch?: opt.Patch) => run(fn, patch, tables);
    const ev = scoped(SCOPES.events);
    const ledger = scoped(SCOPES.ledger);
    const songs = scoped(SCOPES.songs);
    const forum = scoped(SCOPES.forum);
    const members = scoped(SCOPES.members);
    const settle = scoped([...SCOPES.events, ...SCOPES.ledger]);
    return {
      ...snap,
      loading,
      mutating,
      error,
      reload,
      createEvent: (input) => ev(() => apiCreateEvent(input, uid)),
      updateEvent: (id, input) => ev(() => apiUpdateEvent(id, input, uid)),
      createSong: (input) => songs(() => apiCreateSong(input, uid)),
      updateSong: (id, input) => songs(() => apiUpdateSong(id, input, uid)),
      setSongLinks: (songId, links) => songs(() => apiSetSongLinks(songId, links)),
      createTransaction: (input) => ledger(() => apiCreateTransaction(input, uid)),
      updateTransaction: (id, input) => ledger(() => apiUpdateTransaction(id, input, uid)),
      deleteTransaction: (id) => ledger(() => apiDeleteTransaction(id)),
      createGear: (input) => ledger(() => apiCreateGear(input, uid)),
      createInstrument: (name) => run(() => apiCreateInstrument(name), undefined, ['instruments']),
      onboard: (instruments, vocals) => members(() => apiOnboard(uid, instruments, vocals)),
      updateMemberInstruments: (profileId, instruments, vocals) => members(() => apiUpdateMemberInstruments(profileId, instruments, vocals)),
      setSongInstruments: (songId, instrumentIds) => songs(() => apiSetSongInstruments(songId, instrumentIds)),
      addTake: (eventId, songId, url) => run(() => apiAddTake(eventId, songId, url), undefined, ['takes']),
      deleteTake: (id) => run(() => apiDeleteTake(id), undefined, ['takes']),
      addEventMedia: (eventId, kind, label, url) => ev(() => apiAddEventMedia(eventId, { kind, labelEs: label, labelEn: label, url }, uid)),
      addEventPhotos: (eventId, urls) => ev(() => apiAddEventPhotos(eventId, urls, uid)),
      deleteEventMedia: (id) => ev(() => apiDeleteEventMedia(id)),
      uploadEventPhoto: async (blob) => {
        return apiUploadEventPhoto(blob);
      },
      setRsvp: (eventId, status) => ev(() => apiSetRsvp(eventId, status, uid), opt.rsvp(eventId, status, uid)),
      setEventPinned: (id, pinned) => ev(() => apiSetEventPinned(id, pinned), opt.pinEvent(id, pinned)),
      setEventState: (id, state) => ev(() => apiSetEventState(id, state)),
      createLink: (input) => run(() => apiCreateLink(input, uid), undefined, ['links']),
      deleteLink: (id) => run(() => apiDeleteLink(id), undefined, ['links']),
      createThread: (input) => forum(() => apiCreateThread(input, uid)),
      addComment: (threadId, body, parentId = null) => forum(() => apiAddComment(threadId, body, uid, parentId)),
      setThreadReaction: (threadId, kind) => forum(() => apiSetThreadReaction(threadId, kind, uid), opt.reactToThread(threadId, kind, uid)),
      setCommentReaction: (commentId, kind) => forum(() => apiSetCommentReaction(commentId, kind, uid)),
      deleteComment: (commentId) => forum(() => apiDeleteComment(commentId)),
      setThreadPinned: (id, pinned) => forum(() => apiSetThreadPinned(id, pinned), opt.pinThread(id, pinned)),
      setThreadArchived: (id, archived) => forum(() => apiSetThreadArchived(id, archived), opt.archiveThread(id, archived)),
      addThreadMedia: (threadId, urls, commentId = null) => forum(() => apiAddThreadMedia(threadId, urls, uid, commentId)),
      deleteThreadMedia: (id) => forum(() => apiDeleteThreadMedia(id)),
      addThreadRefs: (threadId, refs, commentId = null) => forum(() => apiAddThreadRefs(threadId, refs, uid, commentId)),
      uploadForumPhoto: async (blob) => {
        return apiUploadForumPhoto(blob);
      },
      submitFeedback: (eventId, input) => ev(() => apiSubmitFeedback(eventId, input, uid)),
      pickPoll: (eventId, optionIndex) => ev(() => apiPickPoll(eventId, optionIndex, uid)),
      transferCustody: (gearId, toMemberId) => ledger(() => apiTransferCustody(gearId, toMemberId, uid)),
      setEventSetlist: (eventId, songIds) => ev(() => apiSetEventSetlist(eventId, songIds, uid)),
      settleEvent: (eventId, input) => settle(() => apiSettleEvent(eventId, input, uid)),
      createThreadPoll: (threadId, question, options, multiple) => forum(() => apiCreateThreadPoll(threadId, question, options, multiple, uid)),
      addThreadPollOption: (threadId, label) => forum(() => apiAddThreadPollOption(threadId, label)),
      voteThreadPoll: (optionId) => forum(() => apiVoteThreadPoll(optionId, uid)),
      uploadProof: async (file) => {
        return apiUploadProof(file);
      },
    };
  }, [snap, loading, mutating, error, reload, user?.id]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}
