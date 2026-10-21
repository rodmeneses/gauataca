/** Ledger transactions and gear. */
import type { Localized } from './app';

export type TxKind = 'in' | 'out';
export type ProofKind = 'zelle' | 'invoice' | 'photo' | 'receipt';
/** Income category (null for expenses). */
export type TxCategory = 'fee' | 'tip' | 'donation' | 'contribution' | 'DTV';
/** Ledger filter: all movements, income only, or expenses only. */
export type TxFilter = 'all' | 'in' | 'out';
/** Ledger date window: all time, or the last N days. */
export type TxDate = 'all' | '30' | '90' | '365';

export interface Transaction {
  id: string;
  kind: TxKind;
  amt: number;
  date: string;
  by: string; // member id (who logged it)
  desc: Localized;
  proof: string | null;
  proofKind: ProofKind;
  event?: string;
  gear?: string;
  /** Income category (fee/tip/donation/contribution); undefined for expenses. */
  category?: TxCategory;
  /** Member id who contributed (contribution movements only). */
  contributor?: string;
}

export type GearCondition = 'good' | 'attention';

export interface Gear {
  id: string;
  name: Localized;
  cost: number;
  date: string;
  holder: string; // member id (current custodian)
  tx?: string;
  cond: GearCondition;
  note: Localized;
  /** Member id who bought it (for money tracking). */
  boughtBy?: string;
}
