import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAuthTransitionArmed } from '../components/auth/authTransition';

const auth = vi.hoisted(() => ({
  login: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: auth.login,
  }),
}));

import LoginPage from './LoginPage';

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com');
  await user.type(screen.getByLabelText('Contraseña'), 'secretpass');
}

describe('LoginPage', () => {
  beforeEach(() => {
    auth.login.mockReset();
    auth.login.mockResolvedValue(undefined);
  });

  it('renders the reunion copy, one logo, and the existing ways out', () => {
    renderLogin();

    expect(screen.getByRole('heading', { name: 'Qué bueno verte de nuevo' })).toBeInTheDocument();
    expect(screen.getByText('Ingresá para reencontrarte con quienes te acompañan.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No tenés que atravesarlo solo.' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Un espacio tranquilo para volver, compartir cómo estás y encontrar a alguien que te acompañe.',
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText('ByYourSide')).toHaveLength(1);
    expect(document.querySelectorAll('.auth-logo-mark')).toHaveLength(1);
    expect(document.querySelector('.auth-panel')?.querySelector('.auth-logo-mark')).toBeNull();
    expect(screen.getByRole('link', { name: '¿Olvidaste tu contraseña?' })).toHaveAttribute('href', '/forgot-password');
    expect(screen.getByRole('link', { name: 'Unite' })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: '¿Necesitás ayuda ahora?' })).toHaveAttribute('href', '/help');
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('autocomplete', 'current-password');
  });

  it('shows and hides the password without changing its value', async () => {
    const user = userEvent.setup();
    renderLogin();

    const password = screen.getByLabelText('Contraseña');
    await user.type(password, 'secretpass');
    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));

    expect(password).toHaveAttribute('type', 'text');
    expect(password).toHaveValue('secretpass');
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(password).toHaveAttribute('type', 'password');
    expect(password).toHaveValue('secretpass');
  });

  it('shows an inline email error and does not submit', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText('Correo electrónico'), 'no-es-correo');
    await user.type(screen.getByLabelText('Contraseña'), 'secretpass');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    const email = screen.getByLabelText('Correo electrónico');
    expect(screen.getByText('Ese correo no parece válido.')).toBeInTheDocument();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    const describedBy = email.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent('Ese correo no parece válido.');
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('submits with Enter and keeps a single in-flight request', async () => {
    const user = userEvent.setup();
    let resolveLogin: () => void = () => {};
    auth.login.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveLogin = resolve;
      }),
    );
    renderLogin();

    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secretpass{Enter}');

    const pending = screen.getByRole('button', { name: 'Entrando…' });
    expect(pending).toBeDisabled();
    expect(auth.login).toHaveBeenCalledTimes(1);
    expect(auth.login).toHaveBeenCalledWith({ email: 'ana@example.com', password: 'secretpass' });

    await user.click(pending);
    expect(auth.login).toHaveBeenCalledTimes(1);

    resolveLogin();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Listo' })).toBeInTheDocument());
    expect(document.querySelector('.auth-panel.is-success')).toBeTruthy();
    expect(getAuthTransitionArmed()).toBe(true);
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('ana@example.com');
  });

  it('keeps the email and shows a calm message when login fails', async () => {
    const user = userEvent.setup();
    auth.login.mockRejectedValue(new Error('stack trace 500'));
    renderLogin();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos iniciar sesión. Intentá de nuevo.');
    expect(screen.queryByText(/stack trace|500/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('ana@example.com');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('secretpass');
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled();
  });
});
