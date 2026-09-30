import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post, PublicUserProfile, Status, User } from '../api/types';

const api = vi.hoisted(() => ({
  getPublicProfile: vi.fn(),
  getUserPosts: vi.fn(),
  uploadAvatar: vi.fn(),
  getStatusFeed: vi.fn(),
  getPublicAvailability: vi.fn(),
  getCompanionPreferences: vi.fn(),
  replaceCompanionPreferences: vi.fn(),
  getOrCreateConversation: vi.fn(),
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
}));

const auth = vi.hoisted(() => ({
  current: {
    user: null as User | null,
    logout: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => auth.current,
}));

vi.mock('../api/users', () => ({
  getPublicProfile: api.getPublicProfile,
  getUserPosts: api.getUserPosts,
  uploadAvatar: api.uploadAvatar,
  getPublicAvailability: api.getPublicAvailability,
  getCompanionPreferences: api.getCompanionPreferences,
  replaceCompanionPreferences: api.replaceCompanionPreferences,
}));

vi.mock('../api/statuses', () => ({
  getStatusFeed: api.getStatusFeed,
}));

vi.mock('../api/chat', () => ({
  getOrCreateConversation: api.getOrCreateConversation,
}));

vi.mock('../api/follows', () => ({
  followUser: api.followUser,
  unfollowUser: api.unfollowUser,
}));

import ProfilePage from './ProfilePage';

function account(id: string): User {
  return {
    id,
    username: 'ana',
    email: 'ana@example.com',
    displayName: 'Ana',
    bio: null,
    avatarUrl: null,
    role: 'USER',
    createdAt: '2026-09-15T12:00:00.000Z',
    emailVerified: true,
    emailVerifiedAt: '2026-09-15T12:00:00.000Z',
  };
}

function profile(overrides: Partial<PublicUserProfile> = {}): PublicUserProfile {
  return {
    id: 'me',
    username: 'ana',
    displayName: 'Ana',
    bio: 'Me gusta escuchar.',
    avatarUrl: null,
    createdAt: '2026-09-15T12:00:00.000Z',
    followersCount: 4,
    followingCount: 1,
    followedByCurrentUser: false,
    companionPreferences: null,
    ...overrides,
  };
}

function status(userId: string, mood: Status['mood']): Status {
  return {
    id: 'status-1',
    user: { id: userId, username: 'ana', displayName: 'Ana', avatarUrl: null },
    mood,
    createdAt: '2026-09-20T12:00:00.000Z',
    expiresAt: '2026-09-21T12:00:00.000Z',
    reactionCount: 0,
    reactedByCurrentUser: null,
  };
}

function post(authorId: string): Post {
  return {
    id: 'post-1',
    author: { id: authorId, username: 'ana', displayName: 'Ana', avatarUrl: null },
    content: 'Hoy necesito un rato de calma.',
    visibility: 'PUBLIC',
    createdAt: '2026-09-20T12:00:00.000Z',
    updatedAt: '2026-09-20T12:00:00.000Z',
    followedByCurrentUser: false,
    presenceCount: 0,
    listeningCount: 0,
    currentUserResponseType: null,
  };
}

function renderProfile(path = '/profile/me') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/login" element={<p>Login</p>} />
        <Route path="/feed" element={<p>Feed</p>} />
        <Route path="/messages/:conversationId" element={<p>Chat</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProfilePage', () => {
  beforeEach(() => {
    auth.current.user = account('me');
    auth.current.logout = vi.fn();
    api.getPublicProfile.mockReset();
    api.getUserPosts.mockReset();
    api.getStatusFeed.mockReset();
    api.getPublicAvailability.mockReset();
    api.getCompanionPreferences.mockReset();
    api.replaceCompanionPreferences.mockReset();
    api.getOrCreateConversation.mockReset();
    api.followUser.mockReset();
    api.unfollowUser.mockReset();
    api.getUserPosts.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 20,
      last: true,
    });
    api.getStatusFeed.mockResolvedValue([]);
    api.getPublicAvailability.mockResolvedValue({ kind: 'none' });
    api.getCompanionPreferences.mockResolvedValue([]);
    api.getPublicProfile.mockResolvedValue(profile());
  });

  it('renders own identity from the server, mood, bio and quiet metrics', async () => {
    api.getStatusFeed.mockResolvedValue([status('me', 'NEED_DISTRACTION')]);
    localStorage.setItem(
      'bys.profileOverlay.me',
      JSON.stringify({ displayName: 'Nombre local', bio: 'Bio local', receivedPresence: 8 }),
    );

    renderProfile();

    expect(await screen.findByRole('heading', { name: 'Ana' })).toBeInTheDocument();
    expect(screen.getByText('@ana')).toBeInTheDocument();
    expect(screen.getByText('Necesito distraerme')).toBeInTheDocument();
    expect(screen.getByText('Me gusta escuchar.')).toBeInTheDocument();
    expect(screen.queryByText('Nombre local')).not.toBeInTheDocument();
    expect(screen.queryByText('Bio local')).not.toBeInTheDocument();
    expect(screen.getByText(/Se unió/)).toBeInTheDocument();
    const metrics = screen.getByText(/te acompañan/).closest('p');
    expect(metrics).toHaveTextContent('4 te acompañan · 1 acompañás');
    expect(metrics).not.toHaveTextContent('8');
    expect(metrics).not.toHaveTextContent(/presencia recibida/i);
    expect(screen.getByRole('tab', { name: 'Publicaciones' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Presencia recibida' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cambiar contraseña' })).toHaveAttribute('href', '/account/password');
    expect(screen.getByRole('button', { name: 'Editar perfil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cambiar foto de perfil' })).toBeInTheDocument();
  });

  it('does not invent a bio or a mood', async () => {
    api.getPublicProfile.mockResolvedValue(profile({ bio: '   ', displayName: null }));

    renderProfile();

    expect(await screen.findByRole('heading', { name: 'ana' })).toBeInTheDocument();
    expect(screen.getByText('Sin estado reciente')).toBeInTheDocument();
    expect(screen.queryByText(/todavía no agregó una bio/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Me gusta escuchar.')).not.toBeInTheDocument();
  });

  it('shows public availability when the profile has an active offering', async () => {
    api.getPublicAvailability.mockResolvedValue({
      kind: 'available',
      value: { available: true, offeringType: 'TALK', expiresAt: '2026-09-20T18:00:00.000Z' },
    });
    renderProfile();

    expect(await screen.findByText('Disponible ahora')).toBeInTheDocument();
    expect(screen.getByText('Puede conversar')).toBeInTheDocument();
    expect(screen.queryByText('Hablar')).not.toBeInTheDocument();
  });

  it('omits availability when the public record is empty', async () => {
    renderProfile();

    expect(await screen.findByRole('heading', { name: 'Ana' })).toBeInTheDocument();
    await waitFor(() => expect(api.getPublicAvailability).toHaveBeenCalledWith('me'));
    expect(screen.queryByText('Disponible ahora')).not.toBeInTheDocument();
  });

  it('omits availability when the public lookup is hidden', async () => {
    api.getPublicAvailability.mockResolvedValue({ kind: 'hidden' });
    renderProfile();

    expect(await screen.findByRole('heading', { name: 'Ana' })).toBeInTheDocument();
    await waitFor(() => expect(api.getPublicAvailability).toHaveBeenCalled());
    expect(screen.queryByText('Disponible ahora')).not.toBeInTheDocument();
  });

  it('keeps publications and received presence as tabs without a fake count', async () => {
    renderProfile();

    expect(await screen.findByText('Todavía no publicaste nada')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Presencia recibida' }));
    expect(screen.getByRole('heading', { name: 'La presencia que te dejaron vive acá' })).toBeInTheDocument();
    expect(
      screen.getByText('Cada vez que alguien esté de tu lado o te ofrezca escucha, vas a poder verlo en este espacio.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver al inicio' })).toBeInTheDocument();
    expect(screen.queryByText(/^8$/)).not.toBeInTheDocument();
  });

  it('logs out from the account section', async () => {
    renderProfile();
    await screen.findByRole('heading', { name: 'Ana' });
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(auth.current.logout).toHaveBeenCalled();
    expect(await screen.findByText('Login')).toBeInTheDocument();
  });

  it('shows follow and messages for someone else, without their availability', async () => {
    auth.current.user = account('me');
    api.getPublicProfile.mockResolvedValue(
      profile({
        id: 'other',
        username: 'luz',
        displayName: 'Luz',
        bio: 'Acá cuando puedo.',
        followedByCurrentUser: false,
        followersCount: 2,
        followingCount: 3,
      }),
    );
    api.getStatusFeed.mockResolvedValue([status('other', 'HERE_FOR_SOMEONE')]);

    renderProfile('/profile/other');

    expect(await screen.findByRole('heading', { name: 'Luz' })).toBeInTheDocument();
    expect(screen.getByText('@luz')).toBeInTheDocument();
    expect(screen.getByText('Estoy acá para alguien')).toBeInTheDocument();
    expect(screen.getByText('Acá cuando puedo.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acompañar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acompañando' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mensajes' })).toBeInTheDocument();
    expect(screen.queryByText('Disponible ahora')).not.toBeInTheDocument();
    await waitFor(() => expect(api.getPublicAvailability).toHaveBeenCalledWith('other'));
    expect(screen.queryByRole('heading', { name: 'Cómo suele estar para otros' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Cambiar contraseña' })).not.toBeInTheDocument();
    expect(screen.getByText('Esta persona no tiene publicaciones visibles')).toBeInTheDocument();
    expect(screen.getByText(/te acompañan/).closest('p')).toHaveTextContent('2 te acompañan · 3 acompañás');
  });

  it('labels an existing follow as Acompañando and can unfollow', async () => {
    api.getPublicProfile.mockResolvedValue(
      profile({ id: 'other', displayName: 'Luz', username: 'luz', followedByCurrentUser: true, bio: null }),
    );
    api.unfollowUser.mockResolvedValue(undefined);

    renderProfile('/profile/other');

    const following = await screen.findByRole('button', { name: 'Acompañando' });
    expect(following).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: 'Acompañás' })).not.toBeInTheDocument();
    await userEvent.click(following);
    expect(api.unfollowUser).toHaveBeenCalledWith('other');
    expect(await screen.findByRole('button', { name: 'Acompañar' })).toBeInTheDocument();
  });

  it('opens the existing conversation from Mensajes', async () => {
    api.getPublicProfile.mockResolvedValue(profile({ id: 'other', displayName: 'Luz', username: 'luz' }));
    api.getOrCreateConversation.mockResolvedValue({ id: 'conversation-1' });

    renderProfile('/profile/other');
    await userEvent.click(await screen.findByRole('button', { name: 'Mensajes' }));
    expect(api.getOrCreateConversation).toHaveBeenCalledWith('other');
    expect(await screen.findByText('Chat')).toBeInTheDocument();
  });

  it('renders a visible post without replacing the empty presence tab', async () => {
    api.getUserPosts.mockResolvedValue({
      content: [post('me')],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
      last: true,
    });

    renderProfile();

    expect(await screen.findByText('Hoy necesito un rato de calma.')).toBeInTheDocument();
    expect(screen.queryByText('Todavía no publicaste nada')).not.toBeInTheDocument();
  });

  it('shows availability on a private profile when the public lookup returns an offering', async () => {
    api.getPublicProfile.mockResolvedValue(
      profile({
        id: 'other',
        username: 'luz',
        displayName: 'Luz',
        bio: null,
        companionPreferences: null,
      }),
    );
    api.getPublicAvailability.mockResolvedValue({
      kind: 'available',
      value: { available: true, offeringType: 'LISTEN', expiresAt: '2026-09-20T18:00:00.000Z' },
    });

    renderProfile('/profile/other');

    expect(await screen.findByText('Disponible ahora')).toBeInTheDocument();
    expect(screen.getByText('Puede escuchar')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Cómo suele estar para otros' })).not.toBeInTheDocument();
  });

  it('shows companion preference chips only when the profile includes them', async () => {
    api.getPublicProfile.mockResolvedValue(
      profile({
        id: 'other',
        username: 'luz',
        displayName: 'Luz',
        companionPreferences: ['DISTRACT', 'LISTEN'],
      }),
    );

    renderProfile('/profile/other');

    expect(await screen.findByRole('heading', { name: 'Cómo suele estar para otros' })).toBeInTheDocument();
    expect(screen.getByText('Escuchar')).toBeInTheDocument();
    expect(screen.getByText('Distraernos')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Cómo suelo estar para otros' })).not.toBeInTheDocument();
  });

  it('does not render an empty companion preference section', async () => {
    api.getPublicProfile.mockResolvedValue(profile({ id: 'other', displayName: 'Luz', username: 'luz', companionPreferences: [] }));

    renderProfile('/profile/other');

    expect(await screen.findByRole('heading', { name: 'Luz' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Cómo suele estar para otros' })).not.toBeInTheDocument();
  });

  it('saves the full companion preference set without activating availability', async () => {
    api.getCompanionPreferences.mockResolvedValue(['LISTEN']);
    api.replaceCompanionPreferences.mockResolvedValue(['LISTEN', 'TALK']);

    renderProfile();

    const listen = await screen.findByRole('button', { name: 'Escuchar' });
    await waitFor(() => expect(listen).toHaveAttribute('aria-pressed', 'true'));
    await userEvent.click(screen.getByRole('button', { name: 'Conversar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(api.replaceCompanionPreferences).toHaveBeenCalledWith(['LISTEN', 'TALK']));
    expect(await screen.findByText('Guardado.')).toBeInTheDocument();
  });

  it('keeps the current preferences when saving fails', async () => {
    api.getCompanionPreferences.mockResolvedValue(['LISTEN']);
    api.replaceCompanionPreferences.mockRejectedValue(new Error('no'));

    renderProfile();

    await userEvent.click(await screen.findByRole('button', { name: 'Conversar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos guardar cómo solés estar.');
    expect(screen.getByRole('button', { name: 'Escuchar' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Conversar' })).toHaveAttribute('aria-pressed', 'false');
  });
});
