import type { Post } from '../api/types';

export default function PostCard({ post }: { post: Post }) {
  return (
    <article>
      <strong>{post.author.displayName || post.author.username}</strong>
      <p>{post.content}</p>
      <time>{new Date(post.createdAt).toLocaleString()}</time>
    </article>
  );
}