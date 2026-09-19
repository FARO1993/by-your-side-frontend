import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ear, Heart, ShieldCheck } from 'lucide-react';
import {
  cancelAvailability,
  getMyAvailability,
  listAvailable,
  setAvailability,
} from '../api/availability';
import { getOrCreateConversation, sendMessage } from '../api/chat';
import type { Availability, CompanionIntent } from '../api/types';
import Avatar from '../components/Avatar';
import { Button, Card, EmptyState, SectionTitle, Spinner } from '../components/byourside/ui';

const intents: { value: CompanionIntent; label: string }[] = [
  { value: 'TALK', label: 'Hablar' },
  { value: 'DISTRACTION', label: 'Jugar / distraerme' },
  { value: 'WATCH_TOGETHER', label: 'Ver algo juntos' },
  { value: 'MUSIC', label: 'Escuchar música' },
  { value: 'LAUGH', label: 'Reírnos un rato' },
  { value: 'JUST_COMPANY', label: 'Solo estar acompañado' },
];

export default function CompanionModePage() {
  const navigate = useNavigate();
  const [mine, setMine] = useState<Availability | null>(null);
  const [selected, setSelected] = useState<CompanionIntent | null>(null);
  const [available, setAvailable] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [sendError, setSendError] = useState<Record<string, string>>({});

  async function sendWithYou(item: Availability) {
    setSending((prev) => ({ ...prev, [item.id]: true }));
    setSendError((prev) => ({ ...prev, [item.id]: '' }));
    try {
      const conversation = await getOrCreateConversation(item.user.id);
      await sendMessage(conversation.id, 'Estoy con vos.');
      setSent((prev) => ({ ...prev, [item.id]: true }));
    } catch {
      setSendError((prev) => ({ ...prev, [item.id]: 'No se pudo enviar. Probá de nuevo.' }));
    } finally {
      setSending((prev) => ({ ...prev, [item.id]: false }));
    }
  }

  useEffect(() => {
    getMyAvailability().then(setMine).finally(() => setLoading(false));
  }, []);

  async function toggle(intent?: CompanionIntent) {
    if (mine) {
      await cancelAvailability();
      setMine(null);
      return;
    }
    if (intent) setMine(await setAvailability(intent));
  }

  async function search(intent: CompanionIntent) {
    setSelected(intent);
    setLoadingList(true);
    try {
      setAvailable(await listAvailable(intent));
    } finally {
      setLoadingList(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-listening-soft via-card to-presence-soft p-6 sm:p-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-card text-listening-strong">
          <Heart className="size-6" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl">Modo compañía</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Declarate disponible para acompañar, o buscá quién está disponible ahora. Las
          disponibilidades duran 6 horas.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {mine ? (
            <Button variant="outline" onClick={() => toggle()}>
              Pausar
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {intents.map((intent) => (
                <Button key={intent.value} size="sm" variant="listening" onClick={() => toggle(intent.value)}>
                  Activar · {intent.label}
                </Button>
              ))}
            </div>
          )}
          <p className="inline-flex items-center gap-2 text-sm" aria-live="polite">
            <span className={`size-2 rounded-full ${mine ? 'bg-listening' : 'bg-muted-foreground/40'}`} />
            {mine ? 'Estás disponible' : 'En pausa'}
          </p>
        </div>
      </Card>

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

      <section>
        <SectionTitle>Buscando compañía ahora</SectionTitle>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {intents.map((intent) => (
            <Button
              key={intent.value}
              size="sm"
              variant={selected === intent.value ? 'listening' : 'outline'}
              onClick={() => search(intent.value)}
            >
              {intent.label}
            </Button>
          ))}
        </div>
        {selected && loadingList ? <div className="mt-4"><Spinner /></div> : null}
        {selected && !loadingList && available.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<Ear className="size-6" />}
            title="Nadie disponible para esto ahora"
            description="Probá con otra opción, o volvé más tarde."
          />
        ) : null}
        <div className="mt-4 space-y-3">
          {available.map((item) => {
            const name = item.user.displayName || item.user.username;
            return (
              <Card key={item.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar avatarUrl={item.user.avatarUrl} name={name} size="md" />
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-sm text-muted-foreground">
                        {intents.find((intent) => intent.value === item.intent)?.label}
                      </p>
                    </div>
                  </div>
                  {sent[item.id] ? (
                    <p className="rounded-xl bg-listening-soft/50 px-3 py-2 text-sm text-listening-strong" role="status">
                      Le hiciste saber que estás.
                    </p>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="soft"
                          loading={Boolean(sending[item.id])}
                          onClick={() => sendWithYou(item)}
                        >
                          Estoy con vos
                        </Button>
                        <Button
                          size="sm"
                          variant="listening"
                          onClick={async () => {
                            const conversation = await getOrCreateConversation(item.user.id);
                            navigate(`/messages/${conversation.id}`);
                          }}
                        >
                          Ofrecer escucha
                        </Button>
                      </div>
                      {sendError[item.id] ? (
                        <p role="alert" className="text-xs font-medium text-destructive">
                          {sendError[item.id]}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Guideline({ icon, text }: { icon: ReactNode; text: ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-listening-strong shadow-soft">
        {icon}
      </span>
      <p className="text-sm leading-relaxed text-foreground/90">{text}</p>
    </div>
  );
}
