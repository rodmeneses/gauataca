/**
 * Thin top bar shown while the browser is offline, plus a toast when a write is
 * attempted with no connection (dispatched from lib/data.tsx `run`). Reads stay
 * available from the service-worker cache; writes are blocked until reconnect.
 */
import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useGuataca } from '@/store';

export function OfflineBanner() {
  const { t, toast } = useGuataca();
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      toast(t.backOnline);
    };
    const goOffline = () => setOnline(false);
    const onBlockedWrite = () => toast(t.offlineWriteBlocked, 'err');

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    window.addEventListener('guataca:offline-write', onBlockedWrite);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('guataca:offline-write', onBlockedWrite);
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
