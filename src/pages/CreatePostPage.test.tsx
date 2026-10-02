import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
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
    expect(api.createPost).toHaveBeenCalledWith({ content: 'hola', visibility, contentWarning: false });
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
    expect(api.createPost).toHaveBeenCalledWith({ content: 'hoy fue pesado', visibility: 'PUBLIC', contentWarning: true });
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
