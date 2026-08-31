import { useBandSync } from '../../store';
import { Modal } from '../ui';
import { SignInForm } from '../auth/SignInForm';

export function SignInModal() {
  const { state, closeModal } = useBandSync();

  if (state.modal?.kind !== 'signin') return null;

  return (
    <Modal onClose={closeModal} maxWidth={420}>
      <div className="p-6">
        <SignInForm onSuccess={closeModal} />
      </div>
    </Modal>
  );
}
