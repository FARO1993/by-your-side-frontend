import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Ban, DoorOpen, LifeBuoy, Moon, PenLine } from 'lucide-react';
import { cn } from '../../lib/cn';
import { CommunityGuidelinesList } from '../CommunityGuidelinesList';
import { Logo } from '../byourside/logo';
import { Button } from '../byourside/ui';

const STEPS = ['Qué es ByYourSide', 'Cómo nos cuidamos acá', 'Herramientas para cuidarte'] as const;

/**
 * Onboarding de 3 pasos con las normas de la comunidad.
 * Lo muestra WelcomeGate una vez por persona (y por versión de las normas).
 * Nunca tapa /help: el primer paso ofrece ir a "Ayuda ahora" y el gate no se
 * muestra en esa ruta.
 */
export function CommunityOnboarding({ onAccept }: { onAccept: () => void }) {
  const [step, setStep] = useState(0);
  const headingId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const isLast = step === STEPS.length - 1;

  // Al cambiar de paso, el foco va al título: el lector de pantalla lo lee.
  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-background">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pt-8 sm:pt-14"
      >
        <div className="flex items-center justify-between">
          <Logo wordmark />
          <p className="text-xs text-muted-foreground">
            Paso {step + 1} de {STEPS.length}
          </p>
        </div>

        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {STEPS.map((label, index) => (
            <span
              key={label}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-300',
                index <= step ? 'bg-presence' : 'bg-muted',
              )}
            />
          ))}
        </div>

        <div key={step} className="mt-8 flex-1 animate-soft-rise">
          {/* El foco va al título solo para lectores de pantalla: sin borde visible
              (la regla global de :focus-visible está fuera de las capas de Tailwind). */}
          <h1 ref={heading} id={headingId} tabIndex={-1} style={{ outline: 'none' }} className="font-serif text-3xl text-balance">
            {STEPS[step]}
          </h1>

          {step === 0 ? <WhatItIs /> : null}
          {step === 1 ? (
            <>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Estas normas existen para que este sea un lugar seguro para todas las personas.
              </p>
              <CommunityGuidelinesList className="mt-6 space-y-4" />
            </>
          ) : null}
          {step === 2 ? <CareTools /> : null}
        </div>

        <div className="sticky bottom-0 -mx-5 mt-8 flex items-center justify-between gap-3 border-t border-border/60 bg-background/95 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={() => setStep((current) => current - 1)}>
              Atrás
            </Button>
          ) : (
            <span />
          )}
          {isLast ? (
            <Button type="button" onClick={onAccept}>
              Me sumo con cuidado
            </Button>
          ) : (
            <Button type="button" onClick={() => setStep((current) => current + 1)}>
              Siguiente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function WhatItIs() {
  return (
    <div className="mt-4 space-y-4 text-[0.975rem] leading-relaxed text-foreground/90">
      <p>
        Un lugar para contar cómo estás y acompañarnos entre personas que también atraviesan cosas. Sin apuro y sin
        tener que estar bien.
      </p>
      <div className="rounded-2xl bg-muted/60 p-4 text-sm">
        <p className="font-medium text-foreground">Lo que no es</p>
        <p className="mt-1 text-muted-foreground">
          Quienes acompañan acá son personas de la comunidad, no profesionales. ByYourSide no reemplaza una terapia ni
          un servicio de emergencias.
        </p>
      </div>
      <div className="rounded-2xl bg-listening-soft p-4 text-sm">
        <p className="flex items-start gap-2">
          <LifeBuoy className="mt-0.5 size-4 shrink-0 text-listening-strong" aria-hidden="true" />
          <span>
            Si estás en peligro ahora, llamá al <strong>911</strong> o al <strong>135</strong> (gratuito y
            confidencial).
          </span>
        </p>
        <Link to="/help" className="mt-2 inline-block pl-6 font-medium text-listening-strong underline-offset-2 hover:underline">
          Ver líneas de ayuda
        </Link>
      </div>
    </div>
  );
}

function CareTools() {
  return (
    <div className="mt-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Cuidarte también es poner límites. Siempre vas a tener esto a mano:
      </p>
      <ul className="mt-6 space-y-4">
        <Tool icon={<LifeBuoy className="size-4" />} title="Ayuda ahora">
          El salvavidas de arriba lleva a líneas de ayuda y a un ejercicio para respirar un minuto.
        </Tool>
        <Tool icon={<DoorOpen className="size-4" />} title="Necesito irme">
          En cualquier chat podés despedirte con un mensaje listo, o salir sin decir nada.
        </Tool>
        <Tool icon={<Ban className="size-4" />} title="Silenciar, bloquear y reportar">
          Desde el menú ⋯ de un chat o desde el perfil. La otra persona no recibe ningún aviso.
        </Tool>
        <Tool icon={<PenLine className="size-4" />} title="Lo que escribís es tuyo">
          Los borradores quedan solo en tu dispositivo y se borran al cerrar sesión.
        </Tool>
        <Tool icon={<Moon className="size-4" />} title="Modo nocturno">
          Para cuando abrís la app de noche y la pantalla clara molesta.
        </Tool>
      </ul>
    </div>
  );
}

function Tool({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-presence-soft text-presence-strong"
      >
        {icon}
      </span>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}
