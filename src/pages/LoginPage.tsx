import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import type { ApiErrorResponse } from '../api/types';
import { requestPasswordReset } from '../mocks/auth';
import { Button, PresenceGlyph, TextField } from '../components/byourside/ui';
import { Logo } from '../components/byourside/logo';

function WelcomePanel() {
  return (
    <div className="hidden flex-col justify-between bg-gradient-to-br from-presence-soft via-cream to-listening-soft p-10 lg:flex">
      <Logo wordmark />
      <div>
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-card/70 text-presence-strong">
          <PresenceGlyph className="h-4 w-6" />
        </div>
        <h2 className="font-serif text-3xl text-pretty">No tenés que atravesarlo solo.</h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-foreground/80">
          Un espacio para estar al lado, sin apuro y sin tener que explicarlo todo.
        </p>
      </div>
      <div className="flex gap-6 text-sm">
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-presence" /> Presencia
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-listening" /> Escucha
        </span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [forgot, setForgot] = useState(false);
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
    <div className="min-h-dvh bg-background">
      <div className="mx-auto grid min-h-dvh max-w-5xl grid-cols-1 lg:grid-cols-2">
        <WelcomePanel />
        <div className="flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <Logo wordmark />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl">Qué bueno verte de nuevo</h1>
            <p className="mt-2 text-sm text-muted-foreground">Entrá cuando quieras. Te esperamos acá.</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <TextField
                label="Usuario"
                placeholder="Usuario"
                icon={<Mail className="size-4" />}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                disabled={submitting}
              />
              <TextField
                label="Contraseña"
                placeholder="Contraseña"
                type="password"
                icon={<Lock className="size-4" />}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={submitting}
                error={error ?? undefined}
              />
              <button
                type="button"
                className="text-sm text-listening-strong hover:underline"
                onClick={async () => {
                  await requestPasswordReset(username);
                  setForgot(true);
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
              {forgot ? (
                <p className="text-xs text-muted-foreground">
                  El servidor todavía no tiene recupero de clave. Esta confirmación es solo visual (mock).
                </p>
              ) : null}
              <Button type="submit" fullWidth loading={submitting}>
                Ingresar
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿Todavía no tenés cuenta?{' '}
              <Link to="/register" className="font-semibold text-foreground">
                Unite
              </Link>
            </p>
            <p className="mt-3 text-center text-sm">
              <Link to="/help" className="font-medium text-listening-strong hover:underline">
                ¿Necesitás ayuda ahora?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
