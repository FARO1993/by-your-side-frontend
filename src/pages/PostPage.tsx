import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { getPost } from '../api/posts';
import type { Post } from '../api/types';
import PostCard from '../components/PostCard';
import { ErrorState } from '../components/byourside/ui';
import { PostCardSkeleton } from '../components/byourside/post-skeleton';

export default function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const [view, setView] = useState<{ postId: string; post: Post | null; error: string | null; gone: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!postId) return undefined;
    let cancelled = false;
    getPost(postId)
      .then((loaded) => {
        if (!cancelled) setView({ postId, post: loaded, error: null, gone: false });
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        const gone = axios.isAxiosError(loadError) && loadError.response?.status === 404;
        setView({
          postId,
          post: null,
          error: gone ? 'Esta publicación ya no está disponible.' : 'No pudimos abrir esta publicación. Probá de nuevo.',
          gone,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [postId, attempt]);

  const ready = view?.postId === postId ? view : null;
  const post = ready?.post ?? null;
  const error = ready?.error ?? null;

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Publicación</h1>
      <Link to="/feed" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver al feed
      </Link>
      {!ready ? <PostCardSkeleton /> : null}
      {error ? (
        <ErrorState
          description={error}
          onRetry={
            ready?.gone
              ? undefined
              : () => {
                  setView(null);
                  setAttempt((current) => current + 1);
                }
          }
        />
      ) : null}
      {post ? <PostCard post={post} /> : null}
    </div>
  );
}
