import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { applyPasswordReset } from '../auth/accountActions';
import { classifyResetError, type ResetFailure } from '../auth/apiError';
import { confirmPasswordError, passwordLengthError } from '../auth/passwords';
import { AuthScaffold } from '../components/auth/AuthScaffold';
import { Button, TextField } from '../components/byourside/ui';

const COPY: Record<ResetFailure, string> = {
  invalid: 'Este enlace no es válido. Pedí uno nuevo.',
  expired: 'Este enlace venció. Pedí uno nuevo.',
  used: 'Este enlace ya se usó. Pedí uno nuevo.',
  superseded: 'Este enlace fue reemplazado por uno más nuevo. Pedí otro si lo necesitás.',
  error: 'No pudimos restablecer la contraseña. Intentá de nuevo en un momento.',
};

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const tokenRef = useRef(params.get('token')?.trim() || '');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    setFormError(null);

    if (!tokenRef.current) {
      setFormError('Este enlace no incluye un código para restablecer la contraseña.');
      return;
    }

    const lengthError = passwordLengthError(password);
    const matchError = confirmPasswordError(password, confirmation);
    if (lengthError || matchError) {
      setFieldError(lengthError ?? matchError);
      return;
    }

    setSubmitting(true);
    try {
      await applyPasswordReset({ token: tokenRef.current, newPassword: password });
      navigate('/login', { replace: true });
    } catch (err) {
      setFormError(COPY[classifyResetError(err)]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScaffold
      title="Nueva contraseña"
      subtitle="Elegí una contraseña de al menos 8 caracteres."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="Nueva contraseña"
          icon={<Lock className="size-4" />}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          disabled={submitting}
        />
        <TextField
          label="Confirmá la contraseña"
          type="password"
          autoComplete="new-password"
          placeholder="Repetí la contraseña"
          icon={<Lock className="size-4" />}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          required
          minLength={8}
          disabled={submitting}
          error={fieldError ?? undefined}
        />
        {formError ? (
          <p role="alert" className="text-sm text-destructive">
            {formError}{' '}
            <Link to="/forgot-password" className="font-semibold text-listening-strong hover:underline">
              Pedir un enlace nuevo
            </Link>
          </p>
        ) : null}
        <Button type="submit" fullWidth loading={submitting}>
          Restablecer contraseña
        </Button>
      </form>
    </AuthScaffold>
  );
}
