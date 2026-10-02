import { Client } from '@stomp/stompjs';

/**
 * WebSocket (STOMP) de la sesión.
 *
 * Las suscripciones viven en un registro propio y se (re)aplican en CADA
 * conexión: stompjs crea un StompHandler nuevo al reconectar y las
 * suscripciones anteriores se pierden. Antes, después de una caída el chat
 * dejaba de recibir mensajes en tiempo real sin ningún aviso.
 *
 * El estado de conexión se puede observar (useSocketStatus) para avisar
 * "Reconectando…" en vez de fallar en silencio.
 */
export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting';

type Entry = {
  destination: string;
  handler: (body: string) => void;
  stompId?: string;
};

let client: Client | null = null;
let status: SocketStatus = 'idle';
const statusListeners = new Set<() => void>();
const entries = new Set<Entry>();

function setStatus(next: SocketStatus): void {
  if (status === next) return;
  status = next;
  statusListeners.forEach((listener) => listener());
}

export function getSocketStatus(): SocketStatus {
  return status;
}

export function subscribeSocketStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

function attach(entry: Entry): void {
  if (!client?.connected) return;
  const subscription = client.subscribe(entry.destination, (message) => entry.handler(message.body));
  entry.stompId = subscription.id;
}

export function syncSocketAccessToken(token: string): void {
  if (!client) return;
  client.connectHeaders = {
    Authorization: `Bearer ${token}`,
  };
}

export function connectSocket(token: string): Client {
  // Ya hay un cliente (conectado o reconectando): solo se actualiza el token
  // para la próxima conexión. Crear otro dejaría dos conexiones en paralelo.
  if (client) {
    syncSocketAccessToken(token);
    return client;
  }

  let everConnected = false;
  const current = new Client({
    brokerURL: import.meta.env.VITE_WS_BASE_URL,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      if (client !== current) return;
      everConnected = true;
      entries.forEach((entry) => {
        entry.stompId = undefined;
        attach(entry);
      });
      setStatus('connected');
    },
    onWebSocketClose: () => {
      // Si ya se llamó a disconnectSocket (logout), client cambió: no hay nada que avisar.
      if (client !== current) return;
      setStatus(everConnected ? 'reconnecting' : 'connecting');
    },
  });

  client = current;
  setStatus('connecting');
  current.activate();
  return current;
}

export function disconnectSocket(): void {
  const current = client;
  client = null;
  entries.forEach((entry) => {
    entry.stompId = undefined;
  });
  setStatus('idle');
  void current?.deactivate();
}

/**
 * Se suscribe a una cola del usuario. Funciona aunque el socket todavía no
 * haya conectado (se aplica al conectar) y sobrevive a las reconexiones.
 * Devuelve la función para desuscribirse.
 */
export function subscribeToUserQueue<T>(destination: string, onMessage: (payload: T) => void): () => void {
  const entry: Entry = {
    destination,
    handler: (body) => onMessage(JSON.parse(body) as T),
  };
  entries.add(entry);
  attach(entry);

  return () => {
    entries.delete(entry);
    if (entry.stompId && client?.connected) {
      try {
        client.unsubscribe(entry.stompId);
      } catch {
        // La conexión pudo cerrarse entre el chequeo y el unsubscribe: no hay nada que limpiar.
      }
    }
  };
}

/** Solo para tests: vuelve el módulo a su estado inicial. */
export function resetSocketForTests(): void {
  client = null;
  entries.clear();
  statusListeners.clear();
  status = 'idle';
}
