import { useState } from 'react';
import { Check, UserPlus } from 'lucide-react';
import { followUser, unfollowUser } from '../api/follows';
import { cancelFollowRequest, listOutgoingFollowRequests } from '../api/followRequests';
import type { DiscoverFollowState } from '../api/types';
import { getPublicProfile } from '../api/users';
import { cn } from '../lib/cn';
import { FOLLOW_REQUEST_STALE, isStaleFollowRequest } from '../lib/followRequest';
import { Button } from './byourside/ui';

export default function FollowButton({
  userId,
  initiallyFollowing,
  followingLabel = 'Acompañás',
  followVariant = 'soft',
  size = 'sm',
  fullWidth = false,
  requested = false,
  followState,
  requestId = null,
  className,
}: {
  userId: string;
  initiallyFollowing: boolean;
  followingLabel?: string;
  followVariant?: 'soft' | 'presence';
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  requested?: boolean;
  followState?: DiscoverFollowState;
  requestId?: string | null;
  className?: string;
}) {
  const [state, setState] = useState<DiscoverFollowState>(
    followState ?? (requested ? 'REQUESTED' : initiallyFollowing ? 'FOLLOWING' : 'NONE'),
  );
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(requestId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshState() {
    const profile = await getPublicProfile(userId);
    setState(profile.followState);
    if (profile.followState !== 'REQUESTED') setPendingRequestId(null);
  }

  async function cancelRequest() {
    setSubmitting(true);
    setError(null);
    try {
      let id = pendingRequestId;
      if (!id) {
        const outgoing = await listOutgoingFollowRequests();
        id = outgoing.find((item) => item.otherUser.id === userId)?.requestId ?? null;
      }
      if (!id) {
        await refreshState();
        return;
      }
      await cancelFollowRequest(id);
      setPendingRequestId(null);
      setState('NONE');
    } catch (cancelError) {
      if (isStaleFollowRequest(cancelError)) {
        setError(FOLLOW_REQUEST_STALE);
        await refreshState().catch(() => setState('NONE'));
        return;
      }
      setError('No pudimos hacerlo ahora. Probá de nuevo en un momento.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClick() {
    setSubmitting(true);
    setError(null);
    try {
      if (state === 'FOLLOWING') {
        await unfollowUser(userId);
        setState('NONE');
        return;
      }
      const result = await followUser(userId);
      setPendingRequestId(result.requestId);
      setState(result.followState);
    } catch (actionError) {
      if (isStaleFollowRequest(actionError)) {
        await refreshState().catch(() => undefined);
        return;
      }
      setError('No pudimos hacerlo ahora. Probá de nuevo en un momento.');
    } finally {
      setSubmitting(false);
    }
  }

  if (state === 'REQUESTED') {
    return (
      <div className={cn('inline-flex flex-col gap-1', fullWidth ? 'w-full items-stretch' : 'items-end', className)}>
        <p className="text-sm text-muted-foreground">Solicitud enviada</p>
        <Button type="button" size={size} fullWidth={fullWidth} variant="outline" loading={submitting} onClick={() => void cancelRequest()}>
          Cancelar solicitud
        </Button>
        {error ? (
          <p role="alert" className="text-xs font-medium text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn('inline-flex flex-col gap-1', fullWidth ? 'w-full items-stretch' : 'items-end', className)}>
      <Button
        type="button"
        size={size}
        fullWidth={fullWidth}
        variant={state === 'FOLLOWING' ? 'outline' : followVariant}
        loading={submitting}
        aria-pressed={state === 'FOLLOWING'}
        onClick={() => void handleClick()}
      >
        {state === 'FOLLOWING' ? <Check className="size-4" /> : <UserPlus className="size-4" />}
        {state === 'FOLLOWING' ? followingLabel : 'Acompañar'}
      </Button>
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
