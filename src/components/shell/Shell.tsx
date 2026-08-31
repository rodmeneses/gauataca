import { useBandSync } from '../../store';
import { useAuth } from '../../lib/auth';
import { isDemo } from '../../lib/data';
import { LoginPage } from '../auth/LoginPage';
import { DesktopShell } from './DesktopShell';
import { MobileShell } from '../mobile/MobileShell';
import { EventModal } from '../modals/EventModal';
import { NewEventModal, NewSongModal, NewTxModal } from '../modals/FormModals';
import { ThreadModal } from '../modals/ThreadModal';
import { MemberModal } from '../modals/MemberModal';
import { SignInModal } from '../modals/SignInModal';
import { ShareSheet } from '../modals/ShareSheet';
import { CustodyDialog } from '../modals/CustodyDialog';
import { SettleDialog } from '../modals/SettleDialog';
import { CommandPalette } from '../modals/CommandPalette';
import { HandoffPanel } from '../modals/HandoffPanel';
import { TourOverlay } from '../modals/TourOverlay';
import { Toasts } from '../modals/Toasts';

/** Root layout: desktop or phone-preview shell, plus every overlay layer. */
export function Shell() {
  const bs = useBandSync();
  const { user, loading: authLoading } = useAuth();
  const { modal } = bs;
  if (authLoading) {
    return (
      <div className="min-h-screen bg-base grid place-items-center">
        <div className="flex flex-col items-center gap-3 text-[#64748b]">
          <div className="w-7 h-7 rounded-full border-2 border-[#1e293b] border-t-[#34d399] animate-spin" />
          <span className="font-mono text-[12px] tracking-[.08em] uppercase">…</span>
        </div>
      </div>
    );
  }
  if (!isDemo && !user) {
    return <LoginPage />;
  }
  if (bs.loading) {
    return (
      <div className="min-h-screen bg-base grid place-items-center">
        <div className="flex flex-col items-center gap-3 text-[#64748b]">
          <div className="w-7 h-7 rounded-full border-2 border-[#1e293b] border-t-[#34d399] animate-spin" />
          <span className="font-mono text-[12px] tracking-[.08em] uppercase">…</span>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-base text-ink-base font-sans text-[14px] leading-normal">
      {bs.error && (
        <div className="sticky top-0 z-40 bg-[#f43f5e14] border-b border-[#f43f5e4d] px-6 py-3 text-[13px] text-[#fda4af]">
          <span className="font-semibold">Couldn't load data from Supabase.</span>{' '}
          <span className="text-[#fda4af99]">Check that the schema + seed are applied and the env keys are set. ({bs.error})</span>
        </div>
      )}
      {bs.isDesktop ? <DesktopShell /> : <MobileShell />}

      {modal?.kind === 'event' && bs.ev && <EventModal />}
      {modal?.kind === 'newEvent' && <NewEventModal />}
      {modal?.kind === 'newTx' && <NewTxModal />}
      {modal?.kind === 'newSong' && <NewSongModal />}
      {modal?.kind === 'thread' && bs.th && <ThreadModal />}
      {modal?.kind === 'member' && bs.mb && <MemberModal />}
      {modal?.kind === 'signin' && <SignInModal />}

      {bs.sheet && <ShareSheet />}
      {bs.custody && <CustodyDialog />}
      {bs.settle && <SettleDialog />}
      {bs.state.palette && <CommandPalette />}
      {bs.state.handoff && <HandoffPanel />}
      {bs.tour.on && <TourOverlay />}
      {bs.toasts.length > 0 && <Toasts />}
    </div>
  );
}
