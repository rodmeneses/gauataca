/** Write side: ledger. */
import { supabase } from '../supabase';
import { newId } from './shared';
import type { ProofKind, TxCategory, TxKind } from '../../types';

export async function createTransaction(
  input: { kind: TxKind; amt: number; date: string; desc: string; proof: string | null; proofKind: ProofKind; event?: string; gear?: string; category?: TxCategory; contributor?: string },
  userId: string,
): Promise<void> {
  await supabase.from('transactions').insert({
    id: newId('y'),
    kind: input.kind,
    amount_cents: Math.round(input.amt * 100),
    occurred_on: input.date,
    description_es: input.desc,
    description_en: input.desc,
    proof_url: input.proof,
    proof_kind: input.proofKind,
    event_id: input.event ?? null,
    gear_id: input.gear ?? null,
    category: input.category ?? null,
    contributor_id: input.contributor ?? null,
    created_by: userId,
  }).throwOnError();
}

/** Update an existing transaction's fields (amount, kind, date, desc, proof, links, category). */
export async function updateTransaction(
  id: string,
  input: { kind: TxKind; amt: number; date: string; desc: string; proof: string | null; proofKind: ProofKind; event?: string; gear?: string; category?: TxCategory; contributor?: string },
  _userId: string,
): Promise<void> {
  await supabase.from('transactions').update({
    kind: input.kind,
    amount_cents: Math.round(input.amt * 100),
    occurred_on: input.date,
    description_es: input.desc,
    description_en: input.desc,
    proof_url: input.proof,
    proof_kind: input.proofKind,
    event_id: input.event ?? null,
    gear_id: input.gear ?? null,
    category: input.category ?? null,
    contributor_id: input.contributor ?? null,
  }).eq('id', id).throwOnError();
}

/** Delete a transaction. */
export async function deleteTransaction(id: string): Promise<void> {
  await supabase.from('transactions').delete().eq('id', id).throwOnError();
}

/** Upload a receipt/invoice image to the public `receipts` bucket; returns its public URL. */
export async function uploadProof(file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('receipts').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('receipts').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Keep an event's settled ledger movements in sync with its fee/cost. The settle
 * flow tags the income movement `category = 'fee'` and creates a single expense
 * movement, so those are matched by (event, kind, category). Called on settle and
 * again when a settled event is edited, so a retroactive amount change flows
 * through to the income/expense report.
 */
export async function syncEventTransactions(
  eventId: string,
  fee: number,
  cost: number,
  userId: string,
): Promise<void> {
  const { data: ev } = await supabase.from('events').select('starts_at, title_es, title_en').eq('id', eventId).single();
  const date = (ev?.starts_at ?? '').slice(0, 10);
  const titleEs = ev?.title_es ?? '';
  const titleEn = ev?.title_en ?? '';

  // Income (honorarios) — matched by the settle flow's `category = 'fee'` tag.
  const { data: feeTx } = await supabase.from('transactions').select('id').eq('event_id', eventId).eq('kind', 'in').eq('category', 'fee');
  if (fee > 0) {
    if (feeTx?.length) {
      await supabase.from('transactions').update({ amount_cents: Math.round(fee * 100) }).eq('id', feeTx[0].id).throwOnError();
    } else {
      await supabase.from('transactions').insert({
        id: newId('y'),
        kind: 'in',
        amount_cents: Math.round(fee * 100),
        occurred_on: date,
        description_es: 'Honorarios — ' + titleEs,
        description_en: 'Fee — ' + titleEn,
        proof_url: null,
        proof_kind: 'zelle',
        event_id: eventId,
        category: 'fee',
        created_by: userId,
      }).throwOnError();
    }
  } else if (feeTx?.length) {
    await supabase.from('transactions').delete().eq('id', feeTx[0].id).throwOnError();
  }

  // Expense (cost) — the settle flow creates a single 'out' movement for the event.
  const { data: costTx } = await supabase.from('transactions').select('id').eq('event_id', eventId).eq('kind', 'out');
  if (cost > 0) {
    if (costTx?.length) {
      await supabase.from('transactions').update({ amount_cents: Math.round(cost * 100) }).eq('id', costTx[0].id).throwOnError();
    } else {
      await supabase.from('transactions').insert({
        id: newId('y'),
        kind: 'out',
        amount_cents: Math.round(cost * 100),
        occurred_on: date,
        description_es: 'Costo — ' + titleEs,
        description_en: 'Cost — ' + titleEn,
        proof_url: null,
        proof_kind: 'receipt',
        event_id: eventId,
        created_by: userId,
      }).throwOnError();
    }
  } else if (costTx?.length) {
    await supabase.from('transactions').delete().eq('id', costTx[0].id).throwOnError();
  }
}

export async function settleEvent(
  eventId: string,
  input: { happened: boolean; fee: number; cost: number },
  userId: string,
): Promise<void> {
  // A cancelled event still records its cost (e.g. a lost deposit), so only the
  // income is gated on `happened`.
  await syncEventTransactions(eventId, input.happened ? input.fee : 0, input.cost, userId);
  await supabase.from('events').update({ settled: true }).eq('id', eventId).throwOnError();
}
