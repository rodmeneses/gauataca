/** Fund transaction, contribution and gear view-models. */
import { fmt, money, money0 } from '../../lib/format';
import type { Gear, Member, Transaction } from '../../types';
import { L, memberById, tint } from './common';
import type { Ctx } from './common';

/* ----------------------------------------------------------- transactions */
export interface TxVm {
  id: string;
  dateStr: string;
  desc: string;
  /** "+$450.00" / "−$47.30" */
  amountStr: string;
  color: string;
  bg: string;
  kindLabel: string;
  isIn: boolean;
  arrow: '↑' | '↓';
  by: string;
  byInitial: string;
  proof: string | null;
  hasProof: boolean;
  /** true when the proof URL points at an image (render a thumbnail). */
  proofIsImage: boolean;
  /** "Zelle" | "Invoice" | "Photo" | "Receipt" */
  proofKind: string;
  /** Localized title of the linked event, or null. */
  eventLabel: string | null;
  /** Localized name of the linked gear, or null. */
  gearLabel: string | null;
  /** Localized income category (fee/tip/donation/contribution), or null. */
  categoryLabel: string | null;
}

export function txVm(x: Transaction, ctx: Ctx): TxVm {
  const { lang, t } = ctx;
  const inc = x.kind === 'in';
  const by = memberById(ctx.members, x.by);
  const ev = x.event ? ctx.events.find((e) => e.id === x.event) : undefined;
  const g = x.gear ? ctx.gear.find((g) => g.id === x.gear) : undefined;
  return {
    id: x.id,
    dateStr: fmt(x.date, lang, true),
    desc: L(lang, x.desc),
    amountStr: (inc ? '+' : '−') + money(x.amt).replace('-', ''),
    color: inc ? 'var(--color-emerald)' : 'var(--color-red)',
    bg: inc ? tint('var(--color-emerald)') : tint('var(--color-red)'),
    kindLabel: inc ? t.income : t.expense,
    isIn: inc,
    arrow: inc ? '↑' : '↓',
    by: by.short,
    byInitial: by.initial,
    proof: x.proof || null,
    hasProof: !!x.proof,
    proofIsImage: /\.(png|jpe?g|webp|gif|heic)(\?|$)/i.test(x.proof || ''),
    proofKind: x.proofKind === 'zelle' ? t.zelle : x.proofKind === 'invoice' ? t.invoice : x.proofKind === 'photo' ? t.photo : t.receipt,
    eventLabel: ev ? L(lang, ev.title) : null,
    gearLabel: g ? L(lang, g.name) : null,
    categoryLabel: x.category === 'fee' ? t.fee : x.category === 'tip' ? t.tip : x.category === 'donation' ? t.donation : x.category === 'contribution' ? t.contribution : x.category === 'DTV' ? t.dtv : null,
  };
}

/* ------------------------------------------------------------ contributions */
export interface ContributionVm {
  memberId: string;
  name: string;
  initial: string;
  /** All-time contributions, formatted. */
  totalStr: string;
  /** This month's contributions, formatted. */
  monthStr: string;
}

export function contributionVm(member: Member, totalCents: number, monthCents: number): ContributionVm {
  return {
    memberId: member.id,
    name: member.short,
    initial: member.initial,
    totalStr: money(totalCents / 100),
    monthStr: money(monthCents / 100),
  };
}

/* ------------------------------------------------------------------- gear */
export interface GearVm {
  id: string;
  name: string;
  costStr: string;
  dateStr: string;
  holderId: string;
  holder: string;
  holderInitial: string;
  note: string;
  condLabel: string;
  condColor: string;
  condBg: string;
  hasTx: boolean;
  /** Short name of the member who bought it, or null. */
  boughtBy: string | null;
  boughtByInitial: string;
}

export function gearVm(g: Gear, holderId: string, ctx: Ctx): GearVm {
  const { lang, t } = ctx;
  const h = memberById(ctx.members, holderId);
  const buyer = g.boughtBy ? memberById(ctx.members, g.boughtBy) : null;
  const good = g.cond === 'good';
  return {
    id: g.id,
    name: L(lang, g.name),
    costStr: money0(g.cost),
    dateStr: fmt(g.date, lang, true),
    holderId,
    holder: h.short,
    holderInitial: h.initial,
    note: L(lang, g.note),
    condLabel: good ? t.good : t.attention,
    condColor: good ? 'var(--color-emerald)' : 'var(--color-amber)',
    condBg: good ? tint('var(--color-emerald)') : tint('var(--color-amber)'),
    hasTx: !!g.tx,
    boughtBy: buyer ? buyer.short : null,
    boughtByInitial: buyer ? buyer.initial : '',
  };
}
