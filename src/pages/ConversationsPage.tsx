import { useEffect, useState } from 'react';
import { getConversations } from '../api/chat';
import type { Conversation } from '../api/types';
import { ConversationList, MessagesChrome } from '../components/byourside/messages-chrome';
import { EmptyState, ErrorState, PresenceGlyph } from '../components/byourside/ui';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getConversations()
      .then((list) => {
        if (!cancelled) setConversations(list);
      })
      .catch(() => {
        // Antes un error mostraba "Todavía no tenés conversaciones", que es falso.
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <MessagesChrome>
      <div className="flex h-full w-full">
        {loading ? (
          <div className="flex-1 space-y-2 p-4" role="status" aria-label="Cargando conversaciones">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} aria-hidden="true" className="flex items-center gap-3 rounded-2xl p-2">
                <div className="size-11 shrink-0 rounded-full skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 rounded-full skeleton" />
                  <div className="h-3 w-2/3 rounded-full skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : failed ? (
          <div className="flex flex-1 items-center p-6">
            <ErrorState
              description="No pudimos traer tus conversaciones. Probá de nuevo."
              onRetry={() => {
                setFailed(false);
                setLoading(true);
                setAttempt((current) => current + 1);
              }}
            />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-1 items-center p-6">
            <EmptyState
              title="Todavía no tenés conversaciones"
              description="Podés escribirle a alguien que acompañés, o que te acompañe, desde su perfil."
            />
          </div>
        ) : (
          <>
            <ConversationList conversations={conversations} query={query} onQuery={setQuery} />
            <div className="hidden flex-1 flex-col items-center justify-center p-8 text-center md:flex">
              <PresenceGlyph className="h-5 w-8 text-presence-strong" />
              <p className="mt-3 font-serif text-lg">Elegí una conversación</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Cuando quieras, abrí un hilo. Acá se ve la lista y la charla juntas.
              </p>
            </div>
          </>
        )}
      </div>
    </MessagesChrome>
  );
}
