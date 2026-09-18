import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Post } from '../api/types';
import { useAuth } from '../context/AuthContext';
import CommentList from './CommentList';
import FollowButton from './FollowButton';
import SupportButton from './SupportButton';
import Avatar from './Avatar';

export default function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const isOwnPost = user?.id === post.author.id;

  return (
    <article className="mb-4 border-l-2 border-horizon bg-white p-4">
      <div className="flex items-center justify-between">
        <Link to={`/profile/${post.author.id}`} className="flex items-center gap-2">
          <Avatar avatarUrl={post.author.avatarUrl} name={post.author.displayName || post.author.username} size="sm" />
          <span className="font-medium text-ink hover:text-horizon">
            {post.author.displayName || post.author.username}
          </span>
        </Link>
        {!isOwnPost && (
          <FollowButton userId={post.author.id} initiallyFollowing={post.followedByCurrentUser} />
        )}
      </div>

      <p className="mt-2 whitespace-pre-wrap text-ink">{post.content}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-dusk">
        <SupportButton
          postId={post.id}
          initialSupported={post.supportedByCurrentUser}
          initialCount={post.supportCount}
        />
        <time>{new Date(post.createdAt).toLocaleString()}</time>
        <button
          onClick={() => setShowComments((prev) => !prev)}
          className="font-medium text-dusk transition-colors hover:text-horizon"
        >
          {showComments ? 'Ocultar comentarios' : 'Ver comentarios'}
        </button>
      </div>

      {showComments && (
        <div className="mt-4 border-l border-mist pl-4">
          <CommentList postId={post.id} />
        </div>
      )}
    </article>
  );
}