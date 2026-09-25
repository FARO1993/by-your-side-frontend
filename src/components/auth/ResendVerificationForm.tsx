import { useState, type FormEvent } from 'react';
import { Mail } from 'lucide-react';
import { resendVerification } from '../../api/auth';
import { OFFLINE_MESSAGE, readApiError } from '../../auth/apiError';
import { Button, TextField } from '../byourside/ui';
import { AuthStatusMessage } from './AuthScaffold';

const RESEND_GENERIC_MESSAGE =
  'Si hay una cuenta que todavía necesita verificación, te enviamos un nuevo email.';

export function ResendVerificationForm({
  initialEmail = '',
  idPrefix = 'resend',
}: {
  initialEmail?: string;
  idPrefix?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setSubmitting(true);
    try {
      await resendVerification(email.trim());
      setMessage(RESEND_GENERIC_MESSAGE);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextField
        id={`${idPrefix}-email`}
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
        Reenviar verificación
      </Button>
    </form>
  );
}
