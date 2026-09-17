import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import type { ApiErrorResponse } from '../api/types';
import LogoFull from '../components/LogoFull';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await login({ username, password });
      navigate('/feed');
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setError(err.response?.data.message ?? 'Error al iniciar sesión');
      } else {
        setError('Error al iniciar sesión');
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <LogoFull />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="rounded-md border border-mist bg-white px-4 py-2.5 text-ink placeholder:text-dusk/60 focus:border-horizon focus:outline-none"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-md border border-mist bg-white px-4 py-2.5 text-ink placeholder:text-dusk/60 focus:border-horizon focus:outline-none"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="mt-2 rounded-md bg-horizon px-4 py-2.5 font-medium text-white transition-colors hover:bg-horizon/90"
          >
            Ingresar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-dusk">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="font-medium text-horizon hover:underline">
            Registrate
          </Link>
        </p>

        <p className="mt-3 text-center text-sm text-dusk">
          <Link to="/help" className="font-medium text-calm hover:underline">
            ¿Necesitás ayuda ahora?
          </Link>
        </p>
      </div>
    </div>
  );
}