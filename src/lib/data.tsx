/**
 * DataProvider: loads the whole dataset from Supabase (or the Phase 1 mock
 * arrays when no env keys are set) and exposes it plus the write mutations.
 * Mutations are no-ops in demo mode; in live mode they write then reload
 * silently (the on-screen data stays put and swaps in place — no full-screen
 * spinner). `mutating` is true while a write + its refetch are in flight.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './auth';
import {
  addComment as apiAddComment, addTake as apiAddTake, createEvent as apiCreateEvent, createGear as apiCreateGear, createInstrument as apiCreateInstrument,
  createSong as apiCreateSong, createTransaction as apiCreateTransaction, deleteTake as apiDeleteTake, fetchAll, onboard as apiOnboard, pickPoll as apiPickPoll,
  setEventSetlist as apiSetEventSetlist, setRsvp as apiSetRsvp, setSongInstruments as apiSetSongInstruments, setSongLinks as apiSetSongLinks,
  settleEvent as apiSettleEvent, submitFeedback as apiSubmitFeedback, transferCustody as apiTransferCustody, updateEvent as apiUpdateEvent, updateMemberInstruments as apiUpdateMemberInstruments, updateSong as apiUpdateSong,
  uploadProof as apiUploadProof, voteThread as apiVoteThread, type DataSnapshot,
} from './api';
import { EVENTS, GEAR, INSTRUMENTS, MEMBERS, SONGS, TAKES, THREADS, TRANSACTIONS } from '../data';
import type { EventType, GearCondition, GenreId, LinkKind, Proficiency, ProofKind, RsvpStatus, TxCategory, TxKind, VocalFlag } from '../types';

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
  reload: (opts?: { silent?: boolean }) => Promise<void>;
  createEvent: (input: CreateEventInput) => Promise<string | undefined>;
  updateEvent: (id: string, input: CreateEventInput) => Promise<void>;
  createSong: (input: CreateSongInput) => Promise<string | undefined>;
  updateSong: (id: string, input: CreateSongInput) => Promise<void>;
  setSongLinks: (songId: string, links: SongLinkInput[]) => Promise<void>;
  createTransaction: (input: CreateTxInput) => Promise<void>;
  createGear: (input: CreateGearInput) => Promise<void>;
  createInstrument: (name: string) => Promise<string | undefined>;
  onboard: (instruments: { id: string; lv: Proficiency }[], vocals: VocalFlag[]) => Promise<void>;
  updateMemberInstruments: (profileId: string, instruments: { id: string; lv: Proficiency }[], vocals: VocalFlag[]) => Promise<void>;
  setSongInstruments: (songId: string, instrumentIds: string[]) => Promise<void>;
  addTake: (eventId: string, songId: string, url: string) => Promise<void>;
  deleteTake: (id: string) => Promise<void>;
  setRsvp: (eventId: string, status: RsvpStatus | null) => Promise<void>;
  voteThread: (threadId: string) => Promise<void>;
  addComment: (threadId: string, body: string) => Promise<void>;
  submitFeedback: (eventId: string, input: FeedbackInput) => Promise<void>;
  pickPoll: (eventId: string, optionIndex: number) => Promise<void>;
  transferCustody: (gearId: string, toMemberId: string) => Promise<void>;
  setEventSetlist: (eventId: string, songIds: string[]) => Promise<void>;
  settleEvent: (eventId: string, input: { happened: boolean; fee: number; cost: number }) => Promise<void>;
  /** Upload a receipt/invoice file; resolves to its public URL (undefined in demo mode). */
  uploadProof: (file: File) => Promise<string | undefined>;
}

const DataContext = createContext<DataValue | null>(null);

export const isDemo = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

const DEMO: DataSnapshot = {
  songs: SONGS,
  events: EVENTS,
  transactions: TRANSACTIONS,
  gear: GEAR,
  threads: THREADS,
  members: MEMBERS,
  instruments: INSTRUMENTS,
  takes: TAKES,
  myThreadVotes: [],
  myPollPicks: {},
};

