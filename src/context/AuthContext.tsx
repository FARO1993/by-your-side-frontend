import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { login as loginRequest, register as registerRequest, getCurrentUser } from '../api/auth';
import { connectSocket, disconnectSocket } from '../api/socket';
import type { User, LoginCredentials, RegisterData } from '../api/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
        connectSocket(token);
      })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials: LoginCredentials): Promise<void> {
    const { token } = await loginRequest(credentials);
    localStorage.setItem('token', token);
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    connectSocket(token);
  }

  async function register(data: RegisterData): Promise<void> {
    const { token } = await registerRequest(data);
    localStorage.setItem('token', token);
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    connectSocket(token);
  }

  function logout(): void {
    localStorage.removeItem('token');
    disconnectSocket();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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