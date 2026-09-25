import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getCurrentUser, login as loginRequest, register as registerRequest } from '../api/auth';
import { connectSocket } from '../api/socket';
import type { LoginCredentials, RegisterData, User } from '../api/types';
import { authStorage } from '../auth/authStorage';
import {
  endSession,
  markAuthenticated,
  onSessionCleared,
  persistAuthResponse,
  refreshSession,
} from '../auth/session';
import { welcomeStorage } from '../auth/welcomeStorage';

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('initializing');

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onSessionCleared(() => {
      setUser(null);
      setStatus('unauthenticated');
    });

    async function bootstrap(): Promise<void> {
      try {
        let accessToken = authStorage.getAccessToken();
        if (!accessToken && authStorage.getRefreshToken()) {
          accessToken = await refreshSession();
        }

        if (!accessToken) {
          if (!cancelled) setStatus('unauthenticated');
          return;
        }

        const currentUser = await getCurrentUser();
        if (cancelled) return;

        welcomeStorage.consumeArm(currentUser.id);
        setUser(currentUser);
        connectSocket(accessToken);
        markAuthenticated();
        setStatus('authenticated');
      } catch {
        if (!cancelled) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  async function login(credentials: LoginCredentials): Promise<void> {
    const session = await loginRequest(credentials);
    persistAuthResponse(session);
    const currentUser = await getCurrentUser();
    welcomeStorage.consumeArm(currentUser.id);
    setUser(currentUser);
    connectSocket(session.accessToken);
    setStatus('authenticated');
  }

  async function register(data: RegisterData): Promise<void> {
    const session = await registerRequest(data);
    persistAuthResponse(session);
    welcomeStorage.armForNextAuthenticatedUser();
    const currentUser = await getCurrentUser();
    welcomeStorage.consumeArm(currentUser.id);
    setUser(currentUser);
    connectSocket(session.accessToken);
    setStatus('authenticated');
  }

  async function logout(): Promise<void> {
    await endSession();
    setUser(null);
    setStatus('unauthenticated');
  }

  const reloadUser = useCallback(async (): Promise<void> => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        loading: status === 'initializing',
        login,
        register,
        logout,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
