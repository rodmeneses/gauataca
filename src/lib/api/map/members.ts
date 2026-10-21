/** Read side: map PostgREST rows into members domain shapes. */
import { type Row, groupBy, shortName, initials } from '../shared';
import type { Instrument, Member } from '../../../types';

/* ------------------------------------------------------------------ members */
export function mapMembers(profiles: Row[], instruments: Row[], vocals: Row[]): Member[] {
  const instr = groupBy(instruments, 'profile_id');
  const voc = groupBy(vocals, 'profile_id');
  return profiles.map((p) => ({
    id: p.id,
    name: p.name,
    short: shortName(p.name),
    initial: initials(p.name),
    role: p.role,
    title: { es: p.title_es ?? '', en: p.title_en ?? '' },
    email: p.email ?? '',
    joined: (p.joined_at ?? '').slice(0, 10),
    instruments: (instr.get(p.id) ?? []).map((i) => ({
      id: i.instrument_id,
      lv: i.proficiency,
    })),
    vocals: (voc.get(p.id) ?? []).map((v) => v.flag),
  }));
}

/* ------------------------------------------------------------- instruments */
export function mapInstruments(rows: Row[]): Instrument[] {
  return rows.map((i) => ({
    id: i.id,
    name: { es: i.name_es, en: i.name_en },
    isBasic: !!i.is_basic,
  }));
}
