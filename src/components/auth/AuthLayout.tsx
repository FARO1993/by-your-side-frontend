import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { AuthLogoMotion } from './AuthLogoMotion';
import './auth-screen.css';

const COPY = {
  login: {
    title: 'No tenés que atravesarlo solo.',
    body: 'Un espacio tranquilo para volver, compartir cómo estás y encontrar a alguien que te acompañe.',
  },
  register: {
    title: 'Hay lugar para vos acá.',
    body: 'Llegá como sos. Escuchá cuando puedas y pedí compañía cuando la necesites.',
  },
  forgot: {
    title: 'No tenés que resolverlo solo.',
    body: 'Te ayudamos a volver a entrar. Si hay una cuenta asociada a tu correo, te enviaremos los próximos pasos.',
  },
  reset: {
    title: 'Volvé a entrar con calma.',
    body: 'Elegí una contraseña nueva. Cuando esté lista, vas a poder ingresar de nuevo.',
  },
  verify: {
    title: 'Este espacio es tuyo.',
    body: 'Confirmamos tu correo para que puedas volver a entrar, sin apuros.',
  },
} as const;

export function AuthLayout({
  variant,
  title,
  subtitle,
  leaving = false,
  children,
}: {
  variant: keyof typeof COPY;
  title: string;
  subtitle: string;
  leaving?: boolean;
  children: ReactNode;
}) {
  const emotional = COPY[variant];

  return (
    <div className="auth-screen">
      <div className="auth-brand">
        <div className="auth-brand-column">
          <AuthLogoMotion />
          <p className="auth-wordmark font-serif text-xl font-medium tracking-tight text-foreground lg:text-2xl">
            ByYourSide
          </p>
          <div className="auth-emotional">
            <h2 className="mt-8 font-serif text-3xl leading-snug text-pretty xl:text-4xl">{emotional.title}</h2>
            <p className="mt-3 max-w-sm text-base leading-relaxed text-foreground/80">{emotional.body}</p>
          </div>
        </div>
      </div>
      <div className={cn('auth-panel', leaving && 'is-success')}>
        <div className="auth-panel-inner">
          <h1 className="font-serif text-2xl text-balance sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
