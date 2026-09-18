/**
 * Notification opt-in UI, shared between mobile (Profile tab) and the desktop
 * sidebar modal. Renders the enable/disable action and the per-category
 * toggles; a "not supported / blocked" note where push isn't available.
 */
import { type ReactNode } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useGuataca } from '@/store';
import { usePush } from '@/lib/push';
import { Button, Switch } from '@/components/ui';

function PrefRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 min-h-[40px]">
      <span className="flex-1 font-sans font-medium text-[14px] text-ink-body">{label}</span>
      <Switch checked={checked} label={label} onChange={(v) => void onChange(v)} />
    </div>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return <p className="m-0 font-sans text-[13px] leading-[1.5] text-ink-dim">{children}</p>;
}

export function NotificationPrefs() {
  const { t } = useGuataca();
  const { supported, permission, subscribed, busy, enable, disable, prefs, setPref } = usePush();

  if (!supported) {
    return <Notice>{t.notifyUnsupported}</Notice>;
  }

  if (!subscribed) {
    if (permission === 'denied') {
      return <Notice>{t.notifyBlocked}</Notice>;
    }
    return (
      <Button variant="primary" disabled={busy} onClick={() => void enable()} className="min-h-[44px] w-full gap-[8px]">
        <Bell size={16} strokeWidth={2} aria-hidden />
        {t.notifyEnable}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <PrefRow label={t.notifyEvents} checked={prefs.events} onChange={(v) => setPref('events', v)} />
      <PrefRow label={t.notifyForum} checked={prefs.forum} onChange={(v) => setPref('forum', v)} />
      <Button variant="surface" disabled={busy} onClick={() => void disable()} className="mt-1 min-h-[40px] w-full gap-[8px]">
        <BellOff size={15} strokeWidth={2} aria-hidden />
        {t.notifyDisable}
      </Button>
    </div>
  );
}
