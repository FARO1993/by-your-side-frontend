import type { Notification, NotificationType } from '../api/types';

export function notificationCopy(type: NotificationType): string {
  switch (type) {
    case 'NEW_FOLLOWER':
      return 'empezó a acompañarte';
    case 'NEW_COMMENT':
      return 'respondió tu publicación';
    case 'NEW_POST_RESPONSE':
      return 'respondió a tu publicación';
    case 'NEW_STATUS_REACTION':
      return 'reaccionó a tu estado';
    case 'FOLLOW_REQUEST_RECEIVED':
      return 'quiere acompañarte';
    case 'FOLLOW_REQUEST_ACCEPTED':
      return 'aceptó tu solicitud';
  }
}

export function getNotificationDestination(notification: Notification): string | null {
  switch (notification.type) {
    case 'NEW_POST_RESPONSE':
    case 'NEW_COMMENT':
      return notification.postId ? `/posts/${notification.postId}` : null;
    case 'NEW_STATUS_REACTION':
      return notification.statusId ? '/feed' : null;
    case 'NEW_FOLLOWER':
    case 'FOLLOW_REQUEST_RECEIVED':
    case 'FOLLOW_REQUEST_ACCEPTED':
      return notification.actor?.id ? `/profile/${notification.actor.id}` : null;
    default:
      return null;
  }
}

export function dedupeNotifications(items: Notification[]): Notification[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function prependNotification(current: Notification[], incoming: Notification): Notification[] {
  if (current.some((item) => item.id === incoming.id)) return current;
  return [incoming, ...current];
}

export function applyNotificationPage(current: Notification[] | null, page: Notification[]): Notification[] {
  const pageIds = new Set(page.map((item) => item.id));
  const arrivedWhileLoading = (current ?? []).filter((item) => !pageIds.has(item.id));
  return dedupeNotifications([...arrivedWhileLoading, ...page]);
}

export function appendNotifications(current: Notification[], page: Notification[]): Notification[] {
  return dedupeNotifications([...current, ...page]);
}

export function nextUnreadCount(count: number, delta: number): number {
  return Math.max(0, count + delta);
}
