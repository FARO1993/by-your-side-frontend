import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post, PostResponseSummary } from '../api/types';
import PostCard from './PostCard';

const api = vi.hoisted(() => ({
  setPostResponse: vi.fn(),
  deletePostResponse: vi.fn(),
}));

const auth = vi.hoisted(() => ({
  user: { id: 'me' } as { id: string } | null,
}));

vi.mock('../api/posts', () => ({
  setPostResponse: api.setPostResponse,
  deletePostResponse: api.deletePostResponse,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => auth,
}));

function summary(overrides: Partial<PostResponseSummary> = {}): PostResponseSummary {
  return {
    postId: 'post-1',
    type: 'WITH_YOU',
    presenceCount: 1,
    listeningCount: 0,
    ...overrides,
  };
}

function post(overrides: Partial<Post> = {}): Post {
  return {
    id: 'post-1',
    author: { id: 'author', username: 'ana', displayName: 'Ana', avatarUrl: null },
    content: 'Hoy necesito un rato de calma.',
    visibility: 'PUBLIC',
    createdAt: '2026-09-20T12:00:00.000Z',
    updatedAt: '2026-09-20T12:00:00.000Z',
    followedByCurrentUser: false,
    presenceCount: 0,
    listeningCount: 0,
    currentUserResponseType: null,
    ...overrides,
  };
}

function renderCard(value: Post = post()) {
  return render(
    <MemoryRouter>
      <PostCard post={value} />
    </MemoryRouter>,
  );
}

describe('PostCard responses', () => {
  beforeEach(() => {
    auth.user = { id: 'me' };
    api.setPostResponse.mockReset();
    api.deletePostResponse.mockReset();
  });

  it('starts without a response or counts', () => {
    renderCard();
    expect(screen.getByRole('button', { name: 'Estoy acá' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText(/Presencia/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Escucha/)).not.toBeInTheDocument();
    expect(screen.queryByText(/te acompañan/)).not.toBeInTheDocument();
  });

  it('selects WITH_YOU and shows the presence count', async () => {
    api.setPostResponse.mockResolvedValue(summary());
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('button', { name: 'Estoy acá' }));
    const presence = screen.getByRole('group', { name: 'Presencia' });
    expect(within(presence).getByRole('button', { name: 'Estoy con vos' })).toHaveAttribute('aria-pressed', 'false');
    await user.click(within(presence).getByRole('button', { name: 'Estoy con vos' }));

    expect(api.setPostResponse).toHaveBeenCalledWith('post-1', 'WITH_YOU');
    expect(screen.getByRole('button', { name: 'Estoy con vos', pressed: true })).toBeInTheDocument();
    expect(screen.getByText('Presencia 1')).toBeInTheDocument();
  });

  it('selects READING and shows the listening count', async () => {
    api.setPostResponse.mockResolvedValue(summary({ type: 'READING', presenceCount: 0, listeningCount: 2 }));
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('button', { name: 'Estoy acá' }));
    await user.click(within(screen.getByRole('group', { name: 'Escucha' })).getByRole('button', { name: 'Te leo' }));

    expect(api.setPostResponse).toHaveBeenCalledWith('post-1', 'READING');
    expect(screen.getByRole('button', { name: 'Te leo', pressed: true })).toBeInTheDocument();
    expect(screen.getByText('Escucha 2')).toBeInTheDocument();
  });

  it('shows the active response from the post', () => {
    renderCard(post({ currentUserResponseType: 'READING', listeningCount: 3, presenceCount: 1 }));
    expect(screen.getByRole('button', { name: 'Te leo', pressed: true })).toBeInTheDocument();
    expect(screen.getByText('Presencia 1')).toBeInTheDocument();
    expect(screen.getByText('Escucha 3')).toBeInTheDocument();
  });

  it('replaces WITH_YOU with HUG without changing family counts', async () => {
    api.setPostResponse.mockResolvedValue(summary({ type: 'HUG', presenceCount: 4, listeningCount: 2 }));
    const user = userEvent.setup();
    renderCard(post({ currentUserResponseType: 'WITH_YOU', presenceCount: 4, listeningCount: 2 }));

    await user.click(screen.getByRole('button', { name: 'Estoy con vos' }));
    await user.click(within(screen.getByRole('group', { name: 'Presencia' })).getByRole('button', { name: 'Te abrazo' }));

    expect(api.setPostResponse).toHaveBeenCalledWith('post-1', 'HUG');
    expect(screen.getByRole('button', { name: 'Te abrazo', pressed: true })).toBeInTheDocument();
    expect(screen.getByText('Presencia 4')).toBeInTheDocument();
    expect(screen.getByText('Escucha 2')).toBeInTheDocument();
  });

  it('moves WITH_YOU to LISTENING and updates both counts', async () => {
    api.setPostResponse.mockResolvedValue(summary({ type: 'LISTENING', presenceCount: 1, listeningCount: 2 }));
    const user = userEvent.setup();
    renderCard(post({ currentUserResponseType: 'WITH_YOU', presenceCount: 2, listeningCount: 1 }));

    await user.click(screen.getByRole('button', { name: 'Estoy con vos' }));
    await user.click(within(screen.getByRole('group', { name: 'Escucha' })).getByRole('button', { name: 'Estoy escuchando' }));

    expect(screen.getByText('Presencia 1')).toBeInTheDocument();
    expect(screen.getByText('Escucha 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Estoy escuchando', pressed: true })).toBeInTheDocument();
  });

  it('removes the active response when it is chosen again', async () => {
    api.deletePostResponse.mockResolvedValue(summary({ type: null, presenceCount: 1, listeningCount: 0 }));
    const user = userEvent.setup();
    renderCard(post({ currentUserResponseType: 'WITH_YOU', presenceCount: 2, listeningCount: 0 }));

    await user.click(screen.getByRole('button', { name: 'Estoy con vos' }));
    await user.click(within(screen.getByRole('group', { name: 'Presencia' })).getByRole('button', { name: 'Estoy con vos' }));

    expect(api.deletePostResponse).toHaveBeenCalledWith('post-1');
    expect(screen.getByRole('button', { name: 'Estoy acá', pressed: false })).toBeInTheDocument();
    expect(screen.getByText('Presencia 1')).toBeInTheDocument();
  });

  it('rolls back when saving fails', async () => {
    const error = new AxiosError('fail');
    error.response = { status: 500, data: {}, statusText: 'Error', headers: {}, config: {} as never };
    api.setPostResponse.mockRejectedValue(error);
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('button', { name: 'Estoy acá' }));
    await user.click(within(screen.getByRole('group', { name: 'Presencia' })).getByRole('button', { name: 'Estoy con vos' }));

    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos guardar tu respuesta.');
    expect(screen.getByRole('button', { name: 'Estoy acá', pressed: false })).toBeInTheDocument();
    expect(screen.queryByText('Presencia 1')).not.toBeInTheDocument();
  });

  it('closes the options with Escape', async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('button', { name: 'Estoy acá' }));
    expect(screen.getByRole('group', { name: 'Presencia' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('group', { name: 'Presencia' })).not.toBeInTheDocument();
  });

  it('does not offer a response on the author own post', () => {
    auth.user = { id: 'author' };
    renderCard(post({ presenceCount: 2, listeningCount: 1 }));
    expect(screen.queryByRole('button', { name: 'Estoy acá' })).not.toBeInTheDocument();
    expect(screen.getByText('Presencia 2')).toBeInTheDocument();
    expect(screen.getByText('Escucha 1')).toBeInTheDocument();
  });
});

