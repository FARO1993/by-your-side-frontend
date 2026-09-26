import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerErrorMessage } from '../auth/apiError';
import { passwordLengthError } from '../auth/passwords';
import { useAuth } from '../context/AuthContext';
import type { RegisterData } from '../api/types';
import { AuthLayout } from '../components/auth/AuthLayout';
import { PasswordField } from '../components/auth/PasswordField';
import { armAuthTransition, authTransitionMs, disarmAuthTransition } from '../components/auth/authTransition';
import { displayNameFieldError, emailFieldError } from '../components/auth/authValidation';
import { Button, TextField } from '../components/byourside/ui';

type FieldErrors = {
  displayName?: string;
  email?: string;
  password?: string;
};

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterData>({
    displayName: '',
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'submitting' | 'success'>('idle');
  const lock = useRef(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const busy = phase !== 'idle';

  useEffect(() => {
    if (phase !== 'success') return undefined;
    const timer = window.setTimeout(() => navigate('/feed'), authTransitionMs());
    return () => window.clearTimeout(timer);
  }, [phase, navigate]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;

    const nextErrors: FieldErrors = {
      displayName: displayNameFieldError(form.displayName ?? '') ?? undefined,
      email: emailFieldError(form.email) ?? undefined,
      password: passwordLengthError(form.password) ?? undefined,
    };
    setFieldErrors(nextErrors);
    setFormError(null);
    if (nextErrors.displayName || nextErrors.email || nextErrors.password) return;

    lock.current = true;
    setPhase('submitting');
    armAuthTransition();
    let succeeded = false;
    try {
      await register({
        displayName: form.displayName?.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      succeeded = true;
      setPhase('success');
    } catch (err) {
      setFormError(registerErrorMessage(err));
      setFieldErrors({});
    } finally {
      if (!succeeded) {
        disarmAuthTransition();
        lock.current = false;
        setPhase('idle');
      }
    }
  }

  const submitLabel = phase === 'success' ? 'Listo' : phase === 'submitting' ? 'Creando tu espacio…' : 'Crear mi espacio';

  return (
    <AuthLayout
      variant="register"
      title="Encontrá un lugar donde estar"
      subtitle="Creá un espacio para compartir, escuchar y acompañar."
      leaving={phase === 'success'}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-busy={busy}>
        <TextField
          label="¿Cómo querés que te llamemos?"
          name="displayName"
          autoComplete="nickname"
          placeholder="Tu nombre"
          value={form.displayName}
          onChange={handleChange}
          required
          disabled={busy}
          error={fieldErrors.displayName}
        />
        <TextField
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="vos@ejemplo.com"
          value={form.email}
          onChange={handleChange}
          required
          disabled={busy}
          error={fieldErrors.email}
        />
        <PasswordField
          label="Contraseña"
          name="password"
          autoComplete="new-password"
          placeholder="Elegí una contraseña"
          hint="Al menos 8 caracteres."
          value={form.password}
          onChange={handleChange}
          required
          disabled={busy}
          error={fieldErrors.password}
        />
        {formError ? (
          <p role="alert" className="rounded-xl bg-presence-soft px-3 py-2 text-sm text-presence-strong">
            {formError}
          </p>
        ) : null}
        <Button type="submit" fullWidth disabled={busy}>
          {submitLabel}
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
    </AuthLayout>
  );
}
