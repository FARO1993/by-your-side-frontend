import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  applyPasswordReset: vi.fn(),
}));

vi.mock('../auth/accountActions', () => ({
  applyPasswordReset: api.applyPasswordReset,
}));

import ResetPasswordPage from './ResetPasswordPage';

function renderPage(path = '/reset-password?token=reset-token') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<p>Login</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    api.applyPasswordReset.mockReset();
    api.applyPasswordReset.mockResolvedValue(undefined);
  });

  it('renders both password fields inside the shared layout', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Nueva contraseña' })).toBeInTheDocument();
    expect(screen.getByText('Elegí una contraseña de al menos 8 caracteres.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Volvé a entrar con calma.' })).toBeInTheDocument();
    expect(screen.getAllByText('ByYourSide')).toHaveLength(1);
    expect(document.querySelectorAll('.auth-logo-mark')).toHaveLength(1);
    expect(screen.getByLabelText('Nueva contraseña')).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByLabelText('Confirmá la contraseña')).toHaveAttribute('autocomplete', 'new-password');
  });

  it('shows and hides each password without changing its value', async () => {
    const user = userEvent.setup();
    renderPage();

    const password = screen.getByLabelText('Nueva contraseña');
    const confirmation = screen.getByLabelText('Confirmá la contraseña');
    await user.type(password, 'secretpass');
    await user.type(confirmation, 'secretpass');
    await user.click(screen.getByRole('button', { name: 'Mostrar nueva contraseña' }));
    await user.click(screen.getByRole('button', { name: 'Mostrar confirmación de contraseña' }));

    expect(password).toHaveAttribute('type', 'text');
    expect(confirmation).toHaveAttribute('type', 'text');
    expect(password).toHaveValue('secretpass');
    expect(screen.getByRole('button', { name: 'Ocultar nueva contraseña' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows a field error and does not submit when the passwords do not match', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Nueva contraseña'), 'secretpass');
    await user.type(screen.getByLabelText('Confirmá la contraseña'), 'otra-clave');
    await user.click(screen.getByRole('button', { name: 'Restablecer contraseña' }));

    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmá la contraseña')).toHaveAttribute('aria-invalid', 'true');
    expect(api.applyPasswordReset).not.toHaveBeenCalled();
  });

  it('submits the real reset and returns to login', async () => {
    let resolveRequest: (value: unknown) => void = () => undefined;
    api.applyPasswordReset.mockImplementation(() => new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Nueva contraseña'), 'secretpass');
    await user.type(screen.getByLabelText('Confirmá la contraseña'), 'secretpass');
    await user.click(screen.getByRole('button', { name: 'Restablecer contraseña' }));

    expect(screen.getByRole('button', { name: 'Restableciendo…' })).toBeDisabled();
    expect(api.applyPasswordReset).toHaveBeenCalledWith({ token: 'reset-token', newPassword: 'secretpass' });

    resolveRequest(undefined);
    expect(await screen.findByText('Login')).toBeInTheDocument();
  });

  it('shows the existing reset error and a way to ask for a new link', async () => {
    const error = new AxiosError('no');
    error.response = {
      status: 400,
      data: { message: 'Reset token has expired' },
      statusText: 'Bad Request',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };
    api.applyPasswordReset.mockRejectedValue(error);
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Nueva contraseña'), 'secretpass');
    await user.type(screen.getByLabelText('Confirmá la contraseña'), 'secretpass');
    await user.click(screen.getByRole('button', { name: 'Restablecer contraseña' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Este enlace venció. Pedí uno nuevo.');
    expect(screen.getByRole('link', { name: 'Pedir un enlace nuevo' })).toHaveAttribute('href', '/forgot-password');
  });
});
