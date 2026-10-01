import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import { OFFLINE_MESSAGE, readApiError } from '../auth/apiError';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Button, TextField } from '../components/byourside/ui';

const FIELD_ERROR = 'Ingresá un correo válido.';
const FORM_ERROR = 'No pudimos enviar el pedido. Intentá de nuevo en un momento.';
const SUCCESS_BODY = 'Si existe una cuenta asociada a ese correo, te enviamos instrucciones para continuar.';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      const api = readApiError(err);
      if (api.offline) setError(OFFLINE_MESSAGE);
      else if (api.status === 400) setError(FIELD_ERROR);
      else setError(FORM_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  const fieldError = error === FIELD_ERROR ? error : null;
  const formError = error && error !== FIELD_ERROR ? error : null;

  return (
    <AuthLayout
      variant="forgot"
      title={sent ? 'Revisá tu correo' : 'Recuperar contraseña'}
      subtitle={sent ? SUCCESS_BODY : 'Te enviamos instrucciones si hay una cuenta con ese correo.'}
    >
      {sent ? null : (
        <form onSubmit={handleSubmit} className="space-y-4" aria-busy={submitting}>
          <TextField
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="vos@ejemplo.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
            required
            disabled={submitting}
            error={fieldError ?? undefined}
          />
          {formError ? (
            <p role="alert" className="rounded-xl bg-presence-soft px-3 py-2 text-sm text-presence-strong">
              {formError}
            </p>
          ) : null}
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? 'Enviando…' : 'Enviar instrucciones'}
          </Button>
        </form>
      )}
      <p className={sent ? 'text-center text-sm text-muted-foreground' : 'mt-6 text-center text-sm text-muted-foreground'}>
        <Link to="/login" className="font-semibold text-presence hover:underline">
          Volver a ingresar
        </Link>
      </p>
    </AuthLayout>
  );
}
