import { useEffect, useState } from 'react';
import { getUnreadCount } from '../api/notifications';
import { subscribeToUserQueue } from '../api/socket';
import type { Notification } from '../api/types';

export function useNotificationUnread() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    getUnreadCount().then(setCount).catch(() => {});
    const unsubscribe = subscribeToUserQueue<Notification>('/user/queue/notifications', () => {
      setCount((prev) => prev + 1);
    });
    return unsubscribe;
  }, []);

  return { notificationUnread: count, setNotificationUnread: setCount };
}
