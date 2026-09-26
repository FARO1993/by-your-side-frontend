import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { applyPasswordReset } from '../auth/accountActions';
import { classifyResetError, type ResetFailure } from '../auth/apiError';
import { confirmPasswordError, passwordLengthError } from '../auth/passwords';
import { AuthLayout } from '../components/auth/AuthLayout';
import { PasswordField } from '../components/auth/PasswordField';
import { Button } from '../components/byourside/ui';

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
    if (submitting) return;
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
    <AuthLayout
      variant="reset"
      title="Nueva contraseña"
      subtitle="Elegí una contraseña de al menos 8 caracteres."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-busy={submitting}>
        <PasswordField
          label="Nueva contraseña"
          autoComplete="new-password"
          placeholder="Nueva contraseña"
          showLabel="Mostrar nueva contraseña"
          hideLabel="Ocultar nueva contraseña"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldError(null);
            setFormError(null);
          }}
          required
          minLength={8}
          disabled={submitting}
        />
        <PasswordField
          label="Confirmá la contraseña"
          autoComplete="new-password"
          placeholder="Repetí la contraseña"
          showLabel="Mostrar confirmación de contraseña"
          hideLabel="Ocultar confirmación de contraseña"
          value={confirmation}
          onChange={(event) => {
            setConfirmation(event.target.value);
            setFieldError(null);
            setFormError(null);
          }}
          required
          minLength={8}
          disabled={submitting}
          error={fieldError ?? undefined}
        />
        {formError ? (
          <div role="alert" className="rounded-xl bg-presence-soft px-3 py-2 text-sm text-presence-strong">
            {formError}{' '}
            <Link to="/forgot-password" className="font-semibold underline">
              Pedir un enlace nuevo
            </Link>
          </div>
        ) : null}
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? 'Restableciendo…' : 'Restablecer contraseña'}
        </Button>
      </form>
    </AuthLayout>
  );
}
