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
    reconnectDelay: 5000, // reintenta cada 5s si se cae la conexion
  });

  client.activate();
  return client;
}

export function disconnectSocket(): void {
  client?.deactivate();
  client = null;
}

export function subscribeToUserQueue<T>(destination: string, onMessage: (payload: T) => void): () => void {
  if (!client) {
    throw new Error('Socket not connected. Call connectSocket first.');
  }

  // stompjs resuelve la suscripcion apenas la conexion este activa; si ya
  // esta conectado, se suscribe al toque, si no, espera al evento onConnect.
  let subscriptionId: string | undefined;

  const trySubscribe = () => {
    const subscription = client!.subscribe(destination, (message: IMessage) => {
      onMessage(JSON.parse(message.body) as T);
    });
    subscriptionId = subscription.id;
  };

  if (client.connected) {
    trySubscribe();
  } else {
    client.onConnect = trySubscribe;
  }

  return () => {
    if (subscriptionId) {
      client?.unsubscribe(subscriptionId);
    }
  };
}