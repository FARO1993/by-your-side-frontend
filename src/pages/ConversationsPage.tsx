import { useEffect, useState } from 'react';
import { getConversations } from '../api/chat';
import type { Conversation } from '../api/types';
import { ConversationList, MessagesChrome } from '../components/byourside/messages-chrome';
import { EmptyState, PresenceGlyph } from '../components/byourside/ui';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConversations().then(setConversations).finally(() => setLoading(false));
  }, []);

  return (
    <MessagesChrome>
      <div className="flex h-full w-full">
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Cargando…</div>
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
