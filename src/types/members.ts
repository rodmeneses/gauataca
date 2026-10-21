/** Members and instruments. */
import type { Role, Localized } from './app';

export type Proficiency = 'expert' | 'inter' | 'beg';
export type VocalFlag = 'lead' | 'chorus' | 'none';

/** A playable instrument in the shared catalog (basic or custom). */
export interface Instrument {
  id: string;
  name: Localized;
  isBasic: boolean;
}

export interface Member {
  id: string;
  name: string;
  short: string;
  initial: string;
  role: Role;
  title: Localized;
  email: string;
  joined: string; // ISO date
  /** Instrument catalog ids + the member's proficiency on each. */
  instruments: { id: string; lv: Proficiency }[];
  vocals: VocalFlag[];
}
