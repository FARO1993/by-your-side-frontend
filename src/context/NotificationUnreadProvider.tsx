import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type SetStateAction } from 'react';
import { getUnreadCount } from '../api/notifications';
import { subscribeToUserQueue } from '../api/socket';
import type { Notification } from '../api/types';
import {
  NotificationUnreadContext,
  type NotificationListener,
} from './notificationUnreadContext';

export function NotificationUnreadProvider({ children }: { children: ReactNode }) {
  const [notificationUnread, setNotificationUnreadState] = useState(0);
  const listeners = useRef(new Set<NotificationListener>());
  const seen = useRef(new Set<string>());
  const countRequest = useRef(0);

  const subscribe = useCallback((listener: NotificationListener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const remember = useCallback((ids: string[]) => {
    ids.forEach((id) => seen.current.add(id));
  }, []);

  const refreshUnreadCount = useCallback(() => {
    const requestId = ++countRequest.current;
    getUnreadCount()
      .then((count) => {
        if (requestId === countRequest.current) setNotificationUnreadState(count);
      })
      .catch(() => {
        if (requestId === countRequest.current) countRequest.current = requestId - 1;
      });
  }, []);

  const setNotificationUnread = useCallback((value: SetStateAction<number>) => {
    countRequest.current += 1;
    setNotificationUnreadState(value);
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const unsubscribe = subscribeToUserQueue<Notification>('/user/queue/notifications', (notification) => {
      if (seen.current.has(notification.id)) return;
      seen.current.add(notification.id);
      listeners.current.forEach((listener) => listener(notification));
      refreshUnreadCount();
    });
    return unsubscribe;
  }, [refreshUnreadCount]);

  const value = useMemo(
    () => ({ notificationUnread, setNotificationUnread, subscribe, remember }),
    [notificationUnread, setNotificationUnread, subscribe, remember],
  );

  return <NotificationUnreadContext.Provider value={value}>{children}</NotificationUnreadContext.Provider>;
}
