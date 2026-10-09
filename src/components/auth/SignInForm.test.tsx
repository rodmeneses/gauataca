import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { T } from '../../i18n';

const auth = vi.hoisted(() => ({
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
}));
vi.mock('../../lib/auth', () => ({ useAuth: () => auth }));
vi.mock('../../store', () => ({ useStore: () => ({ state: { lang: 'en' } }) }));

import { SignInForm } from './SignInForm';

const t = T.en;
const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => {
  auth.signInWithEmail.mockReset().mockResolvedValue({});
  auth.signUpWithEmail.mockReset().mockResolvedValue({});
  auth.signInWithGoogle.mockReset().mockResolvedValue({});
});

describe('SignInForm', () => {
  it('signs in with email + password and reports success', async () => {
    const onSuccess = vi.fn();
    render(<SignInForm onSuccess={onSuccess} />);
    fill(t.email, 'a@b.co');
    fill(t.password, 'secret');
    fireEvent.click(screen.getAllByRole('button', { name: t.signIn })[0]);
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(auth.signInWithEmail).toHaveBeenCalledWith('a@b.co', 'secret');
  });

  it('shows the error and stays open when sign-in fails', async () => {
    auth.signInWithEmail.mockResolvedValue({ error: 'Invalid login credentials' });
    const onSuccess = vi.fn();
    render(<SignInForm onSuccess={onSuccess} />);
    fill(t.email, 'a@b.co');
    fill(t.password, 'nope');
    fireEvent.click(screen.getAllByRole('button', { name: t.signIn })[0]);
    expect((await screen.findByText('Invalid login credentials'))).toBeTruthy();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('switches to sign-up, asks for a name and creates the account', async () => {
    render(<SignInForm />);
    fireEvent.click(screen.getByRole('button', { name: t.signUp }));
    fill(t.name, 'Ana Pérez');
    fill(t.email, 'ana@b.co');
    fill(t.password, 'secret');
    fireEvent.click(screen.getAllByRole('button', { name: t.signUp })[0]);
    await waitFor(() => expect(auth.signUpWithEmail).toHaveBeenCalledWith('ana@b.co', 'secret', 'Ana Pérez'));
    fireEvent.click(screen.getByRole('button', { name: t.signIn }));
    expect(screen.queryByLabelText(t.name)).toBeNull();
  });

  it('surfaces a Google sign-in failure', async () => {
    auth.signInWithGoogle.mockResolvedValue({ error: 'popup closed' });
    render(<SignInForm />);
    fireEvent.click(screen.getByRole('button', { name: /Google/ }));
    expect(await screen.findByText('popup closed')).toBeTruthy();
  });
});
