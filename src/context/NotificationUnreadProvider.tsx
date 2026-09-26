import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getUnreadCount } from '../api/notifications';
import { subscribeToUserQueue } from '../api/socket';
import type { Notification } from '../api/types';
import {
  NotificationUnreadContext,
  type NotificationListener,
} from './notificationUnreadContext';

export function NotificationUnreadProvider({ children }: { children: ReactNode }) {
  const [notificationUnread, setNotificationUnread] = useState(0);
  const listeners = useRef(new Set<NotificationListener>());

  const subscribe = useCallback((listener: NotificationListener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    getUnreadCount().then(setNotificationUnread).catch(() => {});
    const unsubscribe = subscribeToUserQueue<Notification>('/user/queue/notifications', (notification) => {
      setNotificationUnread((prev) => prev + 1);
      listeners.current.forEach((listener) => listener(notification));
    });
    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({ notificationUnread, setNotificationUnread, subscribe }),
    [notificationUnread, subscribe],
  );

  return <NotificationUnreadContext.Provider value={value}>{children}</NotificationUnreadContext.Provider>;
}
