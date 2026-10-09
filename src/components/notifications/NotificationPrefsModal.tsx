/** Desktop settings: Web Push opt-in and calendar feed, opened from the sidebar footer bell. */
import { useGuataca } from '@/store';
import { Modal } from '@/components/ui';
import { FormBody, FormHeader } from '@/components/modals/FormModals';
import { NotificationPrefs } from './NotificationPrefs';
import { CalendarFeed } from './CalendarFeed';

export function NotificationPrefsModal() {
  const { t, closeModal } = useGuataca();
  return (
    <Modal onClose={closeModal} maxWidth={420}>
      <FormHeader title={t.notifications} onClose={closeModal} />
      <FormBody>
        <NotificationPrefs />
        <div className="mt-5 pt-4 border-t border-line-soft">
          <div className="font-display font-semibold text-[10.5px] tracking-[.11em] uppercase text-ink-muted mb-[9px]">{t.calendarFeed}</div>
          <CalendarFeed />
        </div>
      </FormBody>
    </Modal>
  );
}
