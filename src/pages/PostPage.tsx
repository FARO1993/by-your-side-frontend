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
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    getPost(postId)
      .then(setPost)
      .catch(() => setError('No se pudo cargar este post'))
      .finally(() => setLoading(false));
  }, [postId]);

  return (
    <div className="space-y-4">
      <Link to="/feed" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Volver al feed
      </Link>
      {loading ? <PostCardSkeleton /> : null}
      {error || (!loading && !post) ? (
        <ErrorState description={error ?? 'Post no encontrado'} />
      ) : null}
      {post ? <PostCard post={post} /> : null}
    </div>
  );
}
