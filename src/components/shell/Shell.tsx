import { useBandSync } from '../../store';
import { DesktopShell } from './DesktopShell';
import { MobileShell } from '../mobile/MobileShell';
import { EventModal } from '../modals/EventModal';
import { NewEventModal, NewSongModal, NewTxModal } from '../modals/FormModals';
import { ThreadModal } from '../modals/ThreadModal';
import { MemberModal } from '../modals/MemberModal';
import { ShareSheet } from '../modals/ShareSheet';
import { CustodyDialog } from '../modals/CustodyDialog';
import { CommandPalette } from '../modals/CommandPalette';
import { HandoffPanel } from '../modals/HandoffPanel';
import { TourOverlay } from '../modals/TourOverlay';
import { Toasts } from '../modals/Toasts';

/** Root layout: desktop or phone-preview shell, plus every overlay layer. */
export function Shell() {
  const bs = useBandSync();
  const { modal } = bs;
  return (
    <div className="min-h-screen bg-base text-ink-base font-sans text-[14px] leading-normal">
      {bs.isDesktop ? <DesktopShell /> : <MobileShell />}

      {modal?.kind === 'event' && bs.ev && <EventModal />}
      {modal?.kind === 'newEvent' && <NewEventModal />}
      {modal?.kind === 'newTx' && <NewTxModal />}
      {modal?.kind === 'newSong' && <NewSongModal />}
      {modal?.kind === 'thread' && bs.th && <ThreadModal />}
      {modal?.kind === 'member' && bs.mb && <MemberModal />}

      {bs.sheet && <ShareSheet />}
      {bs.custody && <CustodyDialog />}
      {bs.state.palette && <CommandPalette />}
      {bs.state.handoff && <HandoffPanel />}
      {bs.tour.on && <TourOverlay />}
      {bs.toasts.length > 0 && <Toasts />}
    </div>
  );
}
