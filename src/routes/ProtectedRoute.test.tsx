import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  current: {
    user: null as { id: string } | null,
    loading: true,
    status: 'initializing' as 'initializing' | 'authenticated' | 'unauthenticated',
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => auth.current,
}));

import ProtectedRoute from './ProtectedRoute';

function renderAtFeed() {
  return render(
    <MemoryRouter initialEntries={['/feed']}>
      <Routes>
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <p>Feed privado</p>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<p>Pantalla de login</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    auth.current.user = null;
    auth.current.loading = true;
    auth.current.status = 'initializing';
  });

  it('waits for auth initialization before redirecting', () => {
    renderAtFeed();
    expect(screen.getByText('Cargando sesión')).toBeInTheDocument();
    expect(screen.queryByText('Pantalla de login')).not.toBeInTheDocument();
    expect(screen.queryByText('Feed privado')).not.toBeInTheDocument();
  });

  it('redirects when initialization finishes without a session', () => {
    auth.current.loading = false;
    auth.current.status = 'unauthenticated';
    renderAtFeed();
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
  });

  it('renders private content once the session is ready', () => {
    auth.current.user = { id: 'user-a' };
    auth.current.loading = false;
    auth.current.status = 'authenticated';
    renderAtFeed();
    expect(screen.getByText('Feed privado')).toBeInTheDocument();
  });
});
