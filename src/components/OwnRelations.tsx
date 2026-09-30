import { useEffect, useState } from 'react';
import {
  acceptFollowRequest,
  cancelFollowRequest,
  listIncomingFollowRequests,
  listOutgoingFollowRequests,
  rejectFollowRequest,
  type FollowRequest,
} from '../api/followRequests';
import { getFollowers, removeFollower } from '../api/follows';
import type { UserSummary } from '../api/types';
import { FOLLOW_REQUEST_STALE, isStaleFollowRequest } from '../lib/followRequest';
import { Button } from './byourside/ui';

export default function OwnRelations({ userId, onChanged }: { userId: string; onChanged?: () => void }) {
  const [incoming, setIncoming] = useState<FollowRequest[] | null>(null);
  const [outgoing, setOutgoing] = useState<FollowRequest[] | null>(null);
  const [followers, setFollowers] = useState<UserSummary[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([listIncomingFollowRequests(), listOutgoingFollowRequests(), getFollowers(userId)])
      .then(([received, sent, people]) => {
        if (!active) return;
        setIncoming(received);
        setOutgoing(sent);
        setFollowers(people);
      })
      .catch(() => {
        if (!active) return;
        setIncoming([]);
        setOutgoing([]);
        setFollowers([]);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  async function resolve(request: FollowRequest, action: 'accept' | 'reject') {
    setBusyId(request.requestId);
    setNotice(null);
    try {
      if (action === 'accept') await acceptFollowRequest(request.requestId);
      else await rejectFollowRequest(request.requestId);
      setIncoming((current) => current?.filter((item) => item.requestId !== request.requestId) ?? []);
      onChanged?.();
    } catch (error) {
      if (isStaleFollowRequest(error)) {
        setNotice(FOLLOW_REQUEST_STALE);
        setIncoming((current) => current?.filter((item) => item.requestId !== request.requestId) ?? []);
        onChanged?.();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function dropFollower(person: UserSummary) {
    setBusyId(person.id);
    setNotice(null);
    try {
      await removeFollower(person.id);
      setFollowers((current) => current?.filter((item) => item.id !== person.id) ?? []);
      onChanged?.();
    } catch {
      setNotice('No pudimos actualizar esa relación.');
    } finally {
      setBusyId(null);
    }
  }

  async function cancelOutgoing(request: FollowRequest) {
    setBusyId(request.requestId);
    setNotice(null);
    try {
      await cancelFollowRequest(request.requestId);
      setOutgoing((current) => current?.filter((item) => item.requestId !== request.requestId) ?? []);
      onChanged?.();
    } catch (error) {
      if (isStaleFollowRequest(error)) {
        setNotice(FOLLOW_REQUEST_STALE);
        setOutgoing((current) => current?.filter((item) => item.requestId !== request.requestId) ?? []);
        onChanged?.();
      } else {
        setNotice('No pudimos actualizar esa relación.');
      }
    } finally {
      setBusyId(null);
    }
  }

  if (!notice && !incoming?.length && !outgoing?.length && !followers?.length) return null;

  return (
    <section className="space-y-4 rounded-2xl bg-muted/50 p-4" aria-label="Relaciones">
      {notice ? (
        <p role="alert" className="text-sm text-destructive">
          {notice}
        </p>
      ) : null}
      {incoming?.length ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Solicitudes recibidas</h2>
          {incoming.map((request) => (
            <div key={request.requestId} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm">{request.otherUser.displayName ?? request.otherUser.username}</span>
              <span className="flex gap-2">
                <Button type="button" size="sm" disabled={busyId === request.requestId} onClick={() => void resolve(request, 'accept')}>
                  Aceptar
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={busyId === request.requestId} onClick={() => void resolve(request, 'reject')}>
                  Rechazar
                </Button>
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {outgoing?.length ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Solicitudes enviadas</h2>
          {outgoing.map((request) => (
            <div key={request.requestId} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm">{request.otherUser.displayName ?? request.otherUser.username}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busyId === request.requestId}
                onClick={() => void cancelOutgoing(request)}
              >
                Cancelar solicitud
              </Button>
            </div>
          ))}
        </div>
      ) : null}
      {followers?.length ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Quienes te acompañan</h2>
          {followers.map((person) => (
            <div key={person.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm">{person.displayName ?? person.username}</span>
              <Button type="button" size="sm" variant="outline" disabled={busyId === person.id} onClick={() => void dropFollower(person)}>
                Dejar de acompañarte
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
