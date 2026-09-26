import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Ear, MessageSquare, UserPlus } from 'lucide-react';
import { getNotifications, getUnreadCount, markAllAsRead } from '../api/notifications';
import type { Notification, NotificationType } from '../api/types';
import { useNotificationUnread } from '../context/notificationUnreadContext';
import { timeAgo } from '../lib/timeAgo';
import Avatar from '../components/Avatar';
import { Button, EmptyState, ErrorState, PresenceGlyph } from '../components/byourside/ui';
import { cn } from '../lib/cn';

const LOAD_ERROR = 'No pudimos cargar tus novedades.';
const MARK_ERROR = 'No pudimos marcar las novedades como leídas.';

const copyByType: Record<NotificationType, string> = {
  NEW_FOLLOWER: 'empezó a acompañarte',
  NEW_COMMENT: 'respondió tu publicación',
  NEW_SUPPORT: 'te hizo saber que está con vos',
  NEW_STATUS_REACTION: 'reaccionó a tu estado',
  FOLLOW_REQUEST_RECEIVED: 'quiere acompañarte',
  FOLLOW_REQUEST_ACCEPTED: 'aceptó tu solicitud',
};

const groups = ['Hoy', 'Ayer', 'Anteriores'] as const;
type DayGroup = (typeof groups)[number];

function actionCopy(type: string): string {
  if (type in copyByType) return copyByType[type as NotificationType];
  return '';
}

function destination(item: Notification): string {
  if ((item.type === 'NEW_COMMENT' || item.type === 'NEW_SUPPORT') && item.postId) {
    return `/posts/${item.postId}`;
  }
  return `/profile/${item.actor.id}`;
}

function dayGroup(iso: string, now = new Date()): DayGroup {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Anteriores';
  const start = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diffDays = Math.round((start(now) - start(date)) / 86_400_000);
  if (diffDays <= 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  return 'Anteriores';
}

function KindMark({ type }: { type: NotificationType }) {
  const presence =
    type === 'NEW_SUPPORT' ||
    type === 'NEW_FOLLOWER' ||
    type === 'FOLLOW_REQUEST_RECEIVED' ||
    type === 'FOLLOW_REQUEST_ACCEPTED';
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full ring-2 ring-background',
        presence ? 'bg-presence-soft text-presence-strong' : 'bg-listening-soft text-listening-strong',
      )}
    >
      {type === 'NEW_SUPPORT' ? <PresenceGlyph className="h-2.5 w-3.5" /> : null}
      {type === 'NEW_FOLLOWER' || type === 'FOLLOW_REQUEST_RECEIVED' ? <UserPlus className="size-3" /> : null}
      {type === 'FOLLOW_REQUEST_ACCEPTED' ? <Check className="size-3" /> : null}
      {type === 'NEW_COMMENT' ? <MessageSquare className="size-3" /> : null}
      {type === 'NEW_STATUS_REACTION' ? <Ear className="size-3" /> : null}
    </span>
  );
}

