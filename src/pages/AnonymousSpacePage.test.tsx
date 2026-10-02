import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post } from '../api/types';

const api = vi.hoisted(() => ({ getAnonymousFeed: vi.fn() }));
vi.mock('../api/posts', () => ({
  getAnonymousFeed: api.getAnonymousFeed,
  setPostResponse: vi.fn(),
  deletePostResponse: vi.fn(),
}));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { id: 'me' } }) }));

import AnonymousSpacePage from './AnonymousSpacePage';

function anonymousPost(id: string, content: string): Post {
  return {
    id,
    author: null,
    content,
    visibility: 'PUBLIC',
    createdAt: '2026-10-02T12:00:00Z',
    updatedAt: '2026-10-02T12:00:00Z',
    followedByCurrentUser: false,
    presenceCount: 0,
    listeningCount: 0,
    currentUserResponseType: null,
    anonymous: true,
  };
}

const page = (content: Post[], last: boolean, number = 0) => ({
  content,
  totalElements: content.length,
  totalPages: 2,
  number,
  size: 20,
  last,
});

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/anonimo']}>
      <Routes>
        <Route path="/anonimo" element={<AnonymousSpacePage />} />
        <Route path="/create" element={<p>Crear anónimo</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AnonymousSpacePage', () => {
  beforeEach(() => {
    api.getAnonymousFeed.mockReset();
  });

  it('lists anonymous posts and loads more', async () => {
    api.getAnonymousFeed
      .mockResolvedValueOnce(page([anonymousPost('a', 'primero')], false))
      .mockResolvedValueOnce(page([anonymousPost('b', 'segundo')], true, 1));
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('primero')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver más' }));
    expect(await screen.findByText('segundo')).toBeInTheDocument();
    expect(api.getAnonymousFeed).toHaveBeenLastCalledWith(1);
    expect(screen.queryByRole('button', { name: 'Ver más' })).not.toBeInTheDocument();
  });

  it('opens the composer in anonymous mode', async () => {
    api.getAnonymousFeed.mockResolvedValue(page([], true));
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText('Todavía está en calma por acá')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Compartir en anónimo' }));
    expect(screen.getByText('Crear anónimo')).toBeInTheDocument();
  });

  it('says it is not available yet when the backend has no endpoint', async () => {
    api.getAnonymousFeed.mockResolvedValue(null);
    renderPage();
    expect(await screen.findByText('El espacio anónimo todavía no está disponible')).toBeInTheDocument();
  });

  it('lets you retry after an error', async () => {
    api.getAnonymousFeed.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(page([anonymousPost('a', 'hola')], true));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: /Reintentar|Intentar de nuevo|Probar de nuevo/ }));
    expect(await screen.findByText('hola')).toBeInTheDocument();
  });
});
