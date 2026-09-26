import { useId, useState } from 'react';
import type { CompanionIntent } from '../../api/types';
import { cn } from '../../lib/cn';
import {
  COMPANY_NEEDS,
  OFFER_WAYS,
  intentForCompanyNeed,
  intentForOffer,
  type CompanyNeed,
  type OfferWay,
  type PulseMode,
} from './check-in';
import './home-presence.css';

const chipClass =
  'min-h-11 rounded-full border border-border bg-background px-3 py-1.5 text-left text-sm leading-snug text-foreground/80';

export function HomePresencePulse({
  onSeekCompany,
  onDeclareAvailability,
  onReset,
  availabilityPending = false,
  availabilityMessage = null,
  availabilityError = null,
}: {
  onSeekCompany: (intent: CompanionIntent | null) => void;
  onDeclareAvailability: (intent: CompanionIntent | null) => void;
  onReset?: () => void;
  availabilityPending?: boolean;
  availabilityMessage?: string | null;
  availabilityError?: string | null;
}) {
  const [mode, setMode] = useState<PulseMode>('idle');

  function change() {
    setMode('idle');
    onReset?.();
  }

  return (
    <section className="home-pulse-anchor rounded-2xl bg-card px-4 py-3 shadow-soft sm:px-5">
      <div key={mode} className="home-checkin-swap">
        {mode === 'seeking' ? (
          <ChoiceStep
            context="Necesito compañía"
            title="¿Cómo querés que estemos con vos?"
            options={COMPANY_NEEDS}
            tone="presence"
            cta="Encontrar compañía"
            onChange={change}
            onConfirm={(id) => onSeekCompany(intentForCompanyNeed(id))}
          />
        ) : null}
        {mode === 'available' ? (
          <ChoiceStep
            context="Estoy disponible"
            title="¿Cómo podés estar hoy?"
            options={OFFER_WAYS}
            tone="listening"
            cta="Confirmar disponibilidad"
            pending={availabilityPending}
            message={availabilityMessage}
            error={availabilityError}
            onChange={change}
            onConfirm={(id) => onDeclareAvailability(intentForOffer(id))}
          />
        ) : null}
        {mode === 'idle' ? (
          <div>
            <PulseField />
            <p className="mx-auto max-w-xs text-center text-sm text-foreground">Hay personas por acá</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setMode('seeking')}
                className="min-h-11 min-w-[9.5rem] flex-1 rounded-full bg-presence-soft px-3 text-sm font-semibold text-presence-strong sm:flex-none sm:px-4"
              >
                Necesito compañía
              </button>
              <button
                type="button"
                onClick={() => setMode('available')}
                className="min-h-11 min-w-[9.5rem] flex-1 rounded-full bg-listening-soft px-3 text-sm font-semibold text-listening-strong sm:flex-none sm:px-4"
              >
                Estoy disponible
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function PulseField() {
  return (
    <svg viewBox="0 0 360 92" className="home-pulse-field mx-auto h-16 w-full max-w-md" aria-hidden="true">
      <g className="home-pulse-dot home-pulse-drift-a">
        <circle cx="36" cy="34" r="7" fill="none" stroke="var(--presence)" strokeWidth="1.7" />
      </g>
      <g className="home-pulse-dot home-pulse-drift-b">
        <circle cx="92" cy="62" r="5" fill="none" stroke="var(--listening)" strokeWidth="1.6" />
      </g>
      <g className="home-pulse-dot home-pulse-meet-left">
        <circle cx="148" cy="30" r="7" fill="none" stroke="var(--presence)" strokeWidth="1.7" />
      </g>
      <g className="home-pulse-dot home-pulse-meet-right">
        <circle cx="176" cy="44" r="7" fill="none" stroke="var(--listening)" strokeWidth="1.7" />
      </g>
      <g className="home-pulse-dot home-pulse-drift-c">
        <circle cx="214" cy="66" r="4.5" fill="var(--presence-soft)" stroke="var(--presence)" strokeWidth="1.4" />
      </g>
      <g className="home-pulse-dot home-pulse-drift-a">
        <circle cx="248" cy="28" r="6" fill="none" stroke="var(--listening)" strokeWidth="1.6" />
      </g>
      <g className="home-pulse-dot home-pulse-meet-left-late">
        <circle cx="292" cy="48" r="6" fill="none" stroke="var(--presence)" strokeWidth="1.6" />
      </g>
      <g className="home-pulse-dot home-pulse-meet-right-late">
        <circle cx="318" cy="36" r="6" fill="none" stroke="var(--listening)" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

function ChoiceStep<T extends CompanyNeed | OfferWay>({
  context,
  title,
  options,
  tone,
  cta,
  pending = false,
  message = null,
  error = null,
  onChange,
  onConfirm,
}: {
  context: string;
  title: string;
  options: { id: T; label: string }[];
  tone: 'presence' | 'listening';
  cta: string;
  pending?: boolean;
  message?: string | null;
  error?: string | null;
  onChange: () => void;
  onConfirm: (id: T) => void;
}) {
  const headingId = useId();
  const [selected, setSelected] = useState<T | null>(null);
  const selectedClass =
    tone === 'presence'
      ? 'border-transparent bg-presence-soft text-presence-strong'
      : 'border-transparent bg-listening-soft text-listening-strong';

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-foreground">{context}</p>
        <button type="button" onClick={onChange} className="min-h-11 shrink-0 px-2 text-sm text-muted-foreground hover:text-foreground">
          Cambiar
        </button>
      </div>
      <h2 id={headingId} className="mt-1 font-serif text-xl text-balance sm:text-2xl">
        {title}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-labelledby={headingId}>
        {options.map((option) => {
          const active = selected === option.id;
          return (
            <label
              key={option.id}
              className={cn(
                chipClass,
                'cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
                active ? selectedClass : undefined,
              )}
            >
              <input
                type="radio"
                name={headingId}
                className="sr-only"
                checked={active}
                onChange={() => setSelected(option.id)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={selected === null || pending}
          onClick={() => {
            if (selected) onConfirm(selected);
          }}
          className={cn(
            'min-h-11 w-full rounded-full px-4 text-sm font-semibold disabled:opacity-50 sm:w-auto',
            tone === 'presence' ? 'bg-presence text-presence-foreground' : 'bg-listening text-listening-foreground',
          )}
        >
          {pending ? 'Guardando…' : cta}
        </button>
        {message ? (
          <p role="status" className="text-sm text-listening-strong">
            {message}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
