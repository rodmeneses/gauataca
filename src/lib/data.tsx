/**
 * DataProvider: loads the whole dataset from Supabase (or the Phase 1 mock
 * arrays when no env keys are set) and exposes it plus the write mutations.
 * Mutations are no-ops in demo mode; in live mode they write then reload.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './auth';
import {
  addComment as apiAddComment, createEvent as apiCreateEvent, createSong as apiCreateSong,
  createTransaction as apiCreateTransaction, fetchAll, pickPoll as apiPickPoll,
  setEventSetlist as apiSetEventSetlist, setRsvp as apiSetRsvp, settleEvent as apiSettleEvent,
  submitFeedback as apiSubmitFeedback, transferCustody as apiTransferCustody, updateCuota as apiUpdateCuota,
  uploadProof as apiUploadProof, voteThread as apiVoteThread, type DataSnapshot,
} from './api';
import { EVENTS, GEAR, MEMBERS, SONGS, THREADS, TRANSACTIONS } from '../data';
import type { EventType, GenreId, ProofKind, RsvpStatus, TxCategory, TxKind } from '../types';

export interface CreateEventInput { title: string; venue: string; date: string; time: string; hours: number; fee: number; cost: number; note: string; type: EventType; }
export interface CreateSongInput { title: string; genre: GenreId; key: string; bpm: number; dur: string; }
export interface CreateTxInput { kind: TxKind; amt: number; date: string; desc: string; proof: string | null; proofKind: ProofKind; event?: string; gear?: string; category?: TxCategory; contributor?: string; }
export interface FeedbackInput { sound: number; perf: number; log: number; energy: number; well: string; improve: string; anon: boolean; }

interface DataValue extends DataSnapshot {
  loading: boolean;
  /** Non-null when a live fetch failed (e.g. schema not applied yet). */
  error: string | null;
  reload: () => Promise<void>;
  createEvent: (input: CreateEventInput) => Promise<string | undefined>;
  createSong: (input: CreateSongInput) => Promise<void>;
  createTransaction: (input: CreateTxInput) => Promise<void>;
  setRsvp: (eventId: string, status: RsvpStatus | null) => Promise<void>;
  voteThread: (threadId: string) => Promise<void>;
  addComment: (threadId: string, body: string) => Promise<void>;
  submitFeedback: (eventId: string, input: FeedbackInput) => Promise<void>;
  pickPoll: (eventId: string, optionIndex: number) => Promise<void>;
  transferCustody: (gearId: string, toMemberId: string) => Promise<void>;
  setEventSetlist: (eventId: string, songIds: string[]) => Promise<void>;
  updateCuota: (cents: number) => Promise<void>;
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
  myThreadVotes: [],
  myPollPicks: {},
  monthlyCuotaCents: 2000,
};

const EMPTY: DataSnapshot = {
  songs: [],
  events: [],
  transactions: [],
  gear: [],
  threads: [],
  members: [],
  myThreadVotes: [],
  myPollPicks: {},
  monthlyCuotaCents: 2000,
};

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [snap, setSnap] = useState<DataSnapshot>(isDemo ? DEMO : EMPTY);
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (isDemo) {
      setSnap(DEMO);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSnap(await fetchAll(user?.id ?? null));
    } catch (err) {
      setSnap(EMPTY);
      setError(err instanceof Error ? err.message : String(err));
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<DataValue>(() => {
    const uid = user?.id ?? '';
    const run = async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
      if (isDemo) return undefined;
      try {
        const result = await fn();
        await reload();
        return result;
      } catch (err) {
        console.error('Mutation failed:', err);
        return undefined;
      }
    };
    return {
      ...snap,
      loading,
      error,
      reload,
      createEvent: (input) => run(() => apiCreateEvent(input, uid)),
      createSong: (input) => run(() => apiCreateSong(input, uid)),
      createTransaction: (input) => run(() => apiCreateTransaction(input, uid)),
      setRsvp: (eventId, status) => run(() => apiSetRsvp(eventId, status, uid)),
      voteThread: (threadId) => run(() => apiVoteThread(threadId, uid)),
      addComment: (threadId, body) => run(() => apiAddComment(threadId, body, uid)),
      submitFeedback: (eventId, input) => run(() => apiSubmitFeedback(eventId, input, uid)),
      pickPoll: (eventId, optionIndex) => run(() => apiPickPoll(eventId, optionIndex, uid)),
      transferCustody: (gearId, toMemberId) => run(() => apiTransferCustody(gearId, toMemberId, uid)),
      setEventSetlist: (eventId, songIds) => run(() => apiSetEventSetlist(eventId, songIds, uid)),
      updateCuota: (cents) => run(() => apiUpdateCuota(cents, uid)),
      settleEvent: (eventId, input) => run(() => apiSettleEvent(eventId, input, uid)),
      uploadProof: async (file) => {
        if (isDemo) return undefined;
        return apiUploadProof(file);
      },
    };
  }, [snap, loading, error, reload, user?.id]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}
