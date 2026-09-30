import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';
import type { Notification } from '../api/types';

export type NotificationListener = (notification: Notification) => void;

export interface NotificationUnreadValue {
  notificationUnread: number;
  setNotificationUnread: Dispatch<SetStateAction<number>>;
  subscribe: (listener: NotificationListener) => () => void;
  remember: (ids: string[]) => void;
}

export const NotificationUnreadContext = createContext<NotificationUnreadValue | null>(null);

export function useNotificationUnread(): NotificationUnreadValue {
  const context = useContext(NotificationUnreadContext);
  if (!context) {
    throw new Error('useNotificationUnread must be used within a NotificationUnreadProvider');
  }
  return context;
}
