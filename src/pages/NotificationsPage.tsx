import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Ear, MessageSquare, UserPlus } from 'lucide-react';
import { getNotifications, markAllAsRead } from '../api/notifications';
import type { Notification } from '../api/types';
import { timeAgo } from '../lib/timeAgo';
import { isMockRead, markAllMockRead, markMockRead } from '../mocks/notifications';
import Avatar from '../components/Avatar';
import { Button, EmptyState, ErrorState, PresenceGlyph } from '../components/byourside/ui';
import { cn } from '../lib/cn';

const copyByType: Record<Notification['type'], string> = {
  NEW_FOLLOWER: 'empezó a acompañarte',
  NEW_COMMENT: 'respondió tu publicación',
  NEW_SUPPORT: 'te hizo saber que está con vos',
  NEW_STATUS_REACTION: 'reaccionó a tu estado',
};

function KindIcon({ type }: { type: Notification['type'] }) {
  if (type === 'NEW_SUPPORT') {
    return (
      <span className="absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full bg-presence-soft text-presence-strong ring-2 ring-card">
        <PresenceGlyph className="h-3.5 w-5" />
      </span>
    );
  }
  if (type === 'NEW_FOLLOWER') {
    return (
      <span className="absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full bg-presence-soft text-presence-strong ring-2 ring-card">
        <UserPlus className="size-4" />
      </span>
    );
  }
  if (type === 'NEW_COMMENT') {
    return (
      <span className="absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full bg-listening-soft text-listening-strong ring-2 ring-card">
        <MessageSquare className="size-4" />
      </span>
    );
  }
  return (
    <span className="absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full bg-listening-soft text-listening-strong ring-2 ring-card">
      <Ear className="size-4" />
    </span>
  );
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    getNotifications()
      .then((page) => setItems(page.content))
      .catch(() => setError('No se pudieron cargar las novedades'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const unread = items.filter((item) => !item.read && !isMockRead(item.id));

  async function handleMarkAll() {
    await markAllAsRead();
    markAllMockRead(items.map((item) => item.id));
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  }

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl">Novedades</h1>
          <p className="mt-1 text-sm text-muted-foreground">Lo que fue apareciendo mientras no estabas.</p>
        </div>
        {unread.length > 0 ? (
          <Button size="sm" variant="ghost" onClick={handleMarkAll}>
            Marcar todo como leído
          </Button>
        ) : null}
      </header>

      {error ? <ErrorState onRetry={load} /> : null}
      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-20 rounded-2xl" />
          <div className="skeleton h-20 rounded-2xl" />
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-6" />}
          title="No tenés novedades"
          description="Cuando alguien te acompañe o te responda, va a aparecer acá."
        />
      ) : null}

      <ul className="space-y-2">
        {items.map((item) => {
          const read = item.read || isMockRead(item.id);
          const name = item.actor.displayName || item.actor.username;
          const to = item.postId ? `/posts/${item.postId}` : `/profile/${item.actor.id}`;
          return (
            <li key={item.id}>
              <Link
                to={to}
                onClick={() => markMockRead(item.id)}
                className={cn(
                  'flex gap-3 rounded-2xl p-4',
                  read ? 'bg-card' : 'bg-presence-soft/30',
                )}
              >
                <div className="relative">
                  <Avatar avatarUrl={item.actor.avatarUrl} name={name} size="md" />
                  <KindIcon type={item.type} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.95rem] text-foreground/80">
                    <strong className="text-foreground">{name}</strong> {copyByType[item.type]}
                  </p>
                  <time className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</time>
                </div>
                {!read ? <span className="mt-2 size-2 shrink-0 rounded-full bg-presence" /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
