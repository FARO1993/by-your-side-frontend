import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User } from 'lucide-react';
import { registerErrorMessage } from '../auth/apiError';
import { useAuth } from '../context/AuthContext';
import type { RegisterData } from '../api/types';
import { Button, PresenceGlyph, TextField } from '../components/byourside/ui';
import { Logo } from '../components/byourside/logo';

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterData>({
    displayName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(form);
      navigate('/feed');
    } catch (err) {
      setError(registerErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto grid min-h-dvh max-w-5xl grid-cols-1 lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-presence-soft via-cream to-listening-soft p-10 lg:flex">
          <Logo wordmark />
          <div>
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-card/70 text-presence-strong">
              <PresenceGlyph className="h-4 w-6" />
            </div>
            <h2 className="font-serif text-3xl text-pretty">No tenés que atravesarlo solo.</h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-foreground/80">
              ByYourSide es un lugar tranquilo para compartir cómo estás y encontrar a alguien que
              te acompañe. Sin apuros, sin juicios. Solo presencia.
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
        <div className="flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <Logo wordmark />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl">Te hacemos un lugar</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Creá tu espacio. Vas a poder compartir y acompañar a tu ritmo.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <TextField
                label="¿Cómo querés que te llamemos?"
                name="displayName"
                placeholder="Tu nombre"
                icon={<User className="size-4" />}
                value={form.displayName}
                onChange={handleChange}
                required
                disabled={submitting}
              />
              <TextField
                label="Correo electrónico"
                name="email"
                type="email"
                placeholder="vos@ejemplo.com"
                icon={<Mail className="size-4" />}
                value={form.email}
                onChange={handleChange}
                required
                disabled={submitting}
              />
              <TextField
                label="Contraseña"
                name="password"
                type="password"
                placeholder="Elegí una contraseña"
                hint="Al menos 8 caracteres."
                icon={<Lock className="size-4" />}
                value={form.password}
                onChange={handleChange}
                required
                disabled={submitting}
                error={error ?? undefined}
              />
              <Button type="submit" fullWidth loading={submitting}>
                Crear mi espacio
              </Button>
            </form>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Al unirte aceptás cuidar este espacio y a quienes lo habitan.
            </p>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{' '}
              <Link to="/login" className="font-semibold text-presence hover:underline">
                Ingresá
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}