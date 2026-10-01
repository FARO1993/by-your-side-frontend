import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, DoorOpen, Send } from 'lucide-react';
import { unblockUser } from '../api/blocks';
import { getConversations, getMessages, sendMessage } from '../api/chat';
import { getPublicProfile } from '../api/users';
import { subscribeToUserQueue } from '../api/socket';
import type { Conversation, Message } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useChatNotifications } from '../context/ChatNotificationsContext';
import { useDraft } from '../hooks/useDraft';
import { draftKey } from '../lib/drafts';
import { timeAgo } from '../lib/timeAgo';
import { cn } from '../lib/cn';
import Avatar from '../components/Avatar';
import { DraftNotice } from '../components/byourside/draft-notice';
import { ConversationList, MessagesChrome } from '../components/byourside/messages-chrome';
import { Button, Spinner } from '../components/byourside/ui';
import { ChatSafetyMenu, type ChatRelation } from '../components/safety/ChatSafetyMenu';
import { CompanionCrisisGuide } from '../components/safety/CompanionCrisisGuide';
import { CrisisNotice } from '../components/safety/CrisisNotice';
import { LeaveConversationDialog } from '../components/safety/LeaveConversationDialog';
import { ReportDialog } from '../components/safety/ReportDialog';
import { hasCrisisSignal } from '../lib/crisisSignals';

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { refreshUnreadCount } = useChatNotifications();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<Conversation['otherUser'] | null>(null);
  const {
    text: content,
    setText: setContent,
    discard: discardDraft,
    restored: draftRestored,
  } = useDraft(conversationId ? draftKey(user?.id, `chat:${conversationId}`) : null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  // Relación con la otra persona (bloqueo/silencio que hice YO), atada a su id
  // para que al cambiar de conversación no se arrastre la anterior.
  const [relationState, setRelationState] = useState<{ userId: string; value: ChatRelation } | null>(null);
  const [unblocking, setUnblocking] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [reportingRisk, setReportingRisk] = useState(false);
  // Guía para quien acompaña: último mensaje de la otra persona con señales
  // de crisis. Solo se calcula acá; no se envía ni registra nada.
  const [dismissedRiskId, setDismissedRiskId] = useState<string | null>(null);
  const [unblockError, setUnblockError] = useState<string | null>(null);
  const otherUserId = otherUser?.id ?? null;
  const relation = relationState && relationState.userId === otherUserId ? relationState.value : null;

  useEffect(() => {
    if (!otherUserId) return undefined;
    let cancelled = false;
    getPublicProfile(otherUserId)
      .then((profile) => {
        if (cancelled) return;
        setRelationState({
          userId: otherUserId,
          value: { blocked: profile.blockedByCurrentUser, muted: profile.mutedByCurrentUser },
        });
      })
      .catch(() => {
        // Sin perfil visible: el menú ofrece solo ver perfil y reportar.
      });
    return () => {
      cancelled = true;
    };
  }, [otherUserId]);

  function updateRelation(value: ChatRelation) {
    if (otherUserId) setRelationState({ userId: otherUserId, value });
  }

  async function handleUnblock() {
    if (!otherUserId || !relation) return;
    setUnblocking(true);
    setUnblockError(null);
    try {
      await unblockUser(otherUserId);
      updateRelation({ ...relation, blocked: false });
    } catch {
      setUnblockError('No pudimos desbloquear. Probá de nuevo.');
    } finally {
      setUnblocking(false);
    }
  }

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
    setSendError(null);
    try {
      const message = await sendMessage(conversationId, trimmed);
      setMessages((prev) => [...prev, message]);
    } catch {
      setContent(trimmed);
      setSendError('No pudimos enviar el mensaje.');
    }
  }

  function handleKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  const name = otherUser ? otherUser.displayName || otherUser.username : '';

  const riskMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message.sender.id !== user?.id && hasCrisisSignal(message.content)) return message.id;
    }
    return null;
  }, [messages, user?.id]);
  const showCompanionGuide = riskMessageId !== null && riskMessageId !== dismissedRiskId && Boolean(otherUser);

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
            <div className="min-w-0">
              <p className="truncate font-medium">{name}</p>
              {relation?.blocked ? (
                <p className="text-xs text-muted-foreground">Bloqueaste a esta persona</p>
              ) : (
                <p className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-listening-strong">
                  <span className="size-1.5 rounded-full bg-listening" />
                  Está para escucharte
                </p>
              )}
            </div>
            {otherUser ? (
              <div className="ml-auto flex shrink-0 items-center gap-1">
                {relation?.blocked ? null : (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label="Necesito irme"
                    className="px-2.5 sm:px-3.5"
                    onClick={() => setLeaving(true)}
                  >
                    <DoorOpen className="size-4" aria-hidden="true" />
                    {/* En mobile el texto corto evita partir el nombre/estado en dos líneas. */}
                    <span className="sm:hidden">Irme</span>
                    <span className="hidden sm:inline">Necesito irme</span>
                  </Button>
                )}
                <ChatSafetyMenu userId={otherUser.id} name={name} relation={relation} onRelationChange={updateRelation} />
              </div>
            ) : null}
          </header>
          {leaving && conversationId ? (
            <LeaveConversationDialog
              name={name}
              onClose={() => setLeaving(false)}
              onLeave={() => navigate('/messages')}
              onSendAndLeave={async (goodbye) => {
                await sendMessage(conversationId, goodbye);
                navigate('/messages');
              }}
            />
          ) : null}

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
                <p className="mx-auto mb-5 max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
                  Quienes acompañan acá son personas de la comunidad, no profesionales. Si es urgente,{' '}
                  <Link to="/help" className="font-medium text-listening-strong underline-offset-2 hover:underline">
                    buscá ayuda ahora
                  </Link>
                  .
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

          {showCompanionGuide ? (
            <CompanionCrisisGuide
              name={name}
              onReport={() => setReportingRisk(true)}
              onDismiss={() => setDismissedRiskId(riskMessageId)}
            />
          ) : null}
          {reportingRisk && otherUser ? (
            <ReportDialog
              targetType="USER"
              targetId={otherUser.id}
              name={name}
              initialReason="SELF_HARM_RISK"
              onClose={() => setReportingRisk(false)}
            />
          ) : null}
          {relation?.blocked ? (
            <div className="border-t border-border/60 bg-background p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Bloqueaste a {name}. No pueden enviarse mensajes nuevos.
              </p>
              <Button type="button" size="sm" variant="outline" className="mt-2" loading={unblocking} onClick={() => void handleUnblock()}>
                Desbloquear
              </Button>
              {unblockError ? (
                <p role="alert" className="mt-2 text-sm text-destructive">
                  {unblockError}
                </p>
              ) : null}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="border-t border-border/60 bg-background p-3">
              {sendError ? (
                <p role="alert" className="mb-2 text-sm text-destructive">
                  {sendError}
                </p>
              ) : null}
              <CrisisNotice text={content} className="mb-2" />
              {draftRestored ? (
                <DraftNotice restored hasText={content.trim() !== ''} onDiscard={discardDraft} className="mb-2 px-1" />
              ) : null}
              <div className="flex items-end gap-2">
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
              </div>
            </form>
          )}
        </section>
      </div>
    </MessagesChrome>
  );
}