function NotificationsSkeleton() {
  return (
    <div role="status" aria-label="Cargando novedades" className="space-y-2">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-start gap-3 rounded-2xl bg-card px-3 py-3.5 sm:px-4">
          <div className="skeleton size-11 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2 pt-1">
            <div className="skeleton h-4 w-4/5 rounded-full" />
            <div className="skeleton h-3 w-16 rounded-full" />
          </div>
          <div className="skeleton mt-1.5 size-2 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const { notificationUnread, setNotificationUnread, subscribe } = useNotificationUnread();
  const [items, setItems] = useState<Notification[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [requestId, setRequestId] = useState(0);
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getNotifications()
      .then((page) => {
        if (cancelled) return;
        setItems(page.content);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  useEffect(() => {
    return subscribe((incoming) => {
      setItems((current) => {
        if (!current || current.some((item) => item.id === incoming.id)) return current;
        return [incoming, ...current];
      });
    });
  }, [subscribe]);

  const loading = items === null && !failed;
  const hasUnread = notificationUnread > 0 || (items?.some((item) => !item.read) ?? false);
  const showMarkAll = !loading && !failed && ((items?.length ?? 0) > 0 || notificationUnread > 0);

  function retry() {
    setItems(null);
    setFailed(false);
    setMarkError(null);
    setRequestId((current) => current + 1);
  }

  async function handleMarkAll() {
    if (!items || marking || !hasUnread) return;
    const unreadIds = items.filter((item) => !item.read).map((item) => item.id);
    setMarking(true);
    setMarkError(null);
    try {
      await markAllAsRead();
      const count = await getUnreadCount().catch(() => 0);
      setNotificationUnread(count);
      setItems((current) => {
        if (!current) return current;
        if (count === 0) return current.map((item) => ({ ...item, read: true }));
        return current.map((item) => (unreadIds.includes(item.id) ? { ...item, read: true } : item));
      });
    } catch {
      setMarkError(MARK_ERROR);
    } finally {
      setMarking(false);
    }
  }

  const grouped = groups
    .map((label) => ({
      label,
      items: (items ?? []).filter((item) => dayGroup(item.createdAt) === label),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between md:gap-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl">Novedades</h1>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground md:max-w-sm">
            Lo que fue apareciendo mientras no estabas.
          </p>
        </div>
        {showMarkAll ? (
          <Button
            size="sm"
            variant="ghost"
            className="self-start px-0 text-muted-foreground md:px-3.5 md:self-auto"
            disabled={marking || !hasUnread}
            onClick={() => {
              void handleMarkAll();
            }}
          >
            Marcar todo como leído
          </Button>
        ) : null}
      </header>

      {markError ? (
        <p role="alert" className="text-sm text-presence-strong">
          {markError}
        </p>
      ) : null}

      {loading ? <NotificationsSkeleton /> : null}
      {failed ? <ErrorState description={LOAD_ERROR} onRetry={retry} /> : null}

      {!loading && !failed && items && items.length === 0 ? (
        <EmptyState
          className="px-6 py-8"
          icon={<Bell className="size-5" />}
          title="Todavía no hay novedades"
          description="Cuando alguien interactúe con vos o te acompañe, va a aparecer acá."
        />
      ) : null}

      {!loading && !failed && grouped.length > 0 ? (
        <div className="space-y-5">
          {grouped.map((group) => (
            <section key={group.label} className="space-y-2">
              <h2 className="px-1 text-xs font-medium text-muted-foreground">{group.label}</h2>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <NotificationRow key={item.id} item={item} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NotificationRow({ item }: { item: Notification }) {
  const name = item.actor.displayName || item.actor.username;
  const action = actionCopy(item.type);
  const when = timeAgo(item.createdAt);
  return (
    <li>
      <Link
        to={destination(item)}
        aria-label={`${name} ${action}. ${item.read ? 'Leída' : 'Sin leer'}. ${when}`}
        className={cn(
          'flex items-start gap-3 rounded-2xl px-3 py-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-listening sm:px-4',
          item.read ? 'bg-card' : 'bg-presence-soft/40',
        )}
      >
        <span className="relative shrink-0">
          <Avatar avatarUrl={item.actor.avatarUrl} name={name} size="md" />
          <KindMark type={item.type} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <span
              className={cn(
                'text-[0.95rem] leading-snug',
                item.read ? 'text-foreground/70' : 'text-foreground',
              )}
            >
              <span className={item.read ? 'font-medium' : 'font-semibold'}>{name}</span>
              {action ? ` ${action}` : null}
            </span>
            {item.read ? null : (
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-presence" aria-hidden="true" />
            )}
          </span>
          <time dateTime={item.createdAt} className="mt-1 block text-xs text-muted-foreground">
            {when}
          </time>
        </span>
      </Link>
    </li>
  );
}
