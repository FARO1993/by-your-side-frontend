import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getPost } from '../api/posts';
import type { Post } from '../api/types';
import PostCard from '../components/PostCard';
import { ErrorState } from '../components/byourside/ui';
import { PostCardSkeleton } from '../components/byourside/post-skeleton';

export default function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const [view, setView] = useState<{ postId: string; post: Post | null; error: string | null } | null>(null);

  useEffect(() => {
    if (!postId) return undefined;
    let cancelled = false;
    getPost(postId)
      .then((loaded) => {
        if (!cancelled) setView({ postId, post: loaded, error: null });
      })
      .catch(() => {
        if (!cancelled) setView({ postId, post: null, error: 'No se pudo cargar este post' });
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const ready = view?.postId === postId ? view : null;
  const post = ready?.post ?? null;
  const error = ready?.error ?? null;

  return (
    <div className="space-y-4">
      <Link to="/feed" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Volver al feed
      </Link>
      {!ready ? <PostCardSkeleton /> : null}
      {error ? <ErrorState description={error} /> : null}
      {post ? <PostCard post={post} /> : null}
    </div>
  );
}
