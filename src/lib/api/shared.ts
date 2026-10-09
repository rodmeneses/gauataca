/** Shared row type, snapshot shape and small helpers for the data layer. */
import type {
  BandEvent, BandLink, Gear, Instrument, Member, Song, Take, Thread, Transaction,
} from '../../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

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

export const groupBy = (rows: Row[], key: string): Map<string, Row[]> => {
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

export const shortName = (name: string): string => name.split(/\s+/)[0];
export const initials = (name: string): string =>
  name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export const newId = (prefix: string): string =>
  prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
