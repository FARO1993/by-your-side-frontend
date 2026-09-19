import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import type { ApiErrorResponse } from '../api/types';
import AuthLayout from '../components/AuthLayout';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ username, password });
      navigate('/feed');
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setError(err.response?.data.message ?? 'Error al iniciar sesión');
      } else {
        setError('Error al iniciar sesión');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="ByYourSide">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={submitting}
          className="rounded-md border border-mist bg-white px-4 py-2.5 text-ink placeholder:text-dusk/60 focus:border-horizon focus:outline-none disabled:opacity-60"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={submitting}
          className="rounded-md border border-mist bg-white px-4 py-2.5 text-ink placeholder:text-dusk/60 focus:border-horizon focus:outline-none disabled:opacity-60"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex items-center justify-center gap-2 rounded-md bg-horizon px-4 py-2.5 font-medium text-white transition-all duration-150 hover:bg-horizon/90 active:scale-95 disabled:opacity-60"
        >
          {submitting && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {submitting ? 'Ingresando...' : 'Ingresar'}
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
    </AuthLayout>
  );
}