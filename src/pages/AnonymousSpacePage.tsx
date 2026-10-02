import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { VenetianMask } from 'lucide-react';
import { getAnonymousFeed } from '../api/posts';
import type { Post } from '../api/types';
import PostCard from '../components/PostCard';
import { PostCardSkeleton } from '../components/byourside/post-skeleton';
import { Button, Card, EmptyState, ErrorState } from '../components/byourside/ui';

type View =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'error' }
  | { kind: 'ready'; posts: Post[]; page: number; last: boolean };

/**
 * Espacio anónimo: posts sin nombre de toda la comunidad (backend V20).
 * Nadie ve quién escribió cada cosa; se responde con Presencia o Escucha.
 */
export default function AnonymousSpacePage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getAnonymousFeed(0)
      .then((page) => {
        if (cancelled) return;
        setView(page ? { kind: 'ready', posts: page.content, page: 0, last: page.last } : { kind: 'unavailable' });
      })
      .catch(() => {
        if (!cancelled) setView({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const loadMore = useCallback(async () => {
    if (view.kind !== 'ready' || view.last) return;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const next = await getAnonymousFeed(view.page + 1);
      if (next) {
        setView({
          kind: 'ready',
          posts: [...view.posts, ...next.content.filter((post) => !view.posts.some((p) => p.id === post.id))],
          page: view.page + 1,
          last: next.last,
        });
      }
    } catch {
      setMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [view]);

  return (
    <div className="space-y-5">
      <Card className="bg-gradient-to-r from-muted via-card to-listening-soft p-6 sm:p-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-card text-foreground/80">
          <VenetianMask className="size-6" aria-hidden="true" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl">Espacio anónimo</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Para lo que cuesta contar con nombre. Nadie ve quién escribió cada cosa, y se responde con Presencia o
          Escucha. Las{' '}
          <Link to="/normas" className="font-medium text-listening-strong underline-offset-2 hover:underline">
            normas de la comunidad
          </Link>{' '}
          valen igual.
        </p>
        <Button className="mt-4" onClick={() => navigate('/create?anonimo=1')}>
          Compartir en anónimo
        </Button>
      </Card>

      {view.kind === 'loading' ? (
        <div className="space-y-4">
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      ) : null}

      {view.kind === 'error' ? (
        <ErrorState
          description="No pudimos traer el espacio anónimo. Probá de nuevo."
          onRetry={() => {
            setView({ kind: 'loading' });
            setAttempt((current) => current + 1);
          }}
        />
      ) : null}

      {view.kind === 'unavailable' ? (
        <EmptyState
          icon={<VenetianMask className="size-6" />}
          title="El espacio anónimo todavía no está disponible"
          description="Estamos terminando de prepararlo. Volvé en un rato."
        />
      ) : null}

      {view.kind === 'ready' && view.posts.length === 0 ? (
        <EmptyState
          icon={<VenetianMask className="size-6" />}
          title="Todavía está en calma por acá"
          description="Cuando alguien comparta sin nombre, va a aparecer en este espacio."
        />
      ) : null}

      {view.kind === 'ready' && view.posts.length > 0 ? (
        <div className="space-y-4">
          {view.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {!view.last ? (
            <div className="flex flex-col items-center gap-2">
              <Button variant="outline" loading={loadingMore} onClick={() => void loadMore()}>
                Ver más
              </Button>
              {moreError ? (
                <p role="alert" className="text-sm text-destructive">
                  No pudimos traer más. Probá de nuevo.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
