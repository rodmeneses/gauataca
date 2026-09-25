import { useEffect, useRef, type ReactNode } from 'react';
import { useGuataca } from '../../store';
import { useAuth } from '../../lib/auth';
import { clearDeepLink, readDeepLink } from '../../lib/deepLink';
import { readSeenVersion, writeSeenVersion } from '../../lib/prefs';
import { APP_VERSION, entriesSince } from '../../data/changelog';
import { LoginPage } from '../auth/LoginPage';
import { DesktopShell } from './DesktopShell';
import { MobileShell } from '../mobile/MobileShell';
import { EventModal } from '../modals/EventModal';
import { NewEventModal, NewGearModal, NewSongModal, NewTxModal } from '../modals/FormModals';
import { NewThreadModal } from '../modals/NewThreadModal';
import { ThreadModal } from '../modals/ThreadModal';
import { MemberModal } from '../modals/MemberModal';
import { OnboardModal } from '../modals/OnboardModal';
import { SignInModal } from '../modals/SignInModal';
import { ChangelogModal } from '../changelog/ChangelogModal';
import { NotificationPrefsModal } from '../notifications/NotificationPrefsModal';
import { ShareSheet } from '../modals/ShareSheet';
import { CustodyDialog } from '../modals/CustodyDialog';
import { SettleDialog } from '../modals/SettleDialog';
import { CommandPalette } from '../modals/CommandPalette';
import { SearchOverlay } from '../modals/SearchOverlay';
import { HandoffPanel } from '../modals/HandoffPanel';
import { TourOverlay } from '../modals/TourOverlay';
import { Toasts } from '../modals/Toasts';
import { TopProgress } from './TopProgress';
import { UpdatePrompt } from '../pwa/UpdatePrompt';
import { OfflineBanner } from '../pwa/OfflineBanner';

/** Locks page scroll while the fixed-position phone shell is mounted. */
function PhoneFrame({ children }: { children: ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => { html.style.overflow = prev; };
  }, []);
  return <>{children}</>;
}

function DesktopWrapper({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-base text-ink-base font-sans text-[14px] leading-normal">{children}</div>;
}

/** Root layout: desktop or phone-preview shell, plus every overlay layer. */
export function Shell() {
  const bs = useGuataca();
  const { user, profile, loading: authLoading } = useAuth();
  const { modal } = bs;

  // First sign-in: open the instrument/vocal onboarding once, until completed or skipped.
  useEffect(() => {
    if (user && profile && profile.onboarded === false && !bs.state.onboardDismissed && !modal) {
      bs.openOnboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, bs.state.onboardDismissed, modal]);

  // After an update, show what's new once. First-ever visit just records the
  // version (new members get onboarding, not release notes).
  const changelogChecked = useRef(false);
  useEffect(() => {
    if (changelogChecked.current || !user || bs.loading || modal) return;
    changelogChecked.current = true;
    const seen = readSeenVersion();
    if (seen === APP_VERSION) return;
    writeSeenVersion(APP_VERSION);
    if (entriesSince(seen).length > 0) bs.openChangelog(seen ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, bs.loading, modal]);

  // Shareable deep link (?event= / ?song= / ?tx= / ?thread=[&comment=]): apply once data is loaded,
  // then strip the params so a refresh doesn't re-open the item.
  const deepLinkApplied = useRef(false);
  useEffect(() => {
    if (deepLinkApplied.current || bs.loading) return;
    deepLinkApplied.current = true;
    const dl = readDeepLink();
    if (!dl) return;
    clearDeepLink();
    if (dl.kind === 'event') bs.openEvent(dl.id);
    else if (dl.kind === 'song') bs.goToSong(dl.id);
    else if (dl.kind === 'tx') bs.goToTx(dl.id);
    else bs.openThread(dl.id, dl.commentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bs.loading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-base grid place-items-center">
        <div className="flex flex-col items-center gap-3 text-ink-muted">
          <div className="w-7 h-7 rounded-full border-2 border-line border-t-emerald animate-spin" />
          <span className="font-mono text-[12px] tracking-[.08em] uppercase">…</span>
        </div>
      </div>
    );
  }
  if (!user) {
    return <LoginPage />;
  }
  if (bs.loading) {
    return (
      <div className="min-h-screen bg-base grid place-items-center">
        <div className="flex flex-col items-center gap-3 text-ink-muted">
          <div className="w-7 h-7 rounded-full border-2 border-line border-t-emerald animate-spin" />
          <span className="font-mono text-[12px] tracking-[.08em] uppercase">…</span>
        </div>
      </div>
    );
  }
  const errorBanner = bs.error ? (
    <div className="flex-none bg-[var(--color-tint-rose)] border-b border-rose/40 px-5 py-3 text-[13px] text-red">
      <span className="font-semibold">Couldn't load data from Supabase.</span>{' '}
      <span className="text-red/70">Check that the schema + seed are applied and the env keys are set. ({bs.error})</span>
    </div>
  ) : null;

  // Real phone: the shell is `position: fixed`, so the page itself must not scroll.
  const phone = bs.isMobileViewport;
  const Wrapper = phone ? PhoneFrame : DesktopWrapper;

  return (
    <Wrapper>
      {phone ? (
        <MobileShell banner={errorBanner} />
      ) : (
        <>
          {bs.error && (
            <div className="sticky top-0 z-40 bg-[var(--color-tint-rose)] border-b border-rose/40 px-6 py-3 text-[13px] text-red">
              <span className="font-semibold">Couldn't load data from Supabase.</span>{' '}
              <span className="text-red/70">Check that the schema + seed are applied and the env keys are set. ({bs.error})</span>
            </div>
          )}
          {bs.isPhone ? <MobileShell /> : <DesktopShell />}
        </>
      )}

      {modal?.kind === 'event' && bs.ev && <EventModal />}
      {modal?.kind === 'newEvent' && <NewEventModal />}
      {modal?.kind === 'newTx' && <NewTxModal />}
      {modal?.kind === 'newSong' && <NewSongModal />}
      {modal?.kind === 'newGear' && <NewGearModal />}
      {modal?.kind === 'newThread' && <NewThreadModal />}
      {modal?.kind === 'onboard' && <OnboardModal />}
      {modal?.kind === 'thread' && bs.th && <ThreadModal />}
      {modal?.kind === 'member' && bs.mb && <MemberModal />}
      {modal?.kind === 'signin' && <SignInModal />}
      {modal?.kind === 'notifications' && <NotificationPrefsModal />}
      {modal?.kind === 'changelog' && <ChangelogModal />}

      {bs.sheet && <ShareSheet />}
      {bs.custody && <CustodyDialog />}
      {bs.settle && <SettleDialog />}
      {bs.state.palette && <CommandPalette />}
      {bs.state.search && <SearchOverlay />}
      {bs.state.handoff && <HandoffPanel />}
      {bs.tour.on && <TourOverlay />}
      {bs.toasts.length > 0 && <Toasts />}
      <TopProgress />
      <OfflineBanner />
      <UpdatePrompt />
    </Wrapper>
  );
}
