import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  verifyEmail: vi.fn(),
  resendVerification: vi.fn(),
}));

const auth = vi.hoisted(() => ({
  user: null as { email: string } | null,
  status: 'anonymous' as 'anonymous' | 'authenticated',
  reloadUser: vi.fn(),
}));

vi.mock('../api/auth', () => ({
  verifyEmail: api.verifyEmail,
  resendVerification: api.resendVerification,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => auth,
}));

import VerifyEmailPage from './VerifyEmailPage';

function renderPage(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/login" element={<p>Login</p>} />
        <Route path="/feed" element={<p>Feed</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    auth.user = null;
    auth.status = 'anonymous';
    auth.reloadUser = vi.fn().mockResolvedValue(undefined);
    api.verifyEmail.mockReset();
    api.resendVerification.mockReset();
  });

  it('renders the waiting state with one logo', () => {
    api.verifyEmail.mockImplementation(() => new Promise(() => undefined));
    renderPage('/verify-email?token=pending-token');

    expect(screen.getByRole('heading', { name: 'Verificá tu correo' })).toBeInTheDocument();
    expect(screen.getByText('Estamos verificando tu correo.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Este espacio es tuyo.' })).toBeInTheDocument();
    expect(screen.getAllByText('ByYourSide')).toHaveLength(1);
    expect(document.querySelectorAll('.auth-logo-mark')).toHaveLength(1);
    expect(screen.queryByText('pending-token')).not.toBeInTheDocument();
  });

  it('shows success and goes to login when there is no session', async () => {
    api.verifyEmail.mockResolvedValue({ emailVerified: true });
    const user = userEvent.setup();
    renderPage('/verify-email?token=success-token');

    expect(await screen.findByText('Tu correo quedó verificado.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(await screen.findByText('Login')).toBeInTheDocument();
  });

  it('offers the feed when the verified person is already signed in', async () => {
    auth.user = { email: 'ana@example.com' };
    auth.status = 'authenticated';
    api.verifyEmail.mockResolvedValue({ emailVerified: true });
    const user = userEvent.setup();
    renderPage('/verify-email?token=signed-in-token');

    await user.click(await screen.findByRole('button', { name: 'Ir al inicio' }));
    expect(await screen.findByText('Feed')).toBeInTheDocument();
    expect(auth.reloadUser).toHaveBeenCalled();
  });

  it('explains a missing link and keeps resend', () => {
    renderPage('/verify-email');

    expect(screen.getByRole('alert')).toHaveTextContent('Falta el enlace');
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reenviar verificación' })).toBeInTheDocument();
    expect(api.verifyEmail).not.toHaveBeenCalled();
  });

  it('shows an invalid link and still offers resend', async () => {
    const error = new AxiosError('no');
    error.response = {
      status: 400,
      data: { message: 'invalid' },
      statusText: 'Bad Request',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };
    api.verifyEmail.mockRejectedValue(error);
    renderPage('/verify-email?token=invalid-token');

    expect(await screen.findByRole('alert')).toHaveTextContent('El enlace no es válido');
    expect(screen.getByRole('button', { name: 'Reenviar verificación' })).toBeInTheDocument();
    expect(screen.queryByText('invalid-token')).not.toBeInTheDocument();
  });
});
