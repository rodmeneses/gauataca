/**
 * Service-worker update prompt. `registerType: 'prompt'` in vite.config means a
 * new build is fetched but never activated until the user accepts here, so the
 * running session is never swapped out mid-action.
 */
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useGuataca } from '@/store';

export function UpdatePrompt() {
  const { t } = useGuataca();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      role="alertdialog"
      aria-label={t.updateReady}
      className="fixed z-[110] left-3 right-3 bottom-[calc(env(safe-area-inset-bottom)+84px)] sm:left-auto sm:right-[26px] sm:bottom-[26px] sm:max-w-[360px] flex items-center gap-3 p-[13px_15px] rounded-[12px] border border-line bg-raised backdrop-blur-[10px] shadow-pop animate-rise"
    >
      <span className="flex-1 font-sans font-semibold text-[13px] text-ink-body">{t.updateReady}</span>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        className="btn btn-quiet text-[12px] px-2 py-1"
      >
        {t.updateDismiss}
      </button>
      <button
        type="button"
        onClick={() => void updateServiceWorker(true)}
        className="btn btn-primary text-[12px] px-3 py-1"
      >
        {t.updateNow}
      </button>
    </div>
  );
}
