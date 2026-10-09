/**
 * "Subscribe to the band calendar": a private, per-member iCalendar feed URL
 * (served by `api/calendar.ts`) for Apple/Google/Outlook Calendar. Shared between
 * the mobile Profile tab and the desktop settings modal.
 */
import { useState } from 'react';
import { CalendarSync, Copy, RefreshCw } from 'lucide-react';
import { useGuataca } from '@/store';
import { useAuth } from '@/lib/auth';
import { getCalendarToken, rotateCalendarToken } from '@/lib/api';
import { Button } from '@/components/ui';
import { useConfirm } from '@/components/ui/ConfirmDialog';

export function CalendarFeed() {
  const { t, toast } = useGuataca();
  const { user } = useAuth();
  const { confirm, dialog } = useConfirm();
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const feedUrl = (token: string) => `${window.location.origin}/api/calendar?token=${token}`;

  const withToken = async (get: () => Promise<string | null>, then: (url: string) => void | Promise<void>) => {
    setBusy(true);
    try {
      const token = await get();
      if (!token) return toast(t.calendarFeedFailed, 'err');
      await then(feedUrl(token));
    } catch {
      toast(t.calendarFeedFailed, 'err');
    } finally {
      setBusy(false);
    }
  };

  const copy = (url: string) =>
    navigator.clipboard.writeText(url).then(() => toast(t.calendarFeedCopied), () => { window.prompt(t.calendarFeedCopy, url); });

  return (
    <div className="flex flex-col gap-2.5">
      <p className="m-0 font-sans text-[13px] leading-[1.5] text-ink-dim">{t.calendarFeedHint}</p>
      <Button variant="surface" disabled={busy} onClick={() => void withToken(() => getCalendarToken(user.id), copy)} className="min-h-[44px] w-full gap-[8px]">
        <Copy size={15} strokeWidth={2} aria-hidden />
        {t.calendarFeedCopy}
      </Button>
      <Button
        variant="surface"
        disabled={busy}
        onClick={() => void withToken(() => getCalendarToken(user.id), (url) => { window.location.href = url.replace(/^https?:/, 'webcal:'); })}
        className="min-h-[44px] w-full gap-[8px]"
      >
        <CalendarSync size={15} strokeWidth={2} aria-hidden />
        {t.calendarFeedOpen}
      </Button>
      <button
        type="button"
        disabled={busy}
        onClick={() => confirm({
          message: t.calendarFeedResetConfirm,
          onConfirm: () => withToken(() => rotateCalendarToken(user.id), () => toast(t.calendarFeedReset)),
        })}
        className="flex items-center justify-center gap-2 min-h-[40px] bg-transparent border-0 text-ink-muted font-sans font-medium text-[12.5px] cursor-pointer hover:text-ink-body"
      >
        <RefreshCw size={13} strokeWidth={2} aria-hidden />
        {t.calendarFeedResetBtn}
      </button>
      {dialog}
    </div>
  );
}
