import { useSyncExternalStore } from 'react';
import { getSocketStatus, subscribeSocketStatus, type SocketStatus } from '../api/socket';

export function useSocketStatus(): SocketStatus {
  return useSyncExternalStore(subscribeSocketStatus, getSocketStatus, getSocketStatus);
}
