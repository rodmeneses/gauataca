/** Ledger & gear: filters, movement/gear forms, settling gigs, custody and proofs. */
import type { TxDate, TxFilter } from '../../types';
import { parseNum } from '../../lib/validate';
import { memberById } from '../vm';
import type { ActionCtx } from './ctx';

export interface LedgerActions {
  setTxFilter: (f: TxFilter) => void;
  setTxDate: (d: TxDate) => void;
  openNewTx: () => void;
  openEditTx: (id: string) => void;
  openNewGear: () => void;
  saveTx: () => Promise<void>;
  deleteTx: (id: string) => Promise<void>;
  saveGear: () => Promise<void>;
  openCustody: (gearId: string) => void;
  closeCustody: () => void;
  transferCustody: (memberId: string) => Promise<void>;
  openSettle: (eventId: string) => void;
  closeSettle: () => void;
  settleEvent: (eventId: string, input: { happened: boolean; fee: number; cost: number }) => Promise<void>;
  /** Upload a receipt/invoice file; resolves to its public URL, or null on failure. */
  uploadProof: (file: File) => Promise<string | null>;
}

export function ledgerActions({ st, set, toast, t, Lx, data, d, me }: ActionCtx): LedgerActions {
  const f = st.form;
  return {
    setTxFilter: (v) => set({ txFilter: v }),
    setTxDate: (v) => set({ txDate: v }),
    // Pre-select the logged-in user as the contributor — the common case is
    // logging your own contribution; admins can change it for someone else.
    openNewTx: () => set({ modal: { kind: 'newTx' }, form: { contributor: me.id } }),
    openEditTx: (id) => {
      const x = d.allTx.find((tx) => tx.id === id);
      if (!x) return;
      set({
        modal: { kind: 'newTx', id },
        form: {
          kind: x.kind, amt: String(x.amt), date: x.date, desc: Lx(x.desc),
          proof: x.proof || '', proofKind: x.proofKind,
          event: x.event || '', gear: x.gear || '',
          category: x.category, contributor: x.contributor || '',
        },
      });
    },
    openNewGear: () => set({ modal: { kind: 'newGear' }, form: { custodian: me.id, boughtBy: me.id } }),
    saveTx: async () => {
      const editingId = st.modal?.kind === 'newTx' ? st.modal.id : undefined;
      set({ modal: null, form: {} });
      const input = {
        kind: f.kind || 'in', amt: parseNum(f.amt) || 0, date: f.date || '2026-08-25', desc: f.desc || 'Movimiento', proof: f.proof || null,
        proofKind: f.proofKind || 'receipt', event: f.event || undefined, gear: f.gear || undefined,
        category: (f.kind || 'in') === 'in' ? (f.category || undefined) : undefined,
        // DTV income is the org's — never attribute it to a member.
        contributor: f.category === 'DTV' ? undefined : f.contributor || undefined,
      };
      if (editingId) {
        await data.updateTransaction(editingId, input);
      } else {
        await data.createTransaction(input);
      }
      toast(editingId ? t.txSaved : t.txLogged);
    },
    deleteTx: async (id) => {
      await data.deleteTransaction(id);
      toast(t.txDeleted);
    },
    saveGear: async () => {
      set({ modal: null, form: {} });
      await data.createGear({
        name: f.name || 'Equipo nuevo', cost: +(f.cost || 0), date: f.date || '2026-08-25', custodian: f.custodian || me.id,
        cond: f.cond || 'good', note: f.note || '', boughtBy: f.boughtBy || me.id, proof: f.proof || null, proofKind: f.proofKind || 'receipt',
      });
      toast(t.gearCreated);
    },
    openCustody: (gearId) => {
      const g = d.gear.find((x) => x.id === gearId);
      if (!g) return;
      set({ custody: { id: g.id, name: g.name, holder: g.holder } });
    },
    closeCustody: () => set({ custody: null }),
    transferCustody: async (memberId) => {
      const c = st.custody;
      if (!c) return;
      set({ custody: null });
      await data.transferCustody(c.id, memberId);
      toast(t.custodyTo + memberById(data.members, memberId).short);
    },
    openSettle: (eventId) => {
      const e = d.allEvents.find((x) => x.id === eventId);
      if (!e) return;
      set({ settle: { id: e.id, title: Lx(e.title), fee: e.fee, cost: e.cost } });
    },
    closeSettle: () => set({ settle: null }),
    settleEvent: async (eventId, input) => {
      set({ settle: null });
      await data.settleEvent(eventId, input);
      toast(t.eventSettled);
    },
    uploadProof: async (file) => {
      try {
        const url = await data.uploadProof(file);
        return url ?? null;
      } catch {
        toast(t.uploadFailed, 'err');
        return null;
      }
    },
  };
}
