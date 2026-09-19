import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  setAvailability,
  cancelAvailability,
  getMyAvailability,
  listAvailable,
} from '../api/availability';
import { getOrCreateConversation } from '../api/chat';
import type { Availability, CompanionIntent } from '../api/types';
import Avatar from '../components/Avatar';
import {
  ChatIcon,
  GameIcon,
  FilmIcon,
  MusicIcon,
  LaughIcon,
  UsersIcon,
} from '../components/Icons';

const intents: { value: CompanionIntent; label: string; Icon: typeof ChatIcon }[] = [
  { value: 'TALK', label: 'Hablar', Icon: ChatIcon },
  { value: 'DISTRACTION', label: 'Jugar / distraerme', Icon: GameIcon },
  { value: 'WATCH_TOGETHER', label: 'Ver algo juntos', Icon: FilmIcon },
  { value: 'MUSIC', label: 'Escuchar música', Icon: MusicIcon },
  { value: 'LAUGH', label: 'Reírnos un rato', Icon: LaughIcon },
  { value: 'JUST_COMPANY', label: 'Solo estar acompañado', Icon: UsersIcon },
];

export default function CompanionModePage() {
  const navigate = useNavigate();
  const [myAvailability, setMyAvailability] = useState<Availability | null>(null);
  const [selectedIntent, setSelectedIntent] = useState<CompanionIntent | null>(null);
  const [available, setAvailable] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    getMyAvailability()
      .then(setMyAvailability)
      .finally(() => setLoading(false));
  }, []);

  async function handleActivate(intent: CompanionIntent) {
    const result = await setAvailability(intent);
    setMyAvailability(result);
  }

  async function handleCancel() {
    await cancelAvailability();
    setMyAvailability(null);
  }

  async function handleSearch(intent: CompanionIntent) {
    setSelectedIntent(intent);
    setLoadingList(true);
    try {
      const results = await listAvailable(intent);
      setAvailable(results);
    } finally {
      setLoadingList(false);
    }
  }

  async function handleStartChat(userId: string) {
    const conversation = await getOrCreateConversation(userId);
    navigate(`/messages/${conversation.id}`);
  }

  if (loading) {
    return <p className="text-dusk">Cargando...</p>;
  }

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl font-semibold text-ink">Modo compañía</h1>
      <p className="mb-6 text-sm text-dusk">
        Declarate disponible para acompañar a alguien, o buscá quién está disponible ahora para
        vos. Las disponibilidades duran 6 horas.
      </p>

      {/* Tu disponibilidad actual */}
      <div className="mb-8 border-l-2 border-horizon bg-white p-4">
        <p className="mb-3 text-sm font-medium text-dusk">
          {myAvailability ? 'Estás disponible para:' : '¿Estás disponible para acompañar a alguien?'}
        </p>

        {myAvailability ? (
          <div className="flex items-center justify-between">
            <span className="text-ink">
              {intents.find((i) => i.value === myAvailability.intent)?.label}
            </span>
            <button
              onClick={handleCancel}
              className="rounded-md border border-mist px-3 py-1.5 text-sm text-dusk transition-all hover:border-horizon active:scale-95"
            >
              Ya no estoy disponible
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {intents.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => handleActivate(value)}
                className="flex items-center gap-1.5 rounded-full border border-mist px-3 py-1.5 text-sm text-ink transition-all duration-150 hover:border-horizon active:scale-95"
              >
                <Icon className="h-4 w-4 text-horizon" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Buscar compañía */}
      <div className="border-l-2 border-mist bg-white p-4">
        <p className="mb-3 text-sm font-medium text-dusk">¿Qué necesitás ahora?</p>
        <div className="flex flex-wrap gap-2">
          {intents.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => handleSearch(value)}
              className={
                selectedIntent === value
                  ? 'flex items-center gap-1.5 rounded-full bg-calm px-3 py-1.5 text-sm font-medium text-white transition-all active:scale-95'
                  : 'flex items-center gap-1.5 rounded-full border border-mist px-3 py-1.5 text-sm text-ink transition-all duration-150 hover:border-calm active:scale-95'
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {selectedIntent && (
          <div className="mt-4">
            {loadingList ? (
              <p className="text-sm text-dusk">Buscando...</p>
            ) : available.length === 0 ? (
              <p className="text-sm text-dusk">
                Nadie disponible para esto ahora mismo. Probá con otra opción, o volvé más tarde.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {available.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-md border border-mist p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar
                        avatarUrl={a.user.avatarUrl}
                        name={a.user.displayName || a.user.username}
                        size="sm"
                      />
                      <span className="text-sm font-medium text-ink">
                        {a.user.displayName || a.user.username}
                      </span>
                    </div>
                    <button
                      onClick={() => handleStartChat(a.user.id)}
                      className="rounded-md bg-horizon px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-horizon/90 active:scale-95"
                    >
                      Conversar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}