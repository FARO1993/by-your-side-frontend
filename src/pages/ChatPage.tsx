import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMessages, sendMessage, getConversations } from '../api/chat';
import { subscribeToUserQueue } from '../api/socket';
import type { Message, Conversation } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useChatNotifications } from '../context/ChatNotificationsContext';
import Avatar from '../components/Avatar';
import { ArrowLeftIcon } from '../components/Icons';

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { refreshUnreadCount } = useChatNotifications();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<Conversation['otherUser'] | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;

    setLoading(true);

    Promise.all([getMessages(conversationId), getConversations()])
      .then(([messagesPage, conversations]) => {
        setMessages(messagesPage.content);
        const current = conversations.find((c) => c.id === conversationId);
        setOtherUser(current?.otherUser ?? null);
        refreshUnreadCount();
      })
      .finally(() => setLoading(false));

    const unsubscribe = subscribeToUserQueue<Message>('/user/queue/messages', (message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return unsubscribe;
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!conversationId || !content.trim()) return;

    const trimmed = content;
    setContent('');
    const message = await sendMessage(conversationId, trimmed);
    setMessages((prev) => [...prev, message]);
  }

  if (loading) {
    return <p className="text-dusk">Cargando conversación...</p>;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex items-center gap-2 border-b border-mist pb-3">
        <button onClick={() => navigate('/messages')} className="text-dusk hover:text-ink">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        {otherUser && (
          <>
            <Avatar
              avatarUrl={otherUser.avatarUrl}
              name={otherUser.displayName || otherUser.username}
              size="sm"
            />
            <span className="font-medium text-ink">{otherUser.displayName || otherUser.username}</span>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {messages.map((message) => {
          const isOwnMessage = message.sender.id === user?.id;
          return (
            <div key={message.id} className={`mb-2 flex animate-fade-slide-in ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              <div
                className={
                  isOwnMessage
                    ? 'max-w-xs rounded-lg bg-horizon px-3 py-2 text-sm text-white'
                    : 'max-w-xs rounded-lg bg-white border border-mist px-3 py-2 text-sm text-ink'
                }
              >
                {message.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribí un mensaje..."
          maxLength={2000}
          className="flex-1 rounded-md border border-mist bg-white px-3 py-2 text-sm text-ink placeholder:text-dusk/60 focus:border-horizon focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-horizon px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-horizon/90 active:scale-95"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}