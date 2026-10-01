import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ear, Heart, ShieldCheck } from 'lucide-react';
import { cancelNeed, cancelOffering, getMyNeed, getMyOffering, listCompatibleOfferings, setNeed, setOffering } from '../api/companion';
import { getOrCreateConversation } from '../api/chat';
import type { CompanionCandidate, CompanionNeed, CompanionOffering, NeedType, OfferingType } from '../api/types';
import Avatar from '../components/Avatar';
import { Button, Card, EmptyState, SectionTitle } from '../components/byourside/ui';
import {
  CANDIDATE_OFFERING_LABEL,
  NEED_LABEL,
  OFFERING_SELF_LABEL,
  companionFailure,
  formatCompanionUntil,
} from '../lib/companion';

const NEED_TYPES: NeedType[] = ['LISTEN_TO_ME', 'TALK', 'GET_OPINION', 'DISTRACTION', 'JUST_COMPANY'];
const OFFERING_TYPES: OfferingType[] = ['LISTEN', 'TALK', 'DISTRACT'];

export default function CompanionModePage() {
  const navigate = useNavigate();
  const [need, setNeedState] = useState<CompanionNeed | null | undefined>(undefined);
  const [offering, setOfferingState] = useState<CompanionOffering | null | undefined>(undefined);
  const [candidates, setCandidates] = useState<CompanionCandidate[] | null>(null);
  const [needError, setNeedError] = useState<string | null>(null);
  const [offeringError, setOfferingError] = useState<string | null>(null);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const [editingNeed, setEditingNeed] = useState(false);
  const [editingOffering, setEditingOffering] = useState(false);
  const [needPending, setNeedPending] = useState(false);
  const [offeringPending, setOfferingPending] = useState(false);
  const [openingUserId, setOpeningUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyNeed()
      .then((value) => {
        if (cancelled) return;
        setNeedState(value);
        if (!value) setCandidates([]);
      })
      .catch(() => {
        if (!cancelled) setNeedError('No pudimos ver tu búsqueda de compañía.');
      });
    getMyOffering()
      .then((value) => {
        if (!cancelled) setOfferingState(value);
      })
      .catch(() => {
        if (!cancelled) setOfferingError('No pudimos ver tu disponibilidad.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!need) return undefined;
    let cancelled = false;
    listCompatibleOfferings()
      .then((items) => {
        if (!cancelled) {
          setCandidates(items);
          setCandidatesError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setCandidatesError('No pudimos buscar a alguien disponible ahora.');
      });
    return () => {
      cancelled = true;
    };
  }, [need]);

  async function chooseNeed(type: NeedType) {
    const previous = need ?? null;
    setNeedPending(true);
    setNeedError(null);
    try {
      const saved = await setNeed(type);
      setNeedState(saved);
      setCandidates(null);
      setEditingNeed(false);
    } catch (error) {
      setNeedState(previous);
      setEditingNeed(false);
      setNeedError(companionFailure(error, 'No pudimos guardar lo que necesitás.'));
    } finally {
      setNeedPending(false);
    }
  }

  async function clearNeed() {
    const previous = need ?? null;
    setNeedPending(true);
    setNeedError(null);
    try {
      await cancelNeed();
      setNeedState(null);
      setCandidates([]);
      setEditingNeed(false);
    } catch (error) {
      setNeedState(previous);
      setNeedError(companionFailure(error, 'No pudimos cancelar la búsqueda.'));
    } finally {
      setNeedPending(false);
    }
  }

  async function chooseOffering(type: OfferingType) {
    const previous = offering ?? null;
    setOfferingPending(true);
    setOfferingError(null);
    try {
      const saved = await setOffering(type);
      setOfferingState(saved);
      setEditingOffering(false);
    } catch (error) {
      setOfferingState(previous);
      setEditingOffering(false);
      setOfferingError(companionFailure(error, 'No pudimos guardar tu disponibilidad.'));
    } finally {
      setOfferingPending(false);
    }
  }

  async function clearOffering() {
    const previous = offering ?? null;
    setOfferingPending(true);
    setOfferingError(null);
    try {
      await cancelOffering();
      setOfferingState(null);
      setEditingOffering(false);
    } catch (error) {
      setOfferingState(previous);
      setOfferingError(companionFailure(error, 'No pudimos cancelar tu disponibilidad.'));
    } finally {
      setOfferingPending(false);
    }
  }

  async function writeTo(candidate: CompanionCandidate) {
    setOpeningUserId(candidate.user.id);
    setOpenError(null);
    try {
      const conversation = await getOrCreateConversation(candidate.user.id);
      navigate(`/messages/${conversation.id}`);
    } catch {
      setOpenError('Ahora no se puede abrir la conversación.');
      setOpeningUserId(null);
    }
  }

  const needUntil = need ? formatCompanionUntil(need.expiresAt) : null;
  const offeringUntil = offering ? formatCompanionUntil(offering.expiresAt) : null;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-listening-soft via-card to-presence-soft p-6 sm:p-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-card text-listening-strong">
          <Heart className="size-6" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl">Modo compañía</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Podés pedir compañía y, al mismo tiempo, estar disponible para alguien más. Cada cosa dura un rato y se puede cambiar.
        </p>
      </Card>

      <section aria-labelledby="companion-need-title">
        <SectionTitle id="companion-need-title">Necesito compañía</SectionTitle>
        <Card className="mt-3 p-4 sm:p-5">
          {need === undefined ? (
            <div className="h-16 motion-safe:animate-pulse rounded-2xl bg-muted/40" />
          ) : need && !editingNeed ? (
            <div>
              <p className="font-medium text-foreground">Estás buscando compañía</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {NEED_LABEL[need.type]}
                {needUntil ? ` · hasta ${needUntil}` : ''}
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button size="sm" variant="outline" onClick={() => setEditingNeed(true)}>
                  Cambiar
                </Button>
                <Button size="sm" variant="ghost" disabled={needPending} onClick={() => void clearNeed()}>
                  Cancelar búsqueda
                </Button>
              </div>
            </div>
          ) : (
            <ChoiceRow
              label="¿Cómo querés que estemos con vos?"
              options={NEED_TYPES.map((type) => ({ id: type, label: NEED_LABEL[type] }))}
              pending={needPending}
              tone="presence"
              onChoose={(type) => void chooseNeed(type)}
            />
          )}
          {needError ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {needError}
            </p>
          ) : null}
        </Card>
      </section>

      <section aria-labelledby="companion-offering-title">
        <SectionTitle id="companion-offering-title">Estoy disponible</SectionTitle>
        <Card className="mt-3 p-4 sm:p-5">
          {offering === undefined ? (
            <div className="h-16 motion-safe:animate-pulse rounded-2xl bg-muted/40" />
          ) : offering && !editingOffering ? (
            <div>
              <p className="font-medium text-foreground">Estás disponible</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {OFFERING_SELF_LABEL[offering.type]}
                {offeringUntil ? ` · hasta ${offeringUntil}` : ''}
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button size="sm" variant="outline" onClick={() => setEditingOffering(true)}>
                  Cambiar
                </Button>
                <Button size="sm" variant="ghost" disabled={offeringPending} onClick={() => void clearOffering()}>
                  Cancelar disponibilidad
                </Button>
              </div>
            </div>
          ) : (
            <ChoiceRow
              label="¿Cómo podés estar ahora?"
              options={OFFERING_TYPES.map((type) => ({ id: type, label: OFFERING_SELF_LABEL[type] }))}
              pending={offeringPending}
              tone="listening"
              onChoose={(type) => void chooseOffering(type)}
            />
          )}
          {offeringError ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {offeringError}
            </p>
          ) : null}
        </Card>
      </section>

      {need ? (
        <section aria-labelledby="companion-candidates-title">
          <SectionTitle id="companion-candidates-title">Quienes pueden acompañarte</SectionTitle>
          {candidates === null && !candidatesError ? (
            <div className="mt-3 h-24 motion-safe:animate-pulse rounded-2xl bg-muted/40" />
          ) : null}
          {candidatesError ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {candidatesError}
            </p>
          ) : null}
          {candidates && candidates.length === 0 ? (
            <EmptyState
              className="mt-3"
              icon={<Ear className="size-6" />}
              title="Ahora mismo no encontramos a alguien disponible de esa forma."
              description="Podés cambiar lo que necesitás, cancelar la búsqueda o volver más tarde."
            />
          ) : null}
          {openError ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {openError}
            </p>
          ) : null}
          <div className="mt-3 grid gap-3">
            {candidates?.map((candidate) => (
              <Card key={candidate.user.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar avatarUrl={candidate.user.avatarUrl} name={candidate.user.displayName ?? candidate.user.username} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{candidate.user.displayName ?? candidate.user.username}</p>
                    <p className="text-sm text-muted-foreground">{CANDIDATE_OFFERING_LABEL[candidate.offeringType]}</p>
                  </div>
                </div>
                <Button
                  className="w-full sm:w-auto"
                  disabled={openingUserId === candidate.user.id}
                  onClick={() => void writeTo(candidate)}
                >
                  Escribirle
                </Button>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <SectionTitle>Cómo acompañar bien</SectionTitle>
        <Card className="mt-3 divide-y divide-border/60">
          <Guideline icon={<Ear className="size-4" />} text="Escuchá sin apurarte a resolver. A veces alcanza con estar." />
          <Guideline icon={<Heart className="size-4" />} text="Ofrecé presencia concreta: un mensaje, un rato juntos, un oído." />
          <Guideline
            icon={<ShieldCheck className="size-4" />}
            text={
              <>
                Si hay crisis, priorizá ayuda profesional.{' '}
                <button type="button" className="text-listening-strong underline" onClick={() => navigate('/help')}>
                  Ver líneas de ayuda
                </button>
                .
              </>
            }
          />
        </Card>
      </section>
    </div>
  );
}

function ChoiceRow<T extends string>({
  label,
  options,
  pending,
  tone,
  onChoose,
}: {
  label: string;
  options: { id: T; label: string }[];
  pending: boolean;
  tone: 'presence' | 'listening';
  onChoose: (id: T) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:flex lg:flex-wrap">
        {options.map((option) => (
          <Button
            key={option.id}
            size="sm"
            variant={tone === 'presence' ? 'presence' : 'listening'}
            className="h-auto min-h-11 whitespace-normal rounded-2xl px-3 py-2 text-center leading-tight lg:rounded-full"
            disabled={pending}
            onClick={() => onChoose(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function Guideline({ icon, text }: { icon: ReactNode; text: ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 text-sm leading-relaxed text-foreground">
      <span className="mt-0.5 text-listening-strong">{icon}</span>
      <p>{text}</p>
    </div>
  );
}
