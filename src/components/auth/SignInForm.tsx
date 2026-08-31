import { useState } from 'react';
import { T } from '../../i18n';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../store';
import { Button, Field, Input } from '../ui';

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

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? '…' : mode === 'signin' ? t.signIn : t.signUp}
        </Button>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-line" />
          <span className="text-[12px] text-ink-muted">{t.or}</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        <div className="flex flex-col gap-2">
          <Button type="button" onClick={handleGoogle} variant="surface" className="w-full">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8M12 8v8" />
            </svg>
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