const EMPTY: DataSnapshot = {
  songs: [],
  events: [],
  transactions: [],
  gear: [],
  threads: [],
  members: [],
  instruments: [],
  takes: [],
  myThreadVotes: [],
  myPollPicks: {},
};

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [snap, setSnap] = useState<DataSnapshot>(isDemo ? DEMO : EMPTY);
  const [loading, setLoading] = useState(!isDemo);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (opts?: { silent?: boolean }) => {
    if (isDemo) {
      setSnap(DEMO);
      setLoading(false);
      return;
    }
    // A silent reload (after a mutation) keeps the current screen mounted and
    // swaps the data in place — no full-screen spinner, no flicker.
    if (!opts?.silent) {
      setLoading(true);
      setError(null);
    }
    try {
      setSnap(await fetchAll(user?.id ?? null));
    } catch (err) {
      console.error('Failed to load data:', err);
      if (opts?.silent) {
        // Don't tear down the screen for a failed background refetch — the
        // write itself likely succeeded; just surface it like any mutation error.
        window.dispatchEvent(new Event('guataca:mutation-error'));
      } else {
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

  const value = useMemo<DataValue>(() => {
    const uid = user?.id ?? '';
    const run = async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
      if (isDemo) return undefined;
      // Don't let a write hang on a dead connection — bail early and let the UI
      // surface it (see OfflineBanner). The service worker never caches writes.
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        window.dispatchEvent(new Event('guataca:offline-write'));
        return undefined;
      }
      setMutating(true);
      try {
        const result = await fn();
        await reload({ silent: true });
        return result;
      } catch (err) {
        console.error('Mutation failed:', err);
        window.dispatchEvent(new Event('guataca:mutation-error'));
        return undefined;
      } finally {
        setMutating(false);
      }
    };
    return {
      ...snap,
      loading,
      mutating,
      error,
      reload,
      createEvent: (input) => run(() => apiCreateEvent(input, uid)),
      updateEvent: (id, input) => run(() => apiUpdateEvent(id, input, uid)),
      createSong: (input) => run(() => apiCreateSong(input, uid)),
      updateSong: (id, input) => run(() => apiUpdateSong(id, input, uid)),
      setSongLinks: (songId, links) => run(() => apiSetSongLinks(songId, links)),
      createTransaction: (input) => run(() => apiCreateTransaction(input, uid)),
      createGear: (input) => run(() => apiCreateGear(input, uid)),
      createInstrument: (name) => run(() => apiCreateInstrument(name)),
      onboard: (instruments, vocals) => run(() => apiOnboard(uid, instruments, vocals)),
      updateMemberInstruments: (profileId, instruments, vocals) => run(() => apiUpdateMemberInstruments(profileId, instruments, vocals)),
      setSongInstruments: (songId, instrumentIds) => run(() => apiSetSongInstruments(songId, instrumentIds)),
      addTake: (eventId, songId, url) => run(() => apiAddTake(eventId, songId, url)),
      deleteTake: (id) => run(() => apiDeleteTake(id)),
      setRsvp: (eventId, status) => run(() => apiSetRsvp(eventId, status, uid)),
      voteThread: (threadId) => run(() => apiVoteThread(threadId, uid)),
      addComment: (threadId, body) => run(() => apiAddComment(threadId, body, uid)),
      submitFeedback: (eventId, input) => run(() => apiSubmitFeedback(eventId, input, uid)),
      pickPoll: (eventId, optionIndex) => run(() => apiPickPoll(eventId, optionIndex, uid)),
      transferCustody: (gearId, toMemberId) => run(() => apiTransferCustody(gearId, toMemberId, uid)),
      setEventSetlist: (eventId, songIds) => run(() => apiSetEventSetlist(eventId, songIds, uid)),
      settleEvent: (eventId, input) => run(() => apiSettleEvent(eventId, input, uid)),
      uploadProof: async (file) => {
        if (isDemo) return undefined;
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
