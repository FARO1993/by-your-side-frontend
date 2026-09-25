import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Button } from './ui';
import { cn } from '../../lib/cn';
import './animated-welcome.css';

export type AnimatedWelcomeVariant = 'new-user' | 'returning-user';

type AnimatedWelcomeProps = {
  variant: AnimatedWelcomeVariant;
  userName: string;
  onComplete: () => void;
};

const NEW_USER_LINE_DELAYS = [1500, 2550, 3600, 4650, 5450];
const RETURNING_FADE_MS = 300;
const REDUCED_FADE_MS = 160;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function displayName(userName: string) {
  const name = userName.trim();
  return name.length > 0 ? name : null;
}

function Reveal({
  shown,
  className,
  children,
}: {
  shown: boolean;
  className?: string;
  children: ReactNode;
}) {
  return <div className={shown ? cn('bys-rise', className) : 'sr-only'}>{children}</div>;
}

export function AnimatedWelcome({ variant, userName, onComplete }: AnimatedWelcomeProps) {
  const headingId = useId();
  const onCompleteRef = useRef(onComplete);
  const finishedRef = useRef(false);
  const [line, setLine] = useState(() => {
    if (!prefersReducedMotion()) return 0;
    return variant === 'new-user' ? NEW_USER_LINE_DELAYS.length : 2;
  });
  const [leaving, setLeaving] = useState(false);
  const name = displayName(userName);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    if (variant === 'new-user') {
      const timers = NEW_USER_LINE_DELAYS.map((delay, index) =>
        window.setTimeout(() => setLine(index + 1), delay),
      );
      return () => {
        timers.forEach((timer) => window.clearTimeout(timer));
      };
    }

    const timers = [
      window.setTimeout(() => setLine(1), 750),
      window.setTimeout(() => setLine(2), 900),
      window.setTimeout(() => setLeaving(true), 1700),
    ];
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [variant]);

  useEffect(() => {
    if (variant !== 'returning-user' || !prefersReducedMotion()) return undefined;
    const timer = window.setTimeout(() => setLeaving(true), 280);
    return () => window.clearTimeout(timer);
  }, [variant]);

  useEffect(() => {
    if (!leaving || finishedRef.current) return undefined;
    const fadeMs = prefersReducedMotion() ? REDUCED_FADE_MS : RETURNING_FADE_MS;
    const timer = window.setTimeout(() => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onCompleteRef.current();
    }, fadeMs);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  function handleStart() {
    if (finishedRef.current || leaving) return;
    setLeaving(true);
  }

  const welcomeTitle = name ? `Bienvenido a ByYourSide, ${name}.` : 'Bienvenido a ByYourSide.';
  const returnTitle = name ? `Hola de nuevo, ${name}.` : 'Hola de nuevo.';

  return (
    <section
      className={cn(
        'bys-screen fixed inset-0 z-40 overflow-y-auto bg-gradient-to-b from-presence-soft via-background to-listening-soft',
        leaving && 'is-leaving',
      )}
      data-variant={variant}
      aria-labelledby={headingId}
    >
      <div className="flex min-h-full flex-col">
        <div className="flex min-h-[46vh] shrink-0 flex-col items-center justify-end px-5 pt-[max(2.5rem,env(safe-area-inset-top))] [@media(max-height:760px)]:min-h-[34vh]">
          <LogoMark />
          <p className="bys-wordmark mt-4 font-serif text-2xl font-semibold tracking-tight text-foreground sm:mt-5 sm:text-3xl">
            ByYourSide
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center px-5 pt-6 pb-[max(3rem,env(safe-area-inset-bottom))] text-center sm:max-w-md sm:pt-8 [@media(max-height:760px)]:pt-4 [@media(max-height:760px)]:pb-6">
          {variant === 'new-user' ? (
            <>
              <Reveal shown={line >= 1}>
                <h1
                  id={headingId}
                  className="font-serif text-[1.65rem] leading-snug text-balance text-foreground sm:text-3xl"
                >
                  {welcomeTitle}
                </h1>
              </Reveal>
              <Reveal shown={line >= 2} className="mt-5 sm:mt-6">
                <p className="font-serif text-xl leading-snug text-balance text-foreground/85 sm:text-2xl">
                  Este es un espacio para acompañarnos.
                </p>
              </Reveal>
              <Reveal shown={line >= 3} className="mt-6 sm:mt-7">
                <p className="text-base leading-relaxed text-pretty text-foreground/80 sm:text-lg">
                  A veces vas a necesitar que alguien esté.
                </p>
              </Reveal>
              <Reveal shown={line >= 4} className="mt-3">
                <p className="text-base leading-relaxed text-pretty text-foreground/80 sm:text-lg">
                  Otras veces vos vas a poder estar para alguien.
                </p>
              </Reveal>
              <Reveal shown={line >= 5} className="mt-8 sm:mt-10">
                <Button size="lg" onClick={handleStart} tabIndex={line >= 5 ? 0 : -1}>
                  Empecemos 💜
                </Button>
              </Reveal>
            </>
          ) : (
            <>
              <Reveal shown={line >= 1}>
                <h1
                  id={headingId}
                  className="font-serif text-[1.65rem] leading-snug text-balance text-foreground sm:text-3xl"
                >
                  {returnTitle}
                </h1>
              </Reveal>
              <Reveal shown={line >= 2} className="mt-3 sm:mt-4">
                <p className="font-serif text-xl text-foreground/85 sm:text-2xl">Estamos acá. 💜</p>
              </Reveal>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function LogoMark() {
  return (
    <svg className="bys-mark" viewBox="0 0 48 48" overflow="visible" aria-hidden="true">
      <g className="bys-figure bys-figure-presence">
        <circle cx="18" cy="24" r="14" fill="none" stroke="#E8876F" strokeWidth="3" />
      </g>
      <g className="bys-figure bys-figure-listening">
        <circle cx="30" cy="24" r="14" fill="none" stroke="#4F9C8D" strokeWidth="3" />
      </g>
    </svg>
  );
}
