import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Options = {
  onConnect?: () => void;
  onWebSocketClose?: () => void;
};

const stomp = vi.hoisted(() => {
  const instances: FakeClient[] = [];
  class FakeClient {
    options: Options;
    connected = false;
    connectHeaders: Record<string, string> = {};
    subscriptions: { id: string; destination: string; callback: (message: { body: string }) => void }[] = [];
    unsubscribed: string[] = [];
    counter = 0;
    activate = vi.fn();
    deactivate = vi.fn(() => Promise.resolve());
    constructor(options: Options) {
      this.options = options;
      instances.push(this);
    }
    subscribe(destination: string, callback: (message: { body: string }) => void) {
      const id = `sub-${this.counter++}`;
      this.subscriptions.push({ id, destination, callback });
      return { id };
    }
    unsubscribe(id: string) {
      this.unsubscribed.push(id);
    }
    // Simula una conexión STOMP nueva: stompjs arranca con suscripciones vacías.
    simulateConnect() {
      this.connected = true;
      this.subscriptions = [];
      this.options.onConnect?.();
    }
    simulateDrop() {
      this.connected = false;
      this.options.onWebSocketClose?.();
    }
  }
  return { instances, FakeClient };
});

// src/test/setup.ts ya importa auth/session -> api/socket con el stompjs real,
// así que hay que recargar el módulo después de mockear.
let connectSocket: typeof import('./socket').connectSocket;
let disconnectSocket: typeof import('./socket').disconnectSocket;
let getSocketStatus: typeof import('./socket').getSocketStatus;
let subscribeSocketStatus: typeof import('./socket').subscribeSocketStatus;
let subscribeToUserQueue: typeof import('./socket').subscribeToUserQueue;
let resetSocketForTests: typeof import('./socket').resetSocketForTests;

describe('socket', () => {
  beforeEach(async () => {
    stomp.instances.length = 0;
    vi.resetModules();
    vi.doMock('@stomp/stompjs', () => ({ Client: stomp.FakeClient }));
    ({
      connectSocket,
      disconnectSocket,
      getSocketStatus,
      subscribeSocketStatus,
      subscribeToUserQueue,
      resetSocketForTests,
    } = await import('./socket'));
  });
  afterEach(() => {
    resetSocketForTests();
    vi.doUnmock('@stomp/stompjs');
  });

  it('re-subscribes after a reconnect, so messages keep arriving', () => {
    const received: string[] = [];
    connectSocket('token');
    subscribeToUserQueue<{ text: string }>('/user/queue/messages', (payload) => received.push(payload.text));
    const client = stomp.instances[0];

    client.simulateConnect();
    client.subscriptions[0].callback({ body: JSON.stringify({ text: 'hola' }) });

    client.simulateDrop();
    expect(getSocketStatus()).toBe('reconnecting');
    client.simulateConnect();
    expect(getSocketStatus()).toBe('connected');
    expect(client.subscriptions).toHaveLength(1);
    client.subscriptions[0].callback({ body: JSON.stringify({ text: 'después de reconectar' }) });

    expect(received).toEqual(['hola', 'después de reconectar']);
  });

  it('applies subscriptions made before connecting', () => {
    const received: string[] = [];
    subscribeToUserQueue<string>('/user/queue/notifications', (payload) => received.push(payload));
    connectSocket('token');
    stomp.instances[0].simulateConnect();
    stomp.instances[0].subscriptions[0].callback({ body: '"aviso"' });
    expect(received).toEqual(['aviso']);
  });

  it('stops delivering after unsubscribing, also across reconnects', () => {
    connectSocket('token');
    const client = stomp.instances[0];
    client.simulateConnect();
    const unsubscribe = subscribeToUserQueue('/user/queue/messages', () => {});
    unsubscribe();
    expect(client.unsubscribed).toEqual(['sub-0']);
    client.simulateDrop();
    client.simulateConnect();
    expect(client.subscriptions).toHaveLength(0);
  });

  it('reports connecting, connected, reconnecting and idle, and notifies listeners', () => {
    const listener = vi.fn();
    subscribeSocketStatus(listener);
    connectSocket('token');
    expect(getSocketStatus()).toBe('connecting');
    // Una caída antes de la primera conexión sigue siendo "conectando", no "reconectando".
    stomp.instances[0].simulateDrop();
    expect(getSocketStatus()).toBe('connecting');
    stomp.instances[0].simulateConnect();
    expect(getSocketStatus()).toBe('connected');
    disconnectSocket();
    expect(getSocketStatus()).toBe('idle');
    expect(listener).toHaveBeenCalled();
  });

  it('does not open a second connection while one is reconnecting', () => {
    connectSocket('token-1');
    stomp.instances[0].simulateConnect();
    stomp.instances[0].simulateDrop();
    connectSocket('token-2');
    expect(stomp.instances).toHaveLength(1);
    expect(stomp.instances[0].connectHeaders.Authorization).toBe('Bearer token-2');
  });

  it('ignores close events from a client that was already disconnected', () => {
    connectSocket('token');
    const old = stomp.instances[0];
    old.simulateConnect();
    disconnectSocket();
    old.simulateDrop();
    expect(getSocketStatus()).toBe('idle');
  });
});
