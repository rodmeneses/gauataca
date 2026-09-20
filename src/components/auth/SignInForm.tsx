import { useState } from 'react';
import { T } from '../../i18n';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../store';
import { Button, Field, Input } from '../ui';

/** Official multicolor Google "G". Brand colors are fixed by Google's guidelines, so they don't follow the theme tokens. */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/** Email/password + OAuth sign-in/up form, shared by the login page and the modal. */
export function SignInForm({ onSuccess }: { onSuccess?: () => void }) {
  const { state } = useStore();
  const t = T[state.lang];
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = mode === 'signin'
      ? await signInWithEmail(email, password)
      : await signUpWithEmail(email, password, name);
    setLoading(false);
    if (result.error) setError(result.error);
    else onSuccess?.();
  };

  const handleGoogle = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error);
  };

  return (
    <div>
      <h2 className="font-display font-semibold text-[20px] text-ink mb-4">
        {mode === 'signin' ? t.signIn : t.signUp}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'signup' && (
          <Field label={t.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.name} required />
          </Field>
        )}
        <Field label={t.email}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </Field>
        <Field label={t.password}>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </Field>

        {error && <p className="text-[13px] text-rose-400">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full py-3 text-[15px]">
          {loading ? '…' : mode === 'signin' ? t.signIn : t.signUp}
        </Button>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-line" />
          <span className="text-[12px] text-ink-muted">{t.or}</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        <div className="flex flex-col gap-2">
          <Button type="button" onClick={handleGoogle} variant="surface" className="w-full py-3 text-[15px]">
            <GoogleLogo />
            Google
          </Button>
        </div>

        <p className="text-center text-[12.5px] text-ink-muted">
          {mode === 'signin' ? (
            <>
              {t.noAccount}{' '}
              <button type="button" onClick={() => setMode('signup')} className="text-violet-light underline">
                {t.signUp}
              </button>
            </>
          ) : (
            <>
              {t.haveAccount}{' '}
              <button type="button" onClick={() => setMode('signin')} className="text-violet-light underline">
                {t.signIn}
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
