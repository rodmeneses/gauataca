import { useStore } from '../../store';
import { SignInForm } from './SignInForm';

/** Full-page sign-in gate shown when no user is signed in. */
export function LoginPage() {
  const { props } = useStore();
  const bandName = props.bandName || 'Dulce Tricolor Venezolano';

  return (
    <div className="min-h-screen bg-base grid place-items-center p-6">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <h1 className="font-display font-semibold text-[28px] leading-[1.15] text-ink tracking-[-.02em]">{bandName}</h1>
          <p className="mt-2 text-[13px] text-ink-muted">BandSync</p>
        </div>
        <div className="bg-raised border border-line rounded-[16px] p-6">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
