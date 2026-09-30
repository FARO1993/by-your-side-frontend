import { describe, expect, it } from 'vitest';
import type { Notification } from '../api/types';
import { appendNotifications, getNotificationDestination, notificationCopy, prependNotification } from './notifications';

function note(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'n1',
    actor: { id: 'actor-1', username: 'facu', displayName: 'Facu', avatarUrl: null },
    type: 'NEW_FOLLOWER',
    postId: null,
    statusId: null,
    followRequestId: null,
    read: false,
    createdAt: '2026-09-30T12:00:00.000Z',
    ...overrides,
  };
}

describe('notification destinations', () => {
  it('opens a post response on the post', () => {
    expect(getNotificationDestination(note({ type: 'NEW_POST_RESPONSE', postId: 'post-1' }))).toBe('/posts/post-1');
  });

  it('opens a status reaction on the feed', () => {
    expect(getNotificationDestination(note({ type: 'NEW_STATUS_REACTION', statusId: 'status-1' }))).toBe('/feed');
  });

  it('opens a received follow request on the actor profile', () => {
    expect(getNotificationDestination(note({ type: 'FOLLOW_REQUEST_RECEIVED', followRequestId: 'request-1' }))).toBe('/profile/actor-1');
  });

  it('opens an accepted follow request on the actor profile', () => {
    expect(getNotificationDestination(note({ type: 'FOLLOW_REQUEST_ACCEPTED', followRequestId: 'request-1' }))).toBe('/profile/actor-1');
  });

  it('has no destination when the post id is missing', () => {
    expect(getNotificationDestination(note({ type: 'NEW_POST_RESPONSE', postId: null }))).toBeNull();
  });

  it('has no destination when a status reaction has no status id', () => {
    expect(getNotificationDestination(note({ type: 'NEW_STATUS_REACTION', statusId: null }))).toBeNull();
  });

  it('describes a post response without calling it a like', () => {
    expect(notificationCopy('NEW_POST_RESPONSE')).toBe('respondió a tu publicación');
  });
});

describe('notification identity', () => {
  it('keeps one row when the same id arrives again, even with another type and time', () => {
    const current = [note({ id: 'same', type: 'NEW_COMMENT', createdAt: '2026-09-30T10:00:00.000Z' })];
    const incoming = note({ id: 'same', type: 'NEW_POST_RESPONSE', createdAt: '2026-09-30T18:00:00.000Z', postId: 'post-2' });
    expect(prependNotification(current, incoming)).toEqual(current);
  });

  it('prepends a notification with a new id', () => {
    const current = [note({ id: 'old' })];
    const incoming = note({ id: 'new' });
    expect(prependNotification(current, incoming).map((item) => item.id)).toEqual(['new', 'old']);
  });

  it('appends the next page without repeating an id', () => {
    const current = [note({ id: 'a' }), note({ id: 'b', type: 'NEW_COMMENT' })];
    const next = [note({ id: 'b', type: 'NEW_POST_RESPONSE', createdAt: '2026-09-29T10:00:00.000Z' }), note({ id: 'c' })];
    expect(appendNotifications(current, next).map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(appendNotifications(current, next)[1].type).toBe('NEW_COMMENT');
  });
});
