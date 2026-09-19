import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import type { Conversation } from '../../api/types';
import { timeAgo } from '../../lib/timeAgo';
import { cn } from '../../lib/cn';
import Avatar from '../Avatar';

export function ConversationList({
  conversations,
  activeId,
  query,
  onQuery,
}: {
  conversations: Conversation[];
  activeId?: string;
  query: string;
  onQuery: (value: string) => void;
}) {
  const filtered = conversations.filter((conversation) => {
    const name = (conversation.otherUser.displayName || conversation.otherUser.username).toLowerCase();
    return name.includes(query.trim().toLowerCase());
  });

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-border/60 bg-card/40 md:w-80 md:border-r lg:w-96">
      <div className="p-4">
        <h1 className="font-serif text-2xl">Mensajes</h1>
        <div className="relative mt-3">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Buscar"
            className="min-h-10 w-full rounded-full border border-input bg-card pr-3 pl-9 text-sm focus:border-presence focus-visible:outline-none"
          />
        </div>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {filtered.map((conversation) => {
          const name = conversation.otherUser.displayName || conversation.otherUser.username;
          const active = conversation.id === activeId;
          return (
            <li key={conversation.id}>
              <Link
                to={`/messages/${conversation.id}`}
                className={cn(
                  'flex gap-3 rounded-xl p-3',
                  active ? 'bg-presence-soft/50' : 'hover:bg-muted',
                )}
              >
                <Avatar avatarUrl={conversation.otherUser.avatarUrl} name={name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-medium">{name}</p>
                    {conversation.lastMessageAt ? (
                      <time className="text-[0.7rem] text-muted-foreground">
                        {timeAgo(conversation.lastMessageAt)}
                      </time>
                    ) : null}
                  </div>
                  <p
                    className={cn(
                      'truncate text-sm',
                      conversation.unreadCount > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {conversation.lastMessageContent || 'Todavía no hay mensajes'}
                  </p>
                </div>
                {conversation.unreadCount > 0 ? (
                  <span className="min-w-5 self-center rounded-full bg-presence px-1.5 text-center text-xs text-presence-foreground">
                    {conversation.unreadCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export function MessagesChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[calc(100dvh-3.5rem)] bg-background md:h-[calc(100dvh-4rem)]">
      <div className="mx-auto flex h-full max-w-5xl overflow-hidden md:rounded-3xl md:border md:border-border/60 md:px-6 md:py-6 md:shadow-soft">
        {children}
      </div>
    </div>
  );
}
