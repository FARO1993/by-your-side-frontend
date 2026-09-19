import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { getConversations, getMessages, sendMessage } from '../api/chat';
import { subscribeToUserQueue } from '../api/socket';
import type { Conversation, Message } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useChatNotifications } from '../context/ChatNotificationsContext';
import { timeAgo } from '../lib/timeAgo';
import { cn } from '../lib/cn';
import Avatar from '../components/Avatar';
import { ConversationList, MessagesChrome } from '../components/byourside/messages-chrome';
import { Spinner } from '../components/byourside/ui';

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { refreshUnreadCount } = useChatNotifications();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<Conversation['otherUser'] | null>(null);
  const [content, setContent] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    Promise.all([getMessages(conversationId), getConversations()])
      .then(([messagesPage, list]) => {
        setMessages(messagesPage.content);
        setConversations(list);
        setOtherUser(list.find((item) => item.id === conversationId)?.otherUser ?? null);
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
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages]);

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (!conversationId || !content.trim()) return;
    const trimmed = content;
    setContent('');
    const message = await sendMessage(conversationId, trimmed);
    setMessages((prev) => [...prev, message]);
  }

  function handleKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  const name = otherUser ? otherUser.displayName || otherUser.username : '';

  return (
    <MessagesChrome>
      <div className="flex h-full w-full overflow-hidden bg-background">
        <div className="hidden h-full md:flex">
          <ConversationList
            conversations={conversations}
            activeId={conversationId}
            query={query}
            onQuery={setQuery}
          />
        </div>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-border/60 bg-background/80 p-3 backdrop-blur-md">
            <button
              type="button"
              aria-label="Volver"
              className="md:hidden"
              onClick={() => navigate('/messages')}
            >
              <ArrowLeft className="size-5" />
            </button>
            {otherUser ? <Avatar avatarUrl={otherUser.avatarUrl} name={name} size="sm" /> : null}
            <div>
              <p className="font-medium">{name}</p>
              <p className="inline-flex items-center gap-1.5 text-xs text-listening-strong">
                <span className="size-1.5 rounded-full bg-listening" />
                Está para escucharte
              </p>
            </div>
          </header>

          <div
            ref={scroller}
            className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-presence-soft/20 to-listening-soft/20 p-4"
          >
            {loading ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : (
              <>
                <p className="mx-auto mb-4 w-fit rounded-full bg-card/70 px-3 py-1 text-xs text-muted-foreground">
                  Conversación privada entre ustedes.
                </p>
                <div className="space-y-3">
                  {messages.map((message) => {
                    const mine = message.sender.id === user?.id;
                    return (
                      <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                        <div
                          className={cn(
                            'max-w-[78%] rounded-2xl px-4 py-2.5 text-[0.95rem] shadow-soft',
                            mine
                              ? 'rounded-br-md bg-presence text-presence-foreground'
                              : 'rounded-bl-md bg-card text-foreground',
                          )}
                        >
                          {message.content}
                          <time className={cn('mt-1 block text-[0.7rem]', mine ? 'text-presence-foreground/80' : 'text-muted-foreground')}>
                            {timeAgo(message.createdAt)}
                          </time>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-border/60 bg-background p-3">
            <textarea
              value={content}
              maxLength={2000}
              rows={1}
              onChange={(event) => setContent(event.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribí un mensaje…"
              className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-card px-4 py-2.5 text-sm focus:border-presence focus-visible:outline-none"
            />
            <button
              type="submit"
              disabled={!content.trim()}
              aria-label="Enviar"
              className="flex size-11 items-center justify-center rounded-full bg-presence text-presence-foreground shadow-soft disabled:opacity-50"
            >
              <Send className="size-5" />
            </button>
          </form>
        </section>
      </div>
    </MessagesChrome>
  );
}
