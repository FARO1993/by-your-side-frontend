import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  register: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    register: auth.register,
  }),
}));

import RegisterPage from './RegisterPage';

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/feed" element={<p>Feed</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('¿Cómo querés que te llamemos?'), 'Ana');
  await user.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com');
  await user.type(screen.getByLabelText('Contraseña'), 'secretpass');
}

describe('RegisterPage', () => {
  beforeEach(() => {
    auth.register.mockReset();
    auth.register.mockResolvedValue(undefined);
  });

  it('renders the current fields and a single logo', () => {
    renderRegister();

    expect(screen.getByRole('heading', { name: 'Encontrá un lugar donde estar' })).toBeInTheDocument();
    expect(screen.getByText('Creá un espacio para compartir, escuchar y acompañar.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hay lugar para vos acá.' })).toBeInTheDocument();
    expect(screen.getByLabelText('¿Cómo querés que te llamemos?')).toHaveAttribute('autocomplete', 'nickname');
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByText('Al menos 8 caracteres.')).toBeInTheDocument();
    expect(screen.getAllByText('ByYourSide')).toHaveLength(1);
    expect(document.querySelectorAll('.auth-logo-mark')).toHaveLength(1);
    expect(document.querySelector('.auth-panel')?.querySelector('.auth-logo-mark')).toBeNull();
    expect(screen.getByRole('link', { name: 'Ingresá' })).toHaveAttribute('href', '/login');
  });

  it('shows and hides the password without changing its value', async () => {
    const user = userEvent.setup();
    renderRegister();

    const password = screen.getByLabelText('Contraseña');
    await user.type(password, 'secretpass');
    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));

    expect(password).toHaveAttribute('type', 'text');
    expect(password).toHaveValue('secretpass');

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(password).toHaveAttribute('type', 'password');
    expect(password).toHaveValue('secretpass');
  });

  it('shows inline validation and does not submit', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText('Correo electrónico'), 'no-es-correo');
    await user.type(screen.getByLabelText('Contraseña'), 'corta');
    await user.click(screen.getByRole('button', { name: 'Crear mi espacio' }));

    expect(screen.getByText('Contanos cómo querés que te llamemos.')).toBeInTheDocument();
    expect(screen.getByText('Ese correo no parece válido.')).toBeInTheDocument();
    expect(screen.getByText('Usá al menos 8 caracteres.')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('submits once, shows the creating state, and ignores a second click', async () => {
    const user = userEvent.setup();
    let resolveRegister: () => void = () => {};
    auth.register.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveRegister = resolve;
      }),
    );
    renderRegister();
    await fillValid(user);

    await user.click(screen.getByRole('button', { name: 'Crear mi espacio' }));
    const pending = screen.getByRole('button', { name: 'Creando tu espacio…' });
    expect(pending).toBeDisabled();
    expect(auth.register).toHaveBeenCalledTimes(1);
    expect(auth.register).toHaveBeenCalledWith({
      displayName: 'Ana',
      email: 'ana@example.com',
      password: 'secretpass',
    });

    await user.click(pending);
    expect(auth.register).toHaveBeenCalledTimes(1);
    resolveRegister();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Listo' })).toBeInTheDocument());
  });

  it('keeps the email and shows a calm message when register fails', async () => {
    const user = userEvent.setup();
    auth.register.mockRejectedValue(new Error('duplicate key 409'));
    renderRegister();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Crear mi espacio' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos crear la cuenta. Intentá de nuevo.');
    expect(screen.queryByText(/duplicate key|409/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('ana@example.com');
    expect(screen.getByRole('button', { name: 'Crear mi espacio' })).toBeEnabled();
  });

  it('fades into the feed after a successful register', async () => {
    const user = userEvent.setup();
    renderRegister();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Crear mi espacio' }));

    expect(await screen.findByText('Feed', {}, { timeout: 1500 })).toBeInTheDocument();
  });
});