import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { EyeOff, Flag, MessageSquare, VenetianMask } from 'lucide-react';
import type { Post, PostResponseSummary, PostResponseType } from '../api/types';
import { deletePostResponse, setPostResponse } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import { nextPostResponseState, type PostResponseState } from '../lib/postResponse';
import { timeAgo } from '../lib/timeAgo';
import Avatar from './Avatar';
import CommentList from './CommentList';
import FollowButton from './FollowButton';
import { PostResponseMenu } from './byourside/post-response-menu';
import { ReportDialog } from './safety/ReportDialog';

export default function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [response, setResponse] = useState<PostResponseState>({
    presenceCount: post.presenceCount,
    listeningCount: post.listeningCount,
    currentUserResponseType: post.currentUserResponseType,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const author = post.author;
  const isOwnPost = Boolean(author && user?.id === author.id);
  // Anónimo de otra persona: el backend no envía el autor (author = null).
  const anonymousForMe = Boolean(post.anonymous) && !isOwnPost;
  const name = author ? author.displayName || author.username : 'Anónimo';
  // Advertencia de contenido: quien lee elige si abrirlo. El autor lo ve normal.
  const hidden = Boolean(post.contentWarning) && !isOwnPost && !revealed;

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
        {author && !anonymousForMe ? (
          <Link to={`/profile/${author.id}`} className="flex min-w-0 items-center gap-3">
            <Avatar avatarUrl={author.avatarUrl} name={name} size="md" />
            <div className="min-w-0">
              <p className="truncate font-serif text-base font-semibold text-foreground">{name}</p>
              <time className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</time>
            </div>
          </Link>
        ) : (
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <VenetianMask className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-serif text-base font-semibold text-foreground">Alguien de la comunidad</p>
              <time className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</time>
            </div>
          </div>
        )}
        {author && !isOwnPost && !anonymousForMe ? (
          <FollowButton userId={author.id} initiallyFollowing={post.followedByCurrentUser} />
        ) : null}
        {anonymousForMe ? (
          <button
            type="button"
            onClick={() => setReporting(true)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Flag className="size-3.5" aria-hidden="true" />
            Reportar
          </button>
        ) : null}
      </div>

      {post.anonymous && isOwnPost ? (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          <VenetianMask className="size-3.5" aria-hidden="true" />
          Publicado en anónimo · solo vos ves que es tuyo
        </p>
      ) : null}

      {reporting ? (
        <ReportDialog
          targetType="POST"
          targetId={post.id}
          name="esta publicación"
          title="Reportar esta publicación"
          onClose={() => setReporting(false)}
        />
      ) : null}

      {post.contentWarning && isOwnPost ? (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          <EyeOff className="size-3.5" aria-hidden="true" />
          Marcado como sensible
        </p>
      ) : null}

      {hidden ? (
        <div className="relative mt-4 min-h-32 overflow-hidden rounded-xl">
          {/* Texto difuminado solo como textura: oculto para lectores de pantalla y no seleccionable. */}
          <p
            aria-hidden="true"
            inert
            className="max-w-prose select-none text-[0.975rem] leading-relaxed whitespace-pre-wrap text-foreground/70 blur-[7px]"
          >
            {post.content.slice(0, 280)}
          </p>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-card/60 p-4 text-center">
            <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <EyeOff className="size-4 text-muted-foreground" aria-hidden="true" />
              Este post habla de algo sensible
            </p>
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="min-h-9 rounded-full border border-border bg-card px-4 text-sm font-medium shadow-soft hover:bg-muted"
            >
              Leer igual
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 max-w-prose text-[0.975rem] leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {isOwnPost ? null : (
        <PostResponseMenu value={response.currentUserResponseType} disabled={pending} onSelect={(type) => void handleSelect(type)} />
      )}
      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3.5 text-xs text-muted-foreground">
        <ResponseCounts
          presenceCount={response.presenceCount}
          listeningCount={response.listeningCount}
          isOwnPost={isOwnPost}
        />
        {post.anonymous ? (
          // Sin comentarios en anónimos (v1): si el autor comentara, su nombre lo delataría.
          isOwnPost ? null : <span>Se responde con Presencia o Escucha</span>
        ) : (
          <button
            type="button"
            onClick={() => setShowComments((current) => !current)}
            className="inline-flex items-center gap-1.5 font-medium hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-listening"
          >
            <MessageSquare className="size-3.5" />
            {showComments ? 'Ocultar respuestas' : 'Respuestas'}
          </button>
        )}
      </div>

      {showComments && !post.anonymous ? (
        <div className="mt-4">
          <CommentList postId={post.id} />
        </div>
      ) : null}
    </article>
  );
}

function ResponseCounts({
  presenceCount,
  listeningCount,
  isOwnPost,
}: {
  presenceCount: number;
  listeningCount: number;
  isOwnPost: boolean;
}) {
  if (presenceCount === 0 && listeningCount === 0) {
    // Sin "0 respuestas": en lo propio, un recordatorio de que el silencio está bien.
    return isOwnPost ? <span>Tu mensaje está acá. Las respuestas llegan a su tiempo.</span> : <span />;
  }

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