describe('PostCard response errors stay non-destructive', () => {
  beforeEach(() => {
    auth.user = { id: 'me' };
    api.setPostResponse.mockReset();
  });

  it('keeps the previous response after a 400', async () => {
    const error = new AxiosError('bad');
    error.response = { status: 400, data: {}, statusText: 'Bad Request', headers: {}, config: {} as never };
    api.setPostResponse.mockRejectedValue(error);
    const user = userEvent.setup();
    renderCard(post({ currentUserResponseType: 'HUG', presenceCount: 3, listeningCount: 0 }));

    await user.click(screen.getByRole('button', { name: 'Te abrazo' }));
    await user.click(within(screen.getByRole('group', { name: 'Escucha' })).getByRole('button', { name: 'Te leo' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Esa respuesta no se pudo guardar.');
    expect(screen.getByRole('button', { name: 'Te abrazo', pressed: true })).toBeInTheDocument();
    expect(screen.getByText('Presencia 3')).toBeInTheDocument();
    expect(screen.queryByText(/Escucha/)).not.toBeInTheDocument();
  });
});

describe('PostCard without responses', () => {
  it('never shows zero counts, and reassures on my own post', () => {
    auth.user = { id: 'author' };
    renderCard(post());
    expect(screen.getByText('Tu mensaje está acá. Las respuestas llegan a su tiempo.')).toBeInTheDocument();
    expect(screen.queryByText(/\b0\b/)).not.toBeInTheDocument();
    auth.user = { id: 'me' };
  });

  it('shows nothing about responses on someone else’s post without responses', () => {
    auth.user = { id: 'me' };
    renderCard(post());
    expect(screen.queryByText(/Las respuestas llegan/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Presencia|Escucha \d/)).not.toBeInTheDocument();
  });
});
