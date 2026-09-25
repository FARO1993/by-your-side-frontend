import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../api/auth';
import { classifyVerifyError, type VerifyFailure } from '../auth/apiError';
import { useAuth } from '../context/AuthContext';
import { Button, Spinner } from '../components/byourside/ui';
import { AuthScaffold, AuthStatusMessage } from '../components/auth/AuthScaffold';
import { ResendVerificationForm } from '../components/auth/ResendVerificationForm';

type VerifyState = 'verifying' | 'success' | 'missing' | VerifyFailure;

const verifyRequests = new Map<string, Promise<unknown>>();

function verifyEmailOnce(token: string): Promise<unknown> {
  const existing = verifyRequests.get(token);
  if (existing) return existing;
  const request = verifyEmail(token);
  verifyRequests.set(token, request);
  return request;
}

const COPY: Record<Exclude<VerifyState, 'verifying' | 'success'>, { title: string; body: string }> = {
  missing: {
    title: 'Falta el enlace',
    body: 'Este enlace no incluye un código de verificación. Pedí uno nuevo.',
  },
  invalid: {
    title: 'El enlace no es válido',
    body: 'No pudimos verificar este enlace. Pedí uno nuevo.',
  },
  expired: {
    title: 'El enlace venció',
    body: 'Este enlace ya no está vigente. Pedí uno nuevo.',
  },
  used: {
    title: 'Este enlace ya se usó',
    body: 'La verificación ya se había completado con este enlace.',
  },
  superseded: {
    title: 'Hay un enlace más nuevo',
    body: 'Este enlace fue reemplazado. Usá el último que te enviamos, o pedí otro.',
  },
  error: {
    title: 'No pudimos verificar',
    body: 'Ocurrió un problema al verificar. Intentá de nuevo en un momento.',
  },
};

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token')?.trim() ?? '';
  const { user, status, reloadUser } = useAuth();
  const [state, setState] = useState<VerifyState>(token ? 'verifying' : 'missing');

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;
    verifyEmailOnce(token)
      .then(() => {
        if (!cancelled) setState('success');
      })
      .catch((error: unknown) => {
        if (!cancelled) setState(classifyVerifyError(error));
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (state !== 'success' || status !== 'authenticated') return;
    void reloadUser().catch(() => {
      // La verificación igual fue exitosa.
    });
  }, [reloadUser, state, status]);

  return (
    <AuthScaffold
      title="Verificá tu correo"
      subtitle="Así sabemos que este espacio es tuyo."
    >
      {state === 'verifying' ? (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Spinner label="Verificando correo" />
          <span>Estamos verificando tu correo.</span>
        </div>
      ) : null}

      {state === 'success' ? (
        <>
          <AuthStatusMessage>Tu correo quedó verificado.</AuthStatusMessage>
          <Button fullWidth onClick={() => navigate(user ? '/feed' : '/login')}>
            {user ? 'Ir al inicio' : 'Iniciar sesión'}
          </Button>
        </>
      ) : null}

      {state !== 'verifying' && state !== 'success' ? (
        <>
          <div role="alert" className="rounded-xl border border-border/70 bg-card px-3 py-3 text-sm">
            <p className="font-medium text-foreground">{COPY[state].title}</p>
            <p className="mt-1 text-muted-foreground">{COPY[state].body}</p>
          </div>
          <ResendVerificationForm initialEmail={user?.email ?? ''} />
        </>
      ) : null}
    </AuthScaffold>
  );
}
