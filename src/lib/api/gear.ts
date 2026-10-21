/** Write side: gear. */
import { supabase } from '../supabase';
import { newId } from './shared';
import type { GearCondition, ProofKind } from '../../types';

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
  }).throwOnError();
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
    }).throwOnError();
  }
}

export async function transferCustody(gearId: string, toMemberId: string, _userId: string): Promise<void> {
  const { data } = await supabase.from('gear').select('custodian_id').eq('id', gearId).single();
  const fromId = data?.custodian_id ?? null;
  await supabase.from('gear').update({ custodian_id: toMemberId }).eq('id', gearId).throwOnError();
  await supabase.from('gear_custody_log').insert({ gear_id: gearId, from_id: fromId, to_id: toMemberId }).throwOnError();
}
