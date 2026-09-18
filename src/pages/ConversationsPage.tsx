import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getConversations } from '../api/chat';
import type { Conversation } from '../api/types';
import Avatar from '../components/Avatar';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConversations()
      .then(setConversations)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-dusk">Cargando conversaciones...</p>;
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-ink">Mensajes</h1>

      {conversations.length === 0 ? (
        <p className="text-dusk">
          Todavía no tenés conversaciones. Podés escribirle a alguien que sigas, o que te siga a
          vos, desde su perfil.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              to={`/messages/${conversation.id}`}
              className="flex items-center gap-3 border-l-2 border-mist bg-white p-3 hover:border-horizon"
            >
              <Avatar
                avatarUrl={conversation.otherUser.avatarUrl}
                name={conversation.otherUser.displayName || conversation.otherUser.username}
                size="md"
              />
              <div className="flex-1">
                <p className="font-medium text-ink">
                  {conversation.otherUser.displayName || conversation.otherUser.username}
                </p>
                <p className="truncate text-sm text-dusk">
                  {conversation.lastMessageContent || 'Todavía no hay mensajes'}
                </p>
              </div>
              {conversation.unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-calm px-1.5 text-xs font-medium text-white">
                  {conversation.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}