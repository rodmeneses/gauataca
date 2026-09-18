/**
 * Web Push: the device-side half of notifications.
 *
 * `PushProvider` owns:
 *  - whether push is supported/possible on this browser+origin (a service
 *    worker must actually be installed — in `npm run dev` it is not, so this is
 *    false there by design);
 *  - the device subscription (enable / disable → `push_subscriptions` row);
 *  - the per-member category preferences (columns on `profiles`).
 *
 * The other half is the service worker (`src/sw.js`, push/notificationclick)
 * and the Vercel backend (`api/notify.ts`) that does the actual fan-out.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './auth';
import { supabase } from './supabase';

/** Notification categories a member can opt into. */
export type PushCategory = 'events' | 'forum';

type PermissionState = NotificationPermission | 'unsupported';

interface PushValue {
  /** False when the browser can't push, VAPID key is missing, or there's no service worker (e.g. `npm run dev`). */
  supported: boolean;
  /** 'unsupported' while probing; then Notification.permission. */
  permission: PermissionState;
  /** True when this device has an active subscription row for this member. */
  subscribed: boolean;
  /** True while subscribe/unsubscribe is in flight (disable the button). */
  busy: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  prefs: { events: boolean; forum: boolean };
  setPref: (kind: PushCategory, value: boolean) => Promise<void>;
}

const PushContext = createContext<PushValue | null>(null);

/** Convert a base64url VAPID key to the Uint8Array the Push API expects. */
function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Encode a subscription p256dh/auth key (ArrayBuffer) as a base64url string. */
function keyToBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return window.btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function PushProvider({ children }: { children: ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();

  const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

  const [permission, setPermission] = useState<PermissionState>('unsupported');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  // Probe support after mount: a service worker must exist for push to work.
  useEffect(() => {
    let cancelled = false;
    const probe = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window) || !vapid) {
        setPermission('unsupported');
        return;
      }
      const reg = await navigator.serviceWorker.getRegistration();
      if (cancelled) return;
      if (!reg) {
        // No SW installed yet (e.g. `npm run dev`, or first load before the
        // registration finished) — push isn't possible here.
        setPermission('unsupported');
        return;
      }
      setPermission(Notification.permission);
      const sub = await reg.pushManager.getSubscription();
      if (!cancelled) setSubscribed(!!sub && Notification.permission === 'granted');
    };
    void probe();
    // Registration is async on the first install, so the probe above can win the
    // race and report unsupported until a reload. Re-probe once `ready` settles.
    if ('serviceWorker' in navigator && vapid) {
      navigator.serviceWorker.ready
        .then(() => { if (!cancelled) void probe(); })
        .catch(() => { /* insecure origin or no SW — stays unsupported */ });
    }
    return () => { cancelled = true; };
  }, [vapid]);

  // No SW ⇒ permission stays 'unsupported', so this is the full support check.
  const supported = permission !== 'unsupported';

  const enable = useCallback(async () => {
    if (!user || !vapid || !supported) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const granted = await Notification.requestPermission();
        setPermission(granted);
        if (granted !== 'granted') return;
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid),
        });
      }
      await supabase.from('push_subscriptions').upsert(
        {
          profile_id: user.id,
          endpoint: sub.endpoint,
          p256dh: keyToBase64Url(sub.getKey('p256dh')),
          auth: keyToBase64Url(sub.getKey('auth')),
          user_agent: navigator.userAgent,
        },
        { onConflict: 'endpoint' },
      );
      setSubscribed(true);
    } finally {
      setBusy(false);
    }
  }, [user, vapid, supported]);

  const disable = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }, [user]);

  const setPref = useCallback(
    async (kind: PushCategory, value: boolean) => {
      if (!user) return;
      const column = kind === 'events' ? 'notify_events' : 'notify_forum';
      await supabase.from('profiles').update({ [column]: value }).eq('id', user.id);
      await refreshProfile();
    },
    [user, refreshProfile],
  );

  const prefs = useMemo(
    () => ({
      // Defaults on for everyone; the real opt-in gate is the permission grant.
      events: profile?.notify_events ?? true,
      forum: profile?.notify_forum ?? true,
    }),
    [profile],
  );

  const value = useMemo<PushValue>(
    () => ({ supported, permission, subscribed, busy, enable, disable, prefs, setPref }),
    [supported, permission, subscribed, busy, enable, disable, prefs, setPref],
  );

  return <PushContext.Provider value={value}>{children}</PushContext.Provider>;
}

export function usePush(): PushValue {
  const ctx = useContext(PushContext);
  if (!ctx) throw new Error('usePush must be used inside <PushProvider>');
  return ctx;
}
