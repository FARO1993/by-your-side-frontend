import { Client, type IMessage } from '@stomp/stompjs';

let client: Client | null = null;

export function connectSocket(token: string): Client {
  if (client?.connected) {
    return client;
  }

  client = new Client({
    brokerURL: import.meta.env.VITE_WS_BASE_URL,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });

  client.activate();
  return client;
}

export function disconnectSocket(): void {
  client?.deactivate();
  client = null;
}

export function subscribeToUserQueue<T>(destination: string, onMessage: (payload: T) => void): () => void {
  let subscriptionId: string | undefined;
  let cancelled = false;

  function trySubscribe() {
    if (cancelled || !client) return;

    if (client.connected) {
      const subscription = client.subscribe(destination, (message: IMessage) => {
        onMessage(JSON.parse(message.body) as T);
      });
      subscriptionId = subscription.id;
    } else {
      // El cliente todavia no termino de conectar (o ni siquiera se
      // llamo a connectSocket todavia) -- reintenta cuando conecte,
      // en vez de tirar error y dejar la suscripcion perdida.
      const originalOnConnect = client.onConnect;
      client.onConnect = (frame) => {
        originalOnConnect?.(frame);
        trySubscribe();
      };
    }
  }

  // Si connectSocket todavia no corrio (client es null), reintenta con
  // un pequeño polling hasta que exista -- cubre el caso de un
  // componente montando antes que AuthContext termine de conectar.
  if (!client) {
    const interval = setInterval(() => {
      if (client) {
        clearInterval(interval);
        trySubscribe();
      }
    }, 200);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (subscriptionId) client?.unsubscribe(subscriptionId);
    };
  }

  trySubscribe();

  return () => {
    cancelled = true;
    if (subscriptionId) client?.unsubscribe(subscriptionId);
  };
}