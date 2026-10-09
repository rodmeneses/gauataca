/** Member and instrument view-models. */
import { fmt } from '../../lib/format';
import type { Member } from '../../types';
import { L, LEVEL_COLOR, LEVEL_PCT, tint } from './common';
import type { Ctx } from './common';

/* ---------------------------------------------------------------- members */
export interface InstrumentVm {
  name: string;
  level: string;
  pct: string;
  color: string;
}
export interface MemberVm {
  id: string;
  name: string;
  short: string;
  initial: string;
  email: string;
  title: string;
  isAdminRole: boolean;
  roleLabel: string;
  roleColor: string;
  roleBg: string;
  /** "Desde mar 11 abr 2023" */
  since: string;
  instruments: InstrumentVm[];
  vocals: { label: string; isNone: boolean }[];
}

export function memberVm(m: Member, ctx: Ctx): MemberVm {
  const { lang, t } = ctx;
  const admin = m.role === 'admin';
  return {
    id: m.id,
    name: m.name,
    short: m.short,
    initial: m.initial,
    email: m.email,
    title: L(lang, m.title),
    isAdminRole: admin,
    roleLabel: admin ? t.admin : t.member,
    roleColor: admin ? 'var(--color-emerald)' : 'var(--color-ink-meta)',
    roleBg: admin ? tint('var(--color-emerald)') : tint('var(--color-ink-meta)'),
    since: t.since + ' ' + fmt(m.joined, lang, true),
    instruments: m.instruments.map((i) => {
      const inst = ctx.instruments.find((x) => x.id === i.id);
      return { name: inst ? L(lang, inst.name) : i.id, level: t[i.lv], pct: LEVEL_PCT[i.lv], color: LEVEL_COLOR[i.lv] };
    }),
    vocals: m.vocals.map((v) => ({ label: t[v], isNone: v === 'none' })),
  };
}
