/** Members & instruments: onboarding and instrument editing. */
import type { Proficiency, VocalFlag } from '../../types';
import type { ActionCtx } from './ctx';

export interface MemberActions {
  openMember: (id: string, edit?: boolean) => void;
  /** Complete sign-up onboarding (instruments + vocals). */
  onboard: (instruments: { id: string; lv: Proficiency }[], vocals: VocalFlag[]) => Promise<void>;
  /** Replace a member's instruments + vocals (admin, or the member editing themselves). */
  saveMemberInstruments: (profileId: string, instruments: { id: string; lv: Proficiency }[], vocals: VocalFlag[]) => Promise<void>;
  /** Open the sign-up onboarding modal. */
  openOnboard: () => void;
  /** Dismiss onboarding without saving (won't re-open this session). */
  skipOnboard: () => void;
  /** Create a custom instrument; resolves to its id. */
  createInstrument: (name: string) => Promise<string>;
}

export function memberActions({ set, toast, t, data, auth }: ActionCtx): MemberActions {
  return {
    openMember: (id, edit) => set({ modal: { kind: 'member', id, edit } }),
    onboard: async (instruments, vocals) => {
      await data.onboard(instruments, vocals);
      await auth.refreshProfile();
      set({ modal: null, onboardDismissed: true });
      toast(t.onboarded);
    },
    saveMemberInstruments: async (profileId, instruments, vocals) => {
      await data.updateMemberInstruments(profileId, instruments, vocals);
      toast(t.instrumentsSaved);
    },
    openOnboard: () => set({ modal: { kind: 'onboard' } }),
    skipOnboard: () => set({ modal: null, onboardDismissed: true }),
    createInstrument: async (name) => {
      const id = (await data.createInstrument(name)) ?? 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      set((s) => ({ customInstruments: [...s.customInstruments, { id, name: { es: name, en: name } }] }));
      return id;
    },
  };
}
