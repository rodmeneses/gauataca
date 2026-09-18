/** Desktop settings: Web Push opt-in, opened from the sidebar footer bell. */
import { useGuataca } from '@/store';
import { Modal } from '@/components/ui';
import { FormBody, FormHeader } from '@/components/modals/FormModals';
import { NotificationPrefs } from './NotificationPrefs';

export function NotificationPrefsModal() {
  const { t, closeModal } = useGuataca();
  return (
    <Modal onClose={closeModal} maxWidth={420}>
      <FormHeader title={t.notifications} onClose={closeModal} />
      <FormBody>
        <NotificationPrefs />
      </FormBody>
    </Modal>
  );
}
