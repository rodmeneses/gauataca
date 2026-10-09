/**
 * Thin top bar shown while the browser is offline, plus a toast when a write is
 * attempted with no connection (dispatched from lib/data.tsx `run`). Reads stay
 * available from the service-worker cache; writes are queued in memory and
 * replayed on reconnect (lib/offlineQueue.ts).
 */
import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useGuataca } from '@/store';
import { SAVE_FAILURE_KEY, type SaveFailure } from '../../lib/errors';

export function OfflineBanner() {
  const { t, toast } = useGuataca();
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      toast(t.backOnline);
    };
    const goOffline = () => setOnline(false);
    const onQueuedWrite = () => toast(t.offlineWriteQueued, 'violet');
    const onSaveFailed = (e: Event) => {
      const reason = (e as CustomEvent<{ reason: SaveFailure }>).detail?.reason ?? 'unknown';
      toast(t[SAVE_FAILURE_KEY[reason]], 'err');
    };
    const onFlushed = (e: Event) => {
      const failed = (e as CustomEvent<{ failed: number }>).detail?.failed ?? 0;
      toast(failed ? t.queuedWritesFailed : t.queuedWritesSynced, failed ? 'err' : 'ok');
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    window.addEventListener('guataca:offline-write', onQueuedWrite);
    window.addEventListener('guataca:queue-flushed', onFlushed);
    window.addEventListener('guataca:mutation-error', onSaveFailed);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('guataca:offline-write', onQueuedWrite);
      window.removeEventListener('guataca:queue-flushed', onFlushed);
      window.removeEventListener('guataca:mutation-error', onSaveFailed);
    };
  }, [t, toast]);

  if (online) return null;

  return (
    <div
      role="status"
      className="fixed top-0 inset-x-0 z-[105] flex items-center justify-center gap-2 px-4 py-1.5 pt-[calc(env(safe-area-inset-top)+6px)] bg-[var(--color-tint-amber)] border-b border-amber/40 text-amber font-sans font-semibold text-[12px] leading-normal backdrop-blur-[6px]"
    >
      <WifiOff size={13} strokeWidth={2.2} className="flex-none" />
      <span>{t.offline}</span>
    </div>
  );
}
