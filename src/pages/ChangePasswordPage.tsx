import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { applyPasswordChange } from '../auth/accountActions';
import { changePasswordFieldError } from '../auth/apiError';
import { confirmPasswordError, passwordLengthError } from '../auth/passwords';
import { Button, TextField } from '../components/byourside/ui';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [nextError, setNextError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCurrentError(null);
    setNextError(null);
    setFormError(null);

    if (!currentPassword) {
      setCurrentError('Ingresá tu contraseña actual.');
      return;
    }

    const lengthError = passwordLengthError(newPassword);
    if (lengthError) {
      setNextError(lengthError);
      return;
    }

    if (newPassword === currentPassword) {
      setNextError('La nueva contraseña tiene que ser distinta de la actual.');
      return;
    }

    const matchError = confirmPasswordError(newPassword, confirmation);
    if (matchError) {
      setNextError(matchError);
      return;
    }

    setSubmitting(true);
    try {
      await applyPasswordChange({ currentPassword, newPassword });
      navigate('/login', { replace: true });
    } catch (err) {
      const fields = changePasswordFieldError(err);
      setCurrentError(fields.current ?? null);
      setNextError(fields.next ?? null);
      setFormError(fields.form ?? null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl">Cambiar contraseña</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Al actualizarla vas a tener que iniciar sesión de nuevo en todos tus dispositivos.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Contraseña actual"
          type="password"
          autoComplete="current-password"
          icon={<Lock className="size-4" />}
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
          disabled={submitting}
          error={currentError ?? undefined}
        />
        <TextField
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          hint="Al menos 8 caracteres."
          icon={<Lock className="size-4" />}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          minLength={8}
          disabled={submitting}
        />
        <TextField
          label="Confirmá la nueva contraseña"
          type="password"
          autoComplete="new-password"
          icon={<Lock className="size-4" />}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          required
          minLength={8}
          disabled={submitting}
          error={nextError ?? undefined}
        />
        {formError ? (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        ) : null}
        <Button type="submit" fullWidth loading={submitting}>
          Actualizar contraseña
        </Button>
      </form>
    </div>
  );
}
