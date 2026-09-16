import { useState } from 'react';
import type { Post } from '../api/types';
import { useAuth } from '../context/AuthContext';
import CommentList from './CommentList';
import FollowButton from './FollowButton';

export default function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const isOwnPost = user?.id === post.author.id;

  return (
    <article>
      <div>
        <strong>{post.author.displayName || post.author.username}</strong>
        {!isOwnPost && <FollowButton userId={post.author.id} initiallyFollowing={post.followedByCurrentUser} />}
      </div>

      <p>{post.content}</p>
      <time>{new Date(post.createdAt).toLocaleString()}</time>

      <button onClick={() => setShowComments((prev) => !prev)}>
        {showComments ? 'Ocultar comentarios' : 'Ver comentarios'}
      </button>

      {showComments && <CommentList postId={post.id} />}
    </article>
  );
}