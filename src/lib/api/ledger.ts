/** Ledger: transactions, receipts, gear and custody. */
import { supabase } from '../supabase';
import { newId } from './shared';
import type {
  GearCondition, ProofKind, TxCategory, TxKind,
} from '../../types';

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
  });
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
  }).eq('id', id);
}

/** Delete a transaction. */
export async function deleteTransaction(id: string): Promise<void> {
  await supabase.from('transactions').delete().eq('id', id);
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

/** Register a gear purchase: insert the gear row and the matching expense transaction. */
export async function createGear(
  input: { name: string; cost: number; date: string; custodian: string; cond: GearCondition; note: string; boughtBy: string; proof: string | null; proofKind: ProofKind },
  _userId: string,
): Promise<void> {
  const id = newId('g');
  await supabase.from('gear').insert({
    id,
    name_es: input.name,
    name_en: input.name,
    cost_cents: Math.round(input.cost * 100),
    purchased_on: input.date,
    custodian_id: input.custodian,
    condition: input.cond,
    note_es: input.note,
    note_en: input.note,
    purchased_by: input.boughtBy,
  });
  // Only log an expense movement when the gear actually cost something.
  if (input.cost > 0) {
    await supabase.from('transactions').insert({
      id: newId('y'),
      kind: 'out',
      amount_cents: Math.round(input.cost * 100),
      occurred_on: input.date,
      description_es: 'Compra — ' + input.name,
      description_en: 'Purchase — ' + input.name,
      proof_url: input.proof,
      proof_kind: input.proofKind,
      gear_id: id,
      created_by: input.boughtBy,
    });
  }
}

export async function transferCustody(gearId: string, toMemberId: string, _userId: string): Promise<void> {
  const { data } = await supabase.from('gear').select('custodian_id').eq('id', gearId).single();
  const fromId = data?.custodian_id ?? null;
  await supabase.from('gear').update({ custodian_id: toMemberId }).eq('id', gearId);
  await supabase.from('gear_custody_log').insert({ gear_id: gearId, from_id: fromId, to_id: toMemberId });
}
