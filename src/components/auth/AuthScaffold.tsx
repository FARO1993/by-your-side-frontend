import type { ReactNode } from 'react';
import { Logo } from '../byourside/logo';
import { PresenceGlyph } from '../byourside/ui';

function WelcomePanel() {
  return (
    <div className="hidden flex-col justify-between bg-gradient-to-br from-presence-soft via-cream to-listening-soft p-10 lg:flex">
      <Logo wordmark />
      <div>
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-card/70 text-presence-strong">
          <PresenceGlyph className="h-4 w-6" />
        </div>
        <h2 className="font-serif text-3xl text-pretty">No tenés que atravesarlo solo.</h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-foreground/80">
          ByYourSide es un lugar tranquilo para compartir cómo estás y encontrar a alguien que te
          acompañe. Sin apuros, sin juicios. Solo presencia.
        </p>
      </div>
      <div className="flex gap-6 text-sm">
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-presence" /> Presencia
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-listening" /> Escucha
        </span>
      </div>
    </div>
  );
}

export function AuthScaffold({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto grid min-h-dvh max-w-5xl grid-cols-1 lg:grid-cols-2">
        <WelcomePanel />
        <div className="flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <Logo wordmark />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-6 space-y-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthStatusMessage({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="rounded-xl bg-listening-soft px-3 py-2 text-sm text-listening-strong">
      {children}
    </p>
  );
}
