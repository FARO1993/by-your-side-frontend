import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications, getUnreadCount, markAllAsRead } from '../api/notifications';
import { subscribeToUserQueue } from '../api/socket';
import type { Notification } from '../api/types';
import { BellIcon } from './Icons';

const messageByType: Record<Notification['type'], string> = {
  NEW_FOLLOWER: 'empezó a seguirte',
  NEW_COMMENT: 'comentó tu post',
  NEW_SUPPORT: 'te envió apoyo',
  NEW_STATUS_REACTION: 'reaccionó a tu estado',
};

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUnreadCount().then(setUnreadCount).catch(() => {});

    // /user/queue/notifications es el destino privado que Spring resuelve
    // automaticamente por sesion (ver setUserDestinationPrefix en el backend)
    // -- no hace falta saber el propio username acá.
    const unsubscribe = subscribeToUserQueue<Notification>('/user/queue/notifications', (notification) => {
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => [notification, ...prev]);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleToggle() {
    const willOpen = !open;
    setOpen(willOpen);

    if (willOpen) {
      const page = await getNotifications();
      setNotifications(page.content);

      if (unreadCount > 0) {
        await markAllAsRead();
        setUnreadCount(0);
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button onClick={handleToggle} className="relative text-dusk transition-colors hover:text-ink">
      <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-calm text-[10px] font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-10 w-72 border border-mist bg-white p-2 shadow-sm">
          {notifications.length === 0 ? (
            <p className="p-3 text-sm text-dusk">No tenés notificaciones todavía.</p>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                to={n.postId ? `/posts/${n.postId}` : `/profile/${n.actor.id}`}
                onClick={() => setOpen(false)}
                className="block rounded-md p-2 text-sm hover:bg-paper"
              >
                <span className="font-medium text-ink">
                  {n.actor.displayName || n.actor.username}
                </span>{' '}
                <span className="text-dusk">{messageByType[n.type]}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}