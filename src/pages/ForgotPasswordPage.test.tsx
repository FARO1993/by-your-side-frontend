import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  forgotPassword: vi.fn(),
}));

vi.mock('../api/auth', () => ({
  forgotPassword: api.forgotPassword,
}));

import ForgotPasswordPage from './ForgotPasswordPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

function axiosStatus(status: number) {
  const error = new AxiosError('no');
  error.response = {
    status,
    data: { message: 'bad' },
    statusText: 'Bad Request',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  };
  return error;
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    api.forgotPassword.mockReset();
  });

  it('renders the shared auth layout with one logo', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Recuperar contraseña' })).toBeInTheDocument();
    expect(screen.getByText('Te enviamos instrucciones si hay una cuenta con ese correo.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No tenés que resolverlo solo.' })).toBeInTheDocument();
    expect(screen.getAllByText('ByYourSide')).toHaveLength(1);
    expect(document.querySelectorAll('.auth-logo-mark')).toHaveLength(1);
    expect(document.querySelector('.auth-panel')?.querySelector('.auth-logo-mark')).toBeNull();
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByRole('link', { name: 'Volver a ingresar' })).toHaveAttribute('href', '/login');
  });

  it('shows a stable loading label and then a generic success', async () => {
    let resolveRequest: (value: unknown) => void = () => undefined;
    api.forgotPassword.mockImplementation(() => new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar instrucciones' }));

    const sending = screen.getByRole('button', { name: 'Enviando…' });
    expect(sending).toBeDisabled();
    expect(api.forgotPassword).toHaveBeenCalledWith('ana@example.com');

    resolveRequest({ message: 'ok' });

    expect(await screen.findByRole('heading', { name: 'Revisá tu correo' })).toBeInTheDocument();
    expect(
      screen.getByText('Si existe una cuenta asociada a ese correo, te enviamos instrucciones para continuar.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/no existe/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Correo electrónico')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver a ingresar' })).toHaveAttribute('href', '/login');
  });

  it('shows a field error for an invalid email and a form alert otherwise', async () => {
    const user = userEvent.setup();
    api.forgotPassword.mockRejectedValueOnce(axiosStatus(400));
    renderPage();

    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar instrucciones' }));

    expect(await screen.findByText('Ingresá un correo válido.')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');

    api.forgotPassword.mockRejectedValueOnce(axiosStatus(500));
    await user.click(screen.getByRole('button', { name: 'Enviar instrucciones' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos enviar el pedido. Intentá de nuevo en un momento.',
    );
  });
});
