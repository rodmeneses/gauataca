/** Read side: map PostgREST rows into ledger domain shapes. */
import { type Row } from '../shared';
import type { Gear, Transaction } from '../../../types';

/* ------------------------------------------------------------ transactions */
export function mapTransactions(rows: Row[]): Transaction[] {
  return rows.map((t) => ({
    id: t.id,
    kind: t.kind,
    amt: (t.amount_cents ?? 0) / 100,
    date: t.occurred_on,
    by: t.created_by,
    desc: { es: t.description_es, en: t.description_en },
    proof: t.proof_url ?? null,
    proofKind: t.proof_kind,
    event: t.event_id ?? undefined,
    gear: t.gear_id ?? undefined,
    category: t.category ?? undefined,
    contributor: t.contributor_id ?? undefined,
  }));
}

/* -------------------------------------------------------------------- gear */
export function mapGear(rows: Row[], transactions: Row[]): Gear[] {
  const txByGear = new Map(transactions.filter((t) => t.gear_id).map((t) => [t.gear_id, t.id]));
  return rows.map((g) => ({
    id: g.id,
    name: { es: g.name_es, en: g.name_en },
    cost: (g.cost_cents ?? 0) / 100,
    date: g.purchased_on,
    holder: g.custodian_id,
    tx: txByGear.get(g.id),
    cond: g.condition,
    note: { es: g.note_es ?? '', en: g.note_en ?? '' },
    boughtBy: g.purchased_by ?? undefined,
  }));
}
