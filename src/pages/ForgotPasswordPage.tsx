import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { forgotPassword } from '../api/auth';
import { OFFLINE_MESSAGE, readApiError } from '../auth/apiError';
import { AuthScaffold, AuthStatusMessage } from '../components/auth/AuthScaffold';
import { Button, TextField } from '../components/byourside/ui';

const FORGOT_GENERIC_MESSAGE =
  'Si existe una cuenta asociada, recibirás un email con instrucciones.';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setMessage(FORGOT_GENERIC_MESSAGE);
    } catch (err) {
      const api = readApiError(err);
      if (api.offline) setError(OFFLINE_MESSAGE);
      else if (api.status === 400) setError('Ingresá un correo válido.');
      else setError('No pudimos enviar el pedido. Intentá de nuevo en un momento.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScaffold
      title="Recuperar contraseña"
      subtitle="Te enviamos instrucciones si hay una cuenta con ese correo."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="vos@ejemplo.com"
          icon={<Mail className="size-4" />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={submitting}
          error={error ?? undefined}
        />
        {message ? <AuthStatusMessage>{message}</AuthStatusMessage> : null}
        <Button type="submit" fullWidth loading={submitting}>
          Enviar instrucciones
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-semibold text-presence hover:underline">
          Volver a ingresar
        </Link>
      </p>
    </AuthScaffold>
  );
}
