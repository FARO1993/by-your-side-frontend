import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { loginErrorMessage } from '../auth/apiError';
import { consumeAuthNotice } from '../auth/session';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthStatusMessage } from '../components/auth/AuthScaffold';
import { PasswordField } from '../components/auth/PasswordField';
import { armAuthTransition, disarmAuthTransition } from '../components/auth/authTransition';
import { emailFieldError, loginPasswordError } from '../components/auth/authValidation';
import { Button, TextField } from '../components/byourside/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice] = useState(() => consumeAuthNotice());
  const [phase, setPhase] = useState<'idle' | 'submitting' | 'success'>('idle');
  const lock = useRef(false);
  const { login } = useAuth();
  const busy = phase !== 'idle';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;

    const emailError = emailFieldError(email);
    const passwordError = loginPasswordError(password);
    setFieldErrors({
      email: emailError ?? undefined,
      password: passwordError ?? undefined,
    });
    setFormError(null);
    if (emailError || passwordError) return;

    lock.current = true;
    setPhase('submitting');
    armAuthTransition();
    let succeeded = false;
    try {
      await login({ email: email.trim(), password });
      succeeded = true;
      setPhase('success');
    } catch (err) {
      setFormError(loginErrorMessage(err));
      setFieldErrors({});
    } finally {
      if (!succeeded) {
        disarmAuthTransition();
        lock.current = false;
        setPhase('idle');
      }
    }
  }

  const submitLabel = phase === 'success' ? 'Listo' : phase === 'submitting' ? 'Entrando…' : 'Ingresar';

  return (
    <AuthLayout
      variant="login"
      title="Qué bueno verte de nuevo"
      subtitle="Ingresá para reencontrarte con quienes te acompañan."
      leaving={phase === 'success'}
    >
      {notice ? (
        <div className="mb-4">
          <AuthStatusMessage>{notice}</AuthStatusMessage>
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-busy={busy}>
        <TextField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="vos@ejemplo.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldErrors((current) => ({ ...current, email: undefined }));
            setFormError(null);
          }}
          required
          disabled={busy}
          error={fieldErrors.email}
        />
        <PasswordField
          label="Contraseña"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
            setFormError(null);
          }}
          required
          disabled={busy}
          error={fieldErrors.password}
        />
        <Link to="/forgot-password" className="inline-flex py-1 text-sm text-listening-strong hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
        {formError ? (
          <p role="alert" className="rounded-xl bg-presence-soft px-3 py-2 text-sm text-presence-strong">
            {formError}
          </p>
        ) : null}
        <Button type="submit" fullWidth disabled={busy}>
          {submitLabel}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Todavía no tenés cuenta?{' '}
        <Link to="/register" className="font-semibold text-presence hover:underline">
          Unite
        </Link>
      </p>
      <p className="mt-3 text-center text-sm">
        <Link to="/help" className="font-medium text-listening-strong hover:underline">
          ¿Necesitás ayuda ahora?
        </Link>
      </p>
    </AuthLayout>
  );
}
