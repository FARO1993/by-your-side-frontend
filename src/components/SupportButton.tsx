import { useState } from 'react';
import { addSupport, removeSupport } from '../api/posts';

export default function SupportButton({
  postId,
  initialSupported,
  initialCount,
}: {
  postId: string;
  initialSupported: boolean;
  initialCount: number;
}) {
  const [supported, setSupported] = useState(initialSupported);
  const [count, setCount] = useState(initialCount);
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setSubmitting(true);
    try {
      const summary = supported ? await removeSupport(postId) : await addSupport(postId);
      setSupported(summary.supportedByCurrentUser);
      setCount(summary.supportCount);
    } catch {
      // Silencioso a proposito, mismo criterio que FollowButton: no
      // interrumpimos la lectura del post por un fallo de red puntual.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={submitting}
      className={
        supported
          ? 'flex items-center gap-1.5 text-sm font-medium text-horizon'
          : 'flex items-center gap-1.5 text-sm font-medium text-dusk transition-colors hover:text-horizon'
      }
    >
      <span>{supported ? '💛' : '🤍'}</span>
      <span className="whitespace-nowrap">
        {count === 0
          ? 'Enviar apoyo'
          : count === 1
            ? '1 persona está con vos'
            : `${count} personas están con vos`}
      </span>
    </button>
  );
}