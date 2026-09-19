import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import type { Post } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../lib/timeAgo';
import { getSelectedResponse, selectPostResponse } from '../services/postResponseService';
import { RESPONSE_OPTIONS } from '../lib/visual';
import Avatar from './Avatar';
import CommentList from './CommentList';
import FollowButton from './FollowButton';
import { ResponseActions } from './byourside/response-actions';

export default function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [supported, setSupported] = useState(post.supportedByCurrentUser);
  const [supportCount, setSupportCount] = useState(post.supportCount);
  const [selected, setSelected] = useState<string | null>(
    getSelectedResponse(post.id, post.supportedByCurrentUser),
  );
  const [error, setError] = useState<string | null>(null);
  const isOwnPost = user?.id === post.author.id;
  const name = post.author.displayName || post.author.username;
  const respondedKind = RESPONSE_OPTIONS.find((option) => option.id === selected)?.kind ?? null;

  async function handleSelect(optionId: string) {
    const next = selected === optionId ? null : optionId;
    const previous = { selected, supported, supportCount };
    try {
      setError(null);
      const result = await selectPostResponse(post.id, next, supported);
      setSelected(result.selected);
      if (result.support) {
        setSupported(result.support.supportedByCurrentUser);
        setSupportCount(result.support.supportCount);
      }
    } catch {
      setSelected(previous.selected);
      setSupported(previous.supported);
      setSupportCount(previous.supportCount);
      setError('No pudimos guardar tu respuesta. Probá de nuevo en un momento.');
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

      <ResponseActions selectedId={selected} onSelect={handleSelect} />
      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3.5 text-xs text-muted-foreground">
        <div className="flex gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-presence" />
            {supportCount === 1 ? '1 te acompaña' : `${supportCount} te acompañan`}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-listening" />
            {respondedKind === 'listening' ? '1 ofrece escucha' : '0 ofrecen escucha'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowComments((prev) => !prev)}
          className="inline-flex items-center gap-1.5 font-medium hover:text-foreground"
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
