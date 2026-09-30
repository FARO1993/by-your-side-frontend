import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MessageSquare } from 'lucide-react';
import type { Post, PostResponseSummary, PostResponseType } from '../api/types';
import { deletePostResponse, setPostResponse } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import { nextPostResponseState, type PostResponseState } from '../lib/postResponse';
import { timeAgo } from '../lib/timeAgo';
import Avatar from './Avatar';
import CommentList from './CommentList';
import FollowButton from './FollowButton';
import { PostResponseMenu } from './byourside/post-response-menu';

export default function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [response, setResponse] = useState<PostResponseState>({
    presenceCount: post.presenceCount,
    listeningCount: post.listeningCount,
    currentUserResponseType: post.currentUserResponseType,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOwnPost = user?.id === post.author.id;
  const name = post.author.displayName || post.author.username;

  async function handleSelect(type: PostResponseType) {
    if (pending) return;
    const removing = response.currentUserResponseType === type;
    const previous = response;
    const optimistic = nextPostResponseState(previous, removing ? null : type);
    setError(null);
    setResponse(optimistic);
    setPending(true);
    try {
      const summary = removing ? await deletePostResponse(post.id) : await setPostResponse(post.id, type);
      setResponse(stateFromSummary(summary));
    } catch (requestError: unknown) {
      setResponse(previous);
      setError(responseErrorMessage(requestError));
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="animate-soft-rise overflow-hidden rounded-2xl bg-card p-5 shadow-soft transition-shadow duration-300 hover:shadow-lift sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <Link to={`/profile/${post.author.id}`} className="flex min-w-0 items-center gap-3">
          <Avatar avatarUrl={post.author.avatarUrl} name={name} size="md" />
          <div className="min-w-0">
            <p className="truncate font-serif text-base font-semibold text-foreground">{name}</p>
            <time className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</time>
          </div>
        </Link>
        {!isOwnPost ? (
          <FollowButton userId={post.author.id} initiallyFollowing={post.followedByCurrentUser} />
        ) : null}
      </div>

      <p className="mt-4 max-w-prose text-[0.975rem] leading-relaxed text-foreground/90 whitespace-pre-wrap">
        {post.content}
      </p>

      {isOwnPost ? null : (
        <PostResponseMenu value={response.currentUserResponseType} disabled={pending} onSelect={(type) => void handleSelect(type)} />
      )}
      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3.5 text-xs text-muted-foreground">
        <ResponseCounts presenceCount={response.presenceCount} listeningCount={response.listeningCount} />
        <button
          type="button"
          onClick={() => setShowComments((current) => !current)}
          className="inline-flex items-center gap-1.5 font-medium hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-listening"
        >
          <MessageSquare className="size-3.5" />
          {showComments ? 'Ocultar respuestas' : 'Respuestas'}
        </button>
      </div>

      {showComments ? (
        <div className="mt-4">
          <CommentList postId={post.id} />
        </div>
      ) : null}
    </article>
  );
}

function ResponseCounts({ presenceCount, listeningCount }: { presenceCount: number; listeningCount: number }) {
  if (presenceCount === 0 && listeningCount === 0) return null;

  return (
    <div className="flex flex-wrap gap-4">
      {presenceCount > 0 ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-presence" />
          Presencia {presenceCount}
        </span>
      ) : null}
      {listeningCount > 0 ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-listening" />
          Escucha {listeningCount}
        </span>
      ) : null}
    </div>
  );
}

function stateFromSummary(summary: PostResponseSummary): PostResponseState {
  return {
    presenceCount: summary.presenceCount,
    listeningCount: summary.listeningCount,
    currentUserResponseType: summary.type,
  };
}

function responseErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.status === 404) return 'Esta publicación ya no está disponible.';
  if (axios.isAxiosError(error) && error.response?.status === 400) return 'Esa respuesta no se pudo guardar.';
  return 'No pudimos guardar tu respuesta. Probá de nuevo en un momento.';
}
