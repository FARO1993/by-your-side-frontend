import { AxiosError } from 'axios';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post, PublicUserProfile, Status, User } from '../api/types';

const api = vi.hoisted(() => ({
  getPublicProfile: vi.fn(),
  getUserPosts: vi.fn(),
  setAvatar: vi.fn(),
  getUserStatus: vi.fn(),
  updateProfile: vi.fn(),
  getPublicAvailability: vi.fn(),
  getCompanionPreferences: vi.fn(),
  replaceCompanionPreferences: vi.fn(),
  getOrCreateConversation: vi.fn(),
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
  getFollowers: vi.fn(),
  removeFollower: vi.fn(),
  listIncomingFollowRequests: vi.fn(),
  listOutgoingFollowRequests: vi.fn(),
  acceptFollowRequest: vi.fn(),
  rejectFollowRequest: vi.fn(),
  cancelFollowRequest: vi.fn(),
  blockUser: vi.fn(),
  unblockUser: vi.fn(),
  muteUser: vi.fn(),
  unmuteUser: vi.fn(),
}));

const auth = vi.hoisted(() => ({
  current: {
    user: null as User | null,
    logout: vi.fn(),
    reloadUser: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => auth.current,
}));

vi.mock('../api/users', () => ({
  getPublicProfile: api.getPublicProfile,
  getUserPosts: api.getUserPosts,
  setAvatar: api.setAvatar,
  updateProfile: api.updateProfile,
  getPublicAvailability: api.getPublicAvailability,
  getCompanionPreferences: api.getCompanionPreferences,
  replaceCompanionPreferences: api.replaceCompanionPreferences,
}));

vi.mock('../api/statuses', () => ({
  getUserStatus: api.getUserStatus,
  // Historial de ánimo propio: en estos tests no importa; null = endpoint ausente.
  getMyMoodHistory: () => Promise.resolve(null),
}));

vi.mock('../api/chat', () => ({
  getOrCreateConversation: api.getOrCreateConversation,
}));

vi.mock('../api/follows', () => ({
  followUser: api.followUser,
  unfollowUser: api.unfollowUser,
  getFollowers: api.getFollowers,
  removeFollower: api.removeFollower,
}));

vi.mock('../api/followRequests', () => ({
  listIncomingFollowRequests: api.listIncomingFollowRequests,
  listOutgoingFollowRequests: api.listOutgoingFollowRequests,
  acceptFollowRequest: api.acceptFollowRequest,
  rejectFollowRequest: api.rejectFollowRequest,
  cancelFollowRequest: api.cancelFollowRequest,
}));

vi.mock('../api/blocks', () => ({
  blockUser: api.blockUser,
  unblockUser: api.unblockUser,
}));

vi.mock('../api/mutes', () => ({
  muteUser: api.muteUser,
  unmuteUser: api.unmuteUser,
}));

import ProfilePage from './ProfilePage';

function account(id: string): User {
  return {
    id,
    username: 'ana',
    email: 'ana@example.com',
    displayName: 'Ana',
    bio: null,
    avatarId: null,
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
    avatarId: null,
    createdAt: '2026-09-15T12:00:00.000Z',
    followersCount: 4,
    followingCount: 1,
    followedByCurrentUser: false,
    companionPreferences: null,
    profileVisibility: 'PUBLIC',
    followState: 'NONE',
    blockedByCurrentUser: false,
    mutedByCurrentUser: false,
    ...overrides,
  };
}

function status(userId: string, mood: Status['mood']): Status {
  return {
    id: 'status-1',
    user: { id: userId, username: 'ana', displayName: 'Ana', avatarId: null },
    mood,
    createdAt: '2026-09-20T12:00:00.000Z',
    expiresAt: '2026-09-21T12:00:00.000Z',
    reactionCount: 0,
    reactedByCurrentUser: null,
  };
}

function incoming() {
  return {
    requestId: 'req-1',
    otherUser: { id: 'luz', username: 'luz', displayName: 'Luz', avatarId: null },
    createdAt: '2026-09-20T12:00:00.000Z',
    status: 'PENDING' as const,
  };
}

function post(authorId: string): Post {
  return {
    id: 'post-1',
    author: { id: authorId, username: 'ana', displayName: 'Ana', avatarId: null },
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

function InviteProbe() {
  return <p>Invitar a jugar {useLocation().search}</p>;
}

function renderProfile(path = '/profile/me') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/login" element={<p>Login</p>} />
        <Route path="/feed" element={<p>Feed</p>} />
        <Route path="/messages/:conversationId" element={<p>Chat</p>} />
        <Route path="/distraerme/invitar" element={<InviteProbe />} />
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
    api.getUserStatus.mockReset();
    api.updateProfile.mockReset();
    api.getPublicAvailability.mockReset();
    api.getCompanionPreferences.mockReset();
    api.replaceCompanionPreferences.mockReset();
    api.getOrCreateConversation.mockReset();
    api.followUser.mockReset();
    api.unfollowUser.mockReset();
    api.getFollowers.mockReset();
    api.removeFollower.mockReset();
    api.listIncomingFollowRequests.mockReset();
    api.listOutgoingFollowRequests.mockReset();
    api.acceptFollowRequest.mockReset();
    api.rejectFollowRequest.mockReset();
    api.cancelFollowRequest.mockReset();
    api.blockUser.mockReset();
    api.unblockUser.mockReset();
    api.muteUser.mockReset();
    api.unmuteUser.mockReset();
    api.getFollowers.mockResolvedValue([]);
    api.listIncomingFollowRequests.mockResolvedValue([]);
    api.listOutgoingFollowRequests.mockResolvedValue([]);
    api.getUserPosts.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 20,
      last: true,
    });
    api.getUserStatus.mockResolvedValue({ kind: 'none' });
    api.getPublicAvailability.mockResolvedValue({ kind: 'none' });
    api.getCompanionPreferences.mockResolvedValue([]);
    api.getPublicProfile.mockResolvedValue(profile());
  });

  it('renders own identity from the server, mood, bio and quiet metrics', async () => {
    api.getUserStatus.mockResolvedValue({ kind: 'active', status: status('me', 'NEED_DISTRACTION') });
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
    expect(screen.getByRole('button', { name: 'Cambiar avatar' })).toBeInTheDocument();
  });

  it('lets me pick an illustrated avatar instead of uploading a photo', async () => {
    auth.current.reloadUser = vi.fn().mockResolvedValue(undefined);
    api.setAvatar.mockResolvedValue({ ...account('me'), avatarId: 'luna' });
    const user = userEvent.setup();
    renderProfile();

    await user.click(await screen.findByRole('button', { name: 'Cambiar avatar' }));
    const dialog = screen.getByRole('dialog', { name: 'Elegí tu avatar' });
    expect(document.querySelector('input[type="file"]')).toBeNull();
    await user.click(within(dialog).getByRole('radio', { name: 'Luna' }));
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(api.setAvatar).toHaveBeenCalledWith('luna');
    expect(auth.current.reloadUser).toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Elegí tu avatar' })).not.toBeInTheDocument();
  });

  it('does not invent a bio or a mood', async () => {
    api.getPublicProfile.mockResolvedValue(profile({ bio: '   ', displayName: null }));

    renderProfile();

    expect(await screen.findByRole('heading', { name: 'ana' })).toBeInTheDocument();
    expect(screen.queryByText('Sin estado reciente')).not.toBeInTheDocument();
    expect(screen.queryByText(/no tiene estado/i)).not.toBeInTheDocument();
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

  it('does not show zero relationship counts', async () => {
    api.getPublicProfile.mockResolvedValue(profile({ followersCount: 0, followingCount: 2 }));
    renderProfile();
    const metrics = (await screen.findByText(/acompañás/)).closest('p');
    expect(metrics).toHaveTextContent('2 acompañás');
    expect(metrics).not.toHaveTextContent('te acompañan');
  });

  it('shows a gentle line instead of 0 · 0 on my own profile', async () => {
    api.getPublicProfile.mockResolvedValue(profile({ followersCount: 0, followingCount: 0 }));
    renderProfile();
    expect(await screen.findByText('Tu red se arma de a poco, a tu ritmo.')).toBeInTheDocument();
    expect(screen.queryByText(/te acompañan/)).not.toBeInTheDocument();
  });

  it('keeps publications and received presence as tabs without a fake count', async () => {
    renderProfile();

    expect(await screen.findByText('Todavía no compartiste nada')).toBeInTheDocument();
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
    api.getUserStatus.mockResolvedValue({ kind: 'active', status: status('other', 'HERE_FOR_SOMEONE') });

    renderProfile('/profile/other');

    expect(await screen.findByRole('heading', { name: 'Luz' })).toBeInTheDocument();
    expect(screen.getByText('@luz')).toBeInTheDocument();
    expect(screen.getByText('Estoy acá para alguien')).toBeInTheDocument();
    expect(screen.getByText('Acá cuando puedo.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acompañar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acompañando' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mensajes' })).toBeInTheDocument();
    // Sin un vínculo todavía no se ofrece invitar a jugar.
    expect(screen.queryByRole('button', { name: 'Invitar a Luz a jugar' })).not.toBeInTheDocument();
    expect(screen.queryByText('Disponible ahora')).not.toBeInTheDocument();
    await waitFor(() => expect(api.getPublicAvailability).toHaveBeenCalledWith('other'));
    expect(screen.queryByRole('heading', { name: 'Cómo suele estar para otros' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Cambiar contraseña' })).not.toBeInTheDocument();
    expect(screen.getByText('Todavía no hay publicaciones para ver acá')).toBeInTheDocument();
    // En perfiles ajenos no se muestran números de relaciones (evita comparaciones).
    expect(screen.queryByText(/te acompañan/)).not.toBeInTheDocument();
    expect(screen.queryByText(/acompañás/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tu red se arma/)).not.toBeInTheDocument();
  });

  it('labels an existing follow as Acompañando and can unfollow', async () => {
    api.getPublicProfile.mockResolvedValue(
      profile({ id: 'other', displayName: 'Luz', username: 'luz', followedByCurrentUser: true, followState: 'FOLLOWING', bio: null }),
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

  it('invites someone you follow to play together', async () => {
    api.getPublicProfile.mockResolvedValue(
      profile({ id: 'other', displayName: 'Luz', username: 'luz', followedByCurrentUser: true, followState: 'FOLLOWING' }),
    );
    renderProfile('/profile/other');
    await userEvent.click(await screen.findByRole('button', { name: 'Invitar a Luz a jugar' }));
    expect(await screen.findByText('Invitar a jugar ?con=other')).toBeInTheDocument();
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
    expect(screen.queryByText('Todavía no compartiste nada')).not.toBeInTheDocument();
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

  it('reloads the current status instead of keeping the previous one', async () => {
    api.getUserStatus.mockResolvedValue({ kind: 'active', status: status('me', 'NEED_DISTRACTION') });
    const view = renderProfile();
    expect(await screen.findByText('Necesito distraerme')).toBeInTheDocument();
    view.unmount();

    api.getUserStatus.mockResolvedValue({ kind: 'none' });
    renderProfile();
    expect(await screen.findByRole('heading', { name: 'Ana' })).toBeInTheDocument();
    expect(screen.queryByText('Necesito distraerme')).not.toBeInTheDocument();
    expect(api.getUserStatus).toHaveBeenCalledTimes(2);
    expect(api.getUserStatus).toHaveBeenCalledWith('me');
  });

  it('hides the status when the endpoint says it is inaccessible', async () => {
    api.getUserStatus.mockResolvedValue({ kind: 'hidden' });
    renderProfile('/profile/other');

    expect(await screen.findByRole('heading', { name: 'Ana' })).toBeInTheDocument();
    expect(screen.queryByText('Sin estado reciente')).not.toBeInTheDocument();
    expect(screen.queryByText(/no tiene estado/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Necesito distraerme')).not.toBeInTheDocument();
  });

  it('shows a private profile status only when the status endpoint returns it', async () => {
    api.getPublicProfile.mockResolvedValue(profile({ id: 'other', username: 'luz', displayName: 'Luz', bio: null }));
    api.getUserStatus.mockResolvedValue({ kind: 'active', status: status('other', 'WELL') });

    renderProfile('/profile/other');

    expect(await screen.findByText('Estoy bien')).toBeInTheDocument();
    expect(api.getUserStatus).toHaveBeenCalledWith('other');
  });

  it('shows the profile error when the profile itself cannot be loaded', async () => {
    api.getPublicProfile.mockRejectedValue(new Error('missing'));
    renderProfile();

    expect(await screen.findByText('No pudimos abrir este perfil. Probá de nuevo en un rato.')).toBeInTheDocument();
    expect(screen.queryByText(/no tiene estado/i)).not.toBeInTheDocument();
  });

  it('trims the display name and keeps internal spaces', async () => {
    api.updateProfile.mockResolvedValue({ ...account('me'), displayName: 'Ana  Luz', bio: 'Me gusta escuchar.' });
    renderProfile();

    await userEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }));
    const name = screen.getByLabelText('Nombre');
    await userEvent.clear(name);
    await userEvent.type(name, '  Ana  Luz  ');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(api.updateProfile).toHaveBeenCalledWith({ displayName: 'Ana  Luz', bio: 'Me gusta escuchar.', profileVisibility: 'PUBLIC' }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Ana  Luz');
  });

  it('does not send a blank display name', async () => {
    renderProfile();

    await userEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }));
    const name = screen.getByLabelText('Nombre');
    await userEvent.clear(name);
    await userEvent.type(name, '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(screen.getByText('El nombre no puede quedar vacío.')).toBeInTheDocument();
    expect(api.updateProfile).not.toHaveBeenCalled();
    expect(name).toHaveValue('   ');
  });

  it('trims the bio and clears it when only spaces remain', async () => {
    api.updateProfile.mockResolvedValueOnce({ ...account('me'), displayName: 'Ana', bio: 'escuchar' });
    renderProfile();

    await userEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }));
    const bio = screen.getByLabelText('Bio');
    await userEvent.clear(bio);
    await userEvent.type(bio, '  escuchar  ');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(api.updateProfile).toHaveBeenCalledWith({ displayName: 'Ana', bio: 'escuchar', profileVisibility: 'PUBLIC' }));

    api.updateProfile.mockResolvedValueOnce({ ...account('me'), displayName: 'Ana', bio: null });
    await userEvent.click(screen.getByRole('button', { name: 'Editar perfil' }));
    const cleared = screen.getByLabelText('Bio');
    await userEvent.clear(cleared);
    await userEvent.type(cleared, '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(api.updateProfile).toHaveBeenLastCalledWith({ displayName: 'Ana', bio: '', profileVisibility: 'PUBLIC' }));
    expect(screen.queryByText('escuchar')).not.toBeInTheDocument();
    expect(screen.queryByText('Me gusta escuchar.')).not.toBeInTheDocument();
  });

  it('shows the saved profile from the response, not the typed text', async () => {
    api.updateProfile.mockResolvedValue({ ...account('me'), displayName: 'Ana Luz', bio: 'Bio guardada' });
    renderProfile();

    await userEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }));
    const name = screen.getByLabelText('Nombre');
    await userEvent.clear(name);
    await userEvent.type(name, '  Ana  ');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('heading', { name: 'Ana Luz' })).toBeInTheDocument();
    expect(screen.getByText('Bio guardada')).toBeInTheDocument();
  });

  it('keeps the form when saving the profile fails', async () => {
    const error = new AxiosError('invalid');
    error.response = {
      status: 400,
      data: { message: 'displayName cannot be blank' },
      statusText: 'Bad Request',
      headers: {},
      config: {} as never,
    };
    api.updateProfile.mockRejectedValue(error);
    renderProfile();

    await userEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }));
    const name = screen.getByLabelText('Nombre');
    await userEvent.clear(name);
    await userEvent.type(name, '  Ana  ');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Tu nombre no puede quedar vacío.');
    expect(alert).not.toHaveTextContent('displayName');
    expect(name).toHaveValue('  Ana  ');
    expect(screen.getByRole('heading', { name: 'Ana' })).toBeInTheDocument();
  });

  it('saves a private profile from the backend response', async () => {
    api.updateProfile.mockResolvedValue({ ...account('me'), profileVisibility: 'PRIVATE' });
    renderProfile();

    await userEvent.click(await screen.findByRole('button', { name: 'Editar perfil' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Privado' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(api.updateProfile).toHaveBeenCalledWith({ displayName: 'Ana', bio: 'Me gusta escuchar.', profileVisibility: 'PRIVATE' }),
    );
    expect(await screen.findByText('Perfil privado')).toBeInTheDocument();
  });

  it('does not offer follow, mute or block on the owner profile', async () => {
    renderProfile();
    expect(await screen.findByRole('button', { name: 'Editar perfil' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acompañar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Más acciones' })).not.toBeInTheDocument();
  });

  it('keeps a pending request distinct from a follow', async () => {
    api.getPublicProfile.mockResolvedValue(profile({ id: 'other', username: 'luz', displayName: 'Luz', followState: 'REQUESTED' }));
    renderProfile('/profile/other');
    expect(await screen.findByText('Solicitud enviada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar solicitud' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Acompañar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acompañando' })).not.toBeInTheDocument();
  });

  it('follows a public profile into FOLLOWING from the response', async () => {
    api.getPublicProfile.mockResolvedValue(profile({ id: 'other', username: 'luz', displayName: 'Luz', followState: 'NONE' }));
    api.followUser.mockResolvedValue({ followState: 'FOLLOWING', requestId: null });
    renderProfile('/profile/other');
    await userEvent.click(await screen.findByRole('button', { name: 'Acompañar' }));
    expect(await screen.findByRole('button', { name: 'Acompañando' })).toBeInTheDocument();
    expect(screen.queryByText('Solicitud enviada')).not.toBeInTheDocument();
  });

  it('turns a private follow into a cancellable request', async () => {
    api.getPublicProfile.mockResolvedValue(profile({ id: 'other', username: 'luz', displayName: 'Luz', profileVisibility: 'PRIVATE', followState: 'NONE' }));
    api.followUser.mockResolvedValue({ followState: 'REQUESTED', requestId: 'req-1' });
    api.cancelFollowRequest.mockResolvedValue(undefined);
    renderProfile('/profile/other');
    await userEvent.click(await screen.findByRole('button', { name: 'Acompañar' }));
    expect(await screen.findByText('Solicitud enviada')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acompañando' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar solicitud' }));
    expect(await screen.findByRole('button', { name: 'Acompañar' })).toBeInTheDocument();
    expect(api.cancelFollowRequest).toHaveBeenCalledWith('req-1');
  });

  it('refreshes a stale cancellation instead of guessing', async () => {
    const requested = profile({ id: 'other', username: 'luz', displayName: 'Luz', followState: 'REQUESTED' });
    const following = profile({ id: 'other', username: 'luz', displayName: 'Luz', followState: 'FOLLOWING' });
    api.getPublicProfile.mockReset();
    api.getPublicProfile.mockResolvedValueOnce(requested).mockResolvedValue(following);
    api.listOutgoingFollowRequests.mockResolvedValue([
      {
        requestId: 'req-1',
        otherUser: { id: 'other', username: 'luz', displayName: 'Luz', avatarId: null },
        createdAt: '2026-09-20T12:00:00.000Z',
        status: 'PENDING',
      },
    ]);
    const stale = new AxiosError('conflict');
    stale.response = { status: 409, data: {}, statusText: 'Conflict', headers: {}, config: {} as never };
    api.cancelFollowRequest.mockRejectedValue(stale);
    renderProfile('/profile/other');
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar solicitud' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Esa solicitud ya no está pendiente.');
    expect(await screen.findByRole('button', { name: 'Acompañando' })).toBeInTheDocument();
  });

  it('accepts an incoming request and shows that person as accompanying', async () => {
    const request = incoming();
    api.listIncomingFollowRequests.mockResolvedValueOnce([request]).mockResolvedValue([]);
    api.getFollowers.mockResolvedValueOnce([]).mockResolvedValue([{ id: 'luz', username: 'luz', displayName: 'Luz', avatarId: null }]);
    api.acceptFollowRequest.mockResolvedValue({ ...request, status: 'ACCEPTED' });
    renderProfile();
    await userEvent.click(await screen.findByRole('button', { name: 'Aceptar' }));
    expect(await screen.findByRole('heading', { name: 'Quienes te acompañan' })).toBeInTheDocument();
    expect(screen.getByText('Luz')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aceptar' })).not.toBeInTheDocument();
    expect(api.followUser).not.toHaveBeenCalled();
  });

  it('rejects an incoming request without adding that person as accompanying', async () => {
    const request = incoming();
    api.listIncomingFollowRequests.mockResolvedValue([request]);
    api.rejectFollowRequest.mockResolvedValue({ ...request, status: 'REJECTED' });
    renderProfile();
    await userEvent.click(await screen.findByRole('button', { name: 'Rechazar' }));
    await waitFor(() => expect(api.rejectFollowRequest).toHaveBeenCalledWith('req-1'));
    expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Quienes te acompañan' })).not.toBeInTheDocument();
    expect(api.getFollowers).toHaveBeenCalledTimes(1);
  });

  it('keeps the request and explains a failure that is not a stale conflict', async () => {
    api.listIncomingFollowRequests.mockResolvedValue([incoming()]);
    const failure = new AxiosError('down');
    failure.response = { status: 500, data: {}, statusText: 'Error', headers: {}, config: {} as never };
    api.acceptFollowRequest.mockRejectedValue(failure);
    renderProfile();
    await userEvent.click(await screen.findByRole('button', { name: 'Aceptar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos actualizar esa relación.');
    expect(screen.getByRole('button', { name: 'Aceptar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeEnabled();
    expect(screen.queryByRole('heading', { name: 'Quienes te acompañan' })).not.toBeInTheDocument();
  });

  it('hides actions when an incoming request is no longer pending', async () => {
    api.listIncomingFollowRequests.mockResolvedValue([incoming()]);
    const stale = new AxiosError('conflict');
    stale.response = { status: 409, data: {}, statusText: 'Conflict', headers: {}, config: {} as never };
    api.acceptFollowRequest.mockRejectedValue(stale);
    renderProfile();
    await userEvent.click(await screen.findByRole('button', { name: 'Aceptar' }));
    expect(await screen.findByText('Esa solicitud ya no está pendiente.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument();
  });

  it('cancels an outgoing request from the owner profile', async () => {
    api.listOutgoingFollowRequests.mockResolvedValue([
      {
        requestId: 'req-2',
        otherUser: { id: 'luz', username: 'luz', displayName: 'Luz', avatarId: null },
        createdAt: '2026-09-20T12:00:00.000Z',
        status: 'PENDING',
      },
    ]);
    api.cancelFollowRequest.mockResolvedValue(undefined);
    renderProfile();
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar solicitud' }));
    await waitFor(() => expect(api.cancelFollowRequest).toHaveBeenCalledWith('req-2'));
    expect(screen.queryByText('Luz')).not.toBeInTheDocument();
  });

  it('removes a follower without blocking or muting', async () => {
    api.getFollowers.mockResolvedValue([{ id: 'luz', username: 'luz', displayName: 'Luz', avatarId: null }]);
    api.removeFollower.mockResolvedValue(undefined);
    renderProfile();
    await userEvent.click(await screen.findByRole('button', { name: 'Dejar de acompañarte' }));
    await waitFor(() => expect(api.removeFollower).toHaveBeenCalledWith('luz'));
    expect(screen.queryByText('Luz')).not.toBeInTheDocument();
    expect(api.blockUser).not.toHaveBeenCalled();
    expect(api.muteUser).not.toHaveBeenCalled();
  });

  it('confirms a block and then offers only unblock on the limited profile', async () => {
    const visible = profile({ id: 'other', username: 'luz', displayName: 'Luz', bio: 'Acá cuando puedo.', followState: 'FOLLOWING' });
    const limited = profile({
      id: 'other',
      username: 'luz',
      displayName: 'Luz',
      bio: null,
      followState: 'NONE',
      blockedByCurrentUser: true,
      companionPreferences: null,
    });
    api.getPublicProfile.mockReset();
    api.getPublicProfile.mockResolvedValueOnce(visible).mockResolvedValue(limited);
    api.blockUser.mockResolvedValue(undefined);
    renderProfile('/profile/other');
    await userEvent.click(await screen.findByRole('button', { name: 'Más acciones' }));
    await userEvent.click(screen.getByRole('button', { name: 'Bloquear' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Van a dejar de verse y de interactuar.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Bloquear' }));
    expect(await screen.findByRole('button', { name: 'Desbloquear' })).toBeInTheDocument();
    expect(screen.getByText('Bloqueaste a esta persona.')).toBeInTheDocument();
    expect(screen.queryByText('Acá cuando puedo.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acompañar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mensajes' })).not.toBeInTheDocument();
    expect(api.muteUser).not.toHaveBeenCalled();
  });

  it('unblocks without restoring the previous follow', async () => {
    const blocked = profile({ id: 'other', username: 'luz', displayName: 'Luz', bio: null, blockedByCurrentUser: true, followState: 'NONE' });
    const open = profile({ id: 'other', username: 'luz', displayName: 'Luz', bio: null, blockedByCurrentUser: false, followState: 'NONE' });
    api.getPublicProfile.mockReset();
    api.getPublicProfile.mockResolvedValueOnce(blocked).mockResolvedValue(open);
    api.unblockUser.mockResolvedValue(undefined);
    renderProfile('/profile/other');
    await userEvent.click(await screen.findByRole('button', { name: 'Desbloquear' }));
    expect(await screen.findByRole('button', { name: 'Acompañar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acompañando' })).not.toBeInTheDocument();
    expect(api.followUser).not.toHaveBeenCalled();
  });

  it('treats a profile hidden by the other person as unavailable', async () => {
    api.getPublicProfile.mockRejectedValue(new AxiosError('missing'));
    renderProfile('/profile/other');
    expect(await screen.findByText('No pudimos abrir este perfil. Probá de nuevo en un rato.')).toBeInTheDocument();
    expect(screen.queryByText(/bloque/i)).not.toBeInTheDocument();
  });

  it('does not render hidden profile fields', async () => {
    api.getPublicProfile.mockResolvedValue(
      profile({ id: 'other', username: 'luz', displayName: 'Luz', bio: null, companionPreferences: null, profileVisibility: 'PRIVATE' }),
    );
    api.getUserStatus.mockResolvedValue({ kind: 'hidden' });
    renderProfile('/profile/other');
    expect(await screen.findByRole('heading', { name: 'Luz' })).toBeInTheDocument();
    expect(screen.queryByText('Sin estado reciente')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Cómo suele estar para otros' })).not.toBeInTheDocument();
  });

  it('mutes without changing the follow action or hiding the profile', async () => {
    const visible = profile({ id: 'other', username: 'luz', displayName: 'Luz', bio: 'Sigo acá.', followState: 'NONE', mutedByCurrentUser: false });
    const muted = { ...visible, mutedByCurrentUser: true };
    api.getPublicProfile.mockReset();
    api.getPublicProfile.mockResolvedValueOnce(visible).mockResolvedValue(muted);
    api.muteUser.mockResolvedValue(undefined);
    renderProfile('/profile/other');
    expect(await screen.findByText('Sigo acá.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Más acciones' }));
    await userEvent.click(screen.getByRole('button', { name: 'Silenciar' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Silenciar' })).not.toBeInTheDocument());
    expect(screen.getByText('Sigo acá.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acompañar' })).toBeInTheDocument();
    expect(api.blockUser).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Más acciones' }));
    expect(screen.getByRole('button', { name: 'Dejar de silenciar' })).toBeInTheDocument();
  });
});
