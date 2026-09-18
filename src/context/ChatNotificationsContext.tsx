import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getConversations } from '../api/chat';
import { subscribeToUserQueue } from '../api/socket';
import type { Message } from '../api/types';

interface ChatNotificationsValue {
  unreadCount: number;
  refreshUnreadCount: () => void;
}

const ChatNotificationsContext = createContext<ChatNotificationsValue | null>(null);

export function ChatNotificationsProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  function refreshUnreadCount() {
    getConversations()
      .then((conversations) => {
        const total = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
        setUnreadCount(total);
      })
      .catch(() => {});
  }

  useEffect(() => {
    refreshUnreadCount();

    // Suma optimista al llegar un mensaje nuevo por WebSocket. Puede
    // quedar desactualizado si el mensaje llega mientras estas viendo
    // esa misma conversacion (ChatPage lo marca leido al toque) -- por
    // eso ChatPage llama a refreshUnreadCount() despues de cargar los
    // mensajes, para resincronizar con el valor real del backend.
    const unsubscribe = subscribeToUserQueue<Message>('/user/queue/messages', () => {
      setUnreadCount((prev) => prev + 1);
    });

    return unsubscribe;
  }, []);

  return (
    <ChatNotificationsContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </ChatNotificationsContext.Provider>
  );
}

export function useChatNotifications(): ChatNotificationsValue {
  const context = useContext(ChatNotificationsContext);
  if (!context) {
    throw new Error('useChatNotifications must be used within a ChatNotificationsProvider');
  }
  return context;
}