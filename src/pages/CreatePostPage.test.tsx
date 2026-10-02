import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreatePostRequest } from '../api/types';

const api = vi.hoisted(() => ({
  createPost: vi.fn(),
  setStatus: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'me', username: 'ana', displayName: 'Ana', avatarUrl: null } }),
}));

vi.mock('../api/posts', () => ({
  createPost: api.createPost,
}));

vi.mock('../api/statuses', () => ({
  setStatus: api.setStatus,
}));

import CreatePostPage from './CreatePostPage';

describe('post visibility', () => {
  beforeEach(() => {
    api.createPost.mockReset();
    api.setStatus.mockReset();
    api.createPost.mockResolvedValue({ id: 'post-1' });
  });

  it.each([
    ['Público', 'PUBLIC'],
    ['Solo seguidores', 'FOLLOWERS_ONLY'],
    ['Solo yo', 'PRIVATE'],
  ] as const)('sends %s as %s', async (label, visibility: CreatePostRequest['visibility']) => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreatePostPage />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: label }));
    await user.type(screen.getByPlaceholderText('¿Qué querés compartir hoy? No hace falta que esté perfecto.'), 'hola');
    await user.click(screen.getByRole('button', { name: 'Compartir' }));
    expect(api.createPost).toHaveBeenCalledWith({ content: 'hola', visibility, contentWarning: false, anonymous: false });
  });
});

describe('content warning', () => {
  beforeEach(() => {
    api.createPost.mockReset().mockResolvedValue({ id: 'post-1' });
  });

  function renderPage() {
    render(
      <MemoryRouter>
        <CreatePostPage />
      </MemoryRouter>,
    );
  }

  it('sends contentWarning when the post is marked as sensitive', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText('¿Qué querés compartir hoy? No hace falta que esté perfecto.'), 'hoy fue pesado');
    await user.click(screen.getByRole('checkbox', { name: 'Contenido sensible' }));
    await user.click(screen.getByRole('button', { name: 'Compartir' }));
    expect(api.createPost).toHaveBeenCalledWith({ content: 'hoy fue pesado', visibility: 'PUBLIC', contentWarning: true, anonymous: false });
  });

  it('suggests marking it when the text has crisis signals, without checking it for you', async () => {
    const user = userEvent.setup();
    renderPage();
    const checkbox = screen.getByRole('checkbox', { name: 'Contenido sensible' });
    expect(checkbox).toHaveAccessibleDescription(/Quién puede verlo no cambia/);

    await user.type(screen.getByPlaceholderText('¿Qué querés compartir hoy? No hace falta que esté perfecto.'), 'ya no quiero vivir');
    expect(checkbox).toHaveAccessibleDescription(/puede ser difícil de leer para alguien/);
    expect(checkbox).not.toBeChecked();
  });
});

describe('anonymous posting', () => {
  beforeEach(() => {
    api.createPost.mockReset().mockResolvedValue({ id: 'post-1' });
    api.setStatus.mockReset();
  });

  function renderPage(path = '/create') {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/create" element={<CreatePostPage />} />
          <Route path="/anonimo" element={<p>Espacio anónimo</p>} />
          <Route path="/feed" element={<p>Feed</p>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  const placeholder = '¿Qué querés compartir hoy? No hace falta que esté perfecto.';

  it('publishes as public and anonymous, hides mood and audience, and goes to the anonymous space', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Solo yo' }));
    await user.click(screen.getByRole('checkbox', { name: 'Publicar en anónimo' }));

    expect(screen.getByText('Alguien de la comunidad')).toBeInTheDocument();
    expect(screen.queryByText('¿Cómo estás hoy? (opcional)')).not.toBeInTheDocument();
    expect(screen.queryByText('¿Quién puede verlo?')).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(placeholder), 'algo que no firmo');
    await user.click(screen.getByRole('button', { name: 'Compartir' }));

    expect(api.createPost).toHaveBeenCalledWith({
      content: 'algo que no firmo',
      visibility: 'PUBLIC',
      contentWarning: false,
      anonymous: true,
    });
    expect(api.setStatus).not.toHaveBeenCalled();
    expect(await screen.findByText('Espacio anónimo')).toBeInTheDocument();
  });

  it('never publishes a named mood together with an anonymous post', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Día difícil' }));
    await user.click(screen.getByRole('checkbox', { name: 'Publicar en anónimo' }));
    await user.type(screen.getByPlaceholderText(placeholder), 'hola');
    await user.click(screen.getByRole('button', { name: 'Compartir' }));
    expect(api.setStatus).not.toHaveBeenCalled();
  });

  it('starts in anonymous mode from the anonymous space link', () => {
    renderPage('/create?anonimo=1');
    expect(screen.getByRole('checkbox', { name: 'Publicar en anónimo' })).toBeChecked();
  });

  it('explains the daily limit and keeps the text', async () => {
    const limit = new AxiosError('limit');
    limit.response = { status: 429, data: {}, statusText: '', headers: {}, config: {} as never };
    api.createPost.mockRejectedValue(limit);
    const user = userEvent.setup();
    renderPage('/create?anonimo=1');
    await user.type(screen.getByPlaceholderText(placeholder), 'cuarto del día');
    await user.click(screen.getByRole('button', { name: 'Compartir' }));
    expect(await screen.findByText(/Ya compartiste 3 veces en anónimo/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(placeholder)).toHaveValue('cuarto del día');
  });
});
