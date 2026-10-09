import { Suspense, useEffect, useRef, type ReactNode } from 'react';
import { useGuataca } from '../../store';
import { useAuth } from '../../lib/auth';
import { clearDeepLink, readDeepLink, takePendingDeepLink } from '../../lib/deepLink';
import { readSeenVersion, writeSeenVersion } from '../../lib/prefs';
import { APP_VERSION, entriesSince } from '../../data/changelog';
import { Skeleton } from '../ui';
import { LoginPage } from '../auth/LoginPage';
import { DesktopShell } from './DesktopShell';
import { MobileShell } from '../mobile/MobileShell';
import { Toasts } from '../modals/Toasts';
import { TopProgress } from './TopProgress';
import { UpdatePrompt } from '../pwa/UpdatePrompt';
import { OfflineBanner } from '../pwa/OfflineBanner';
import { lazyNamed } from '../../lib/lazyNamed';

const EventModal = lazyNamed(() => import('../modals/EventModal'), 'EventModal');
const NewEventModal = lazyNamed(() => import('../modals/FormModals'), 'NewEventModal');
const NewGearModal = lazyNamed(() => import('../modals/FormModals'), 'NewGearModal');
const NewSongModal = lazyNamed(() => import('../modals/FormModals'), 'NewSongModal');
const NewTxModal = lazyNamed(() => import('../modals/FormModals'), 'NewTxModal');
const NewThreadModal = lazyNamed(() => import('../modals/NewThreadModal'), 'NewThreadModal');
const ThreadModal = lazyNamed(() => import('../modals/ThreadModal'), 'ThreadModal');
const MemberModal = lazyNamed(() => import('../modals/MemberModal'), 'MemberModal');
const OnboardModal = lazyNamed(() => import('../modals/OnboardModal'), 'OnboardModal');
const SignInModal = lazyNamed(() => import('../modals/SignInModal'), 'SignInModal');
const ChangelogModal = lazyNamed(() => import('../changelog/ChangelogModal'), 'ChangelogModal');
const NotificationPrefsModal = lazyNamed(() => import('../notifications/NotificationPrefsModal'), 'NotificationPrefsModal');
const ShareSheet = lazyNamed(() => import('../modals/ShareSheet'), 'ShareSheet');
const CustodyDialog = lazyNamed(() => import('../modals/CustodyDialog'), 'CustodyDialog');
const SettleDialog = lazyNamed(() => import('../modals/SettleDialog'), 'SettleDialog');
const CommandPalette = lazyNamed(() => import('../modals/CommandPalette'), 'CommandPalette');
const SearchOverlay = lazyNamed(() => import('../modals/SearchOverlay'), 'SearchOverlay');
const HandoffPanel = lazyNamed(() => import('../modals/HandoffPanel'), 'HandoffPanel');
const TourOverlay = lazyNamed(() => import('../modals/TourOverlay'), 'TourOverlay');

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
  const onboardDismissed = bs.state.onboardDismissed;
  const loading = bs.loading;
  // Latest view-model for the run-once effects below, so they don't depend on the
  // (per-render) `bs` object. Declared first so it is refreshed before they run.
  const bsRef = useRef(bs);
  useEffect(() => { bsRef.current = bs; });

  // Keep <html lang> in sync with the chosen language (screen readers, hyphenation, translation prompts).
  useEffect(() => { document.documentElement.lang = bs.lang; }, [bs.lang]);

  // First sign-in: open the instrument/vocal onboarding once, until completed or skipped.
  useEffect(() => {
    if (user && profile && profile.onboarded === false && !onboardDismissed && !modal) {
      bsRef.current.openOnboard();
    }
  }, [user, profile, onboardDismissed, modal]);

  // After an update, show what's new once. First-ever visit just records the
  // version (new members get onboarding, not release notes).
  const changelogChecked = useRef(false);
  useEffect(() => {
    if (changelogChecked.current || !user || loading || modal) return;
    changelogChecked.current = true;
    const seen = readSeenVersion();
    if (seen === APP_VERSION) return;
    writeSeenVersion(APP_VERSION);
    if (entriesSince(seen).length > 0) bsRef.current.openChangelog(seen ?? undefined);
  }, [user, loading, modal]);

  // Shareable deep link (?event= / ?song= / ?tx= / ?thread=[&comment=]): apply once data is loaded,
  // then strip the params so a refresh doesn't re-open the item. Falls back to a
  // link stashed in sessionStorage (see savePendingDeepLink) for round trips that
  // drop the URL, e.g. the Google OAuth redirect in src/lib/auth.tsx.
  const deepLinkApplied = useRef(false);
  useEffect(() => {
    if (deepLinkApplied.current || loading) return;
    deepLinkApplied.current = true;
    const dl = readDeepLink();
    if (dl) clearDeepLink();
    const target = dl ?? takePendingDeepLink();
    if (!target) return;
    const { kind, id, commentId } = target;
    const vm = bsRef.current;
    if (kind === 'event') vm.openEvent(id);
    else if (kind === 'song') vm.goToSong(id);
    else if (kind === 'tx') vm.goToTx(id);
    else vm.openThread(id, commentId);
  }, [loading]);

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
      <div role="status" aria-busy="true" aria-label="…" className="min-h-screen bg-base flex">
        <Skeleton className="hidden md:block w-[232px] flex-none rounded-none" />
        <div className="flex-1 min-w-0 p-5 md:p-8 flex flex-col gap-4 max-w-[1100px]">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    );
  }
  const errorBanner = bs.error ? (
    <div className="flex-none bg-[var(--color-tint-rose)] border-b border-rose/40 px-5 py-3 text-[13px] text-red">
      <span className="font-semibold">{bs.t.loadFailed}</span>{' '}
      <span className="text-red/70">{bs.t.loadFailedHint} ({bs.error})</span>
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
              <span className="font-semibold">{bs.t.loadFailed}</span>{' '}
              <span className="text-red/70">{bs.t.loadFailedHint} ({bs.error})</span>
            </div>
          )}
          {bs.isPhone ? <MobileShell /> : <DesktopShell />}
        </>
      )}

      <Suspense fallback={null}>
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
      </Suspense>
      {bs.toasts.length > 0 && <Toasts />}
      <TopProgress />
      <OfflineBanner />
      <UpdatePrompt />
    </Wrapper>
  );
}
