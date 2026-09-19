import { useState, type ReactNode } from 'react';
import Logo from './Logo';
import { pickRandomSupportMessage } from '../lib/supportMessages';

export default function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  const [message] = useState(pickRandomSupportMessage);

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-paper">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 animate-aurora-a rounded-full bg-horizon/[0.06] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 animate-aurora-b rounded-full bg-calm/[0.06] blur-3xl"
      />

      {/* Panel de marca: solo en desktop */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center px-12 lg:flex">
        <Logo className="h-20 w-20" />
        <h1 className="mt-6 text-center font-serif text-4xl font-semibold text-ink">ByYourSide</h1>
        <p className="mt-2 text-center text-dusk">No tenés que atravesarlo solo/a</p>
        <p className="mt-10 max-w-sm text-center italic text-ink/70">"{message}"</p>
      </div>

      {/* Formulario */}
      <div className="relative flex w-full items-center justify-center px-4 lg:w-1/2">
        <div className="w-full max-w-sm">
          <h1 className="mb-8 text-center font-serif text-3xl font-semibold text-ink lg:hidden">
            {title}
          </h1>
          {children}
        </div>
      </div>
    </div>
  );
}