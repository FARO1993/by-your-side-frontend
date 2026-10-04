import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Globe, Lock, Users, VenetianMask } from 'lucide-react';
import { createPost } from '../api/posts';
import { setStatus } from '../api/statuses';
import type { CreatePostRequest, StatusMood } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/cn';
import { friendlyError } from '../lib/friendlyError';
import { MOOD_TONE_STYLES, STATUS_MOOD_UI } from '../lib/visual';
import Avatar from '../components/Avatar';
import { DraftNotice } from '../components/byourside/draft-notice';
import { SensitiveToggle } from '../components/byourside/sensitive-toggle';
import { CrisisNotice } from '../components/safety/CrisisNotice';
import { useDraft } from '../hooks/useDraft';
import { draftKey } from '../lib/drafts';
import { Button, Card } from '../components/byourside/ui';

const moods = Object.entries(STATUS_MOOD_UI) as [StatusMood, { label: string; tone: keyof typeof MOOD_TONE_STYLES }][];

const audiences: { value: CreatePostRequest['visibility']; label: string; icon: typeof Globe }[] = [
  { value: 'PUBLIC', label: 'Público', icon: Globe },
  { value: 'FOLLOWERS_ONLY', label: 'Solo seguidores', icon: Users },
  { value: 'PRIVATE', label: 'Solo yo', icon: Lock },
];

export default function CreatePostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { text: content, setText: setContent, discard, restored } = useDraft(draftKey(user?.id, 'create-post'));
  const [mood, setMood] = useState<StatusMood | null>(null);
  const [visibility, setVisibility] = useState<CreatePostRequest['visibility']>('PUBLIC');
  const [contentWarning, setContentWarning] = useState(false);
  const [searchParams] = useSearchParams();
  const [anonymous, setAnonymous] = useState(searchParams.get('anonimo') === '1');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remaining = 2000 - content.length;
  const name = user?.displayName || user?.username || '';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      // En anónimo no se publica el ánimo: es un estado CON nombre, y hacerlo
      // al mismo tiempo permitiría asociarlo con el post anónimo.
      if (mood && !anonymous) await setStatus(mood);
      await createPost({
        content: content.trim(),
        visibility: anonymous ? 'PUBLIC' : visibility,
        contentWarning,
        anonymous,
      });
      discard();
      navigate(anonymous ? '/anonimo' : '/feed');
    } catch (err) {
      if (anonymous && axios.isAxiosError(err) && err.response?.status === 429) {
        setError('Ya compartiste 3 veces en anónimo en las últimas 24 horas. Podés publicarlo con tu nombre o volver más tarde: tu texto sigue acá.');
      } else {
        setError(friendlyError(err, 'No pudimos compartirlo. Tu texto sigue acá, podés intentar de nuevo.'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Volver"
          onClick={() => navigate('/feed')}
          className="inline-flex size-10 items-center justify-center rounded-full bg-card shadow-soft"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-serif text-2xl sm:text-3xl">Compartir algo</h1>
      </header>

      <Card className="p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {anonymous ? (
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground"
                >
                  <VenetianMask className="size-5" />
                </span>
                <div>
                  <p className="font-medium">Alguien de la comunidad</p>
                  <p className="text-sm text-muted-foreground">Así te van a ver los demás.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Avatar avatarId={user?.avatarId} name={name} size="md" />
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-muted-foreground">Acá te leemos sin apuro.</p>
                </div>
              </div>
            )}
            <label
              className={cn(
                'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm transition-colors',
                anonymous ? 'border-foreground/30 bg-muted text-foreground' : 'border-border bg-background text-foreground/80',
              )}
            >
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(event) => setAnonymous(event.target.checked)}
                className="size-4 accent-[var(--foreground)]"
              />
              <VenetianMask className="size-4" aria-hidden="true" />
              Publicar en anónimo
            </label>
          </div>
          {anonymous ? (
            <p className="rounded-2xl bg-muted/60 p-3 text-sm text-muted-foreground">
              Va al <strong className="font-medium text-foreground">espacio anónimo</strong>, sin tu nombre ni tu foto, y
              no aparece en tu perfil. Se responde con Presencia o Escucha. Podés compartir hasta 3 veces por día así.
            </p>
          ) : null}

          <textarea
            autoFocus
            rows={6}
            maxLength={2000}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="¿Qué querés compartir hoy? No hace falta que esté perfecto."
            className="w-full resize-none bg-transparent text-[1.05rem] leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
          />
          <CrisisNotice text={content} />
          <div className="flex flex-wrap items-start justify-between gap-2">
            <DraftNotice restored={restored} hasText={content.trim() !== ''} onDiscard={discard} />
            <p className="ml-auto text-right text-xs text-muted-foreground" aria-live="polite">
              {remaining} caracteres
            </p>
          </div>

          {/* En anónimo: sin ánimo (es un estado con nombre) y siempre público. */}
          {anonymous ? null : (
            <>
              <div>
                <p className="mb-2 text-sm font-medium">¿Cómo estás hoy? (opcional)</p>
                <div className="flex flex-wrap gap-2">
                  {moods.map(([value, meta]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMood(value)}
                      className={cn(
                        'min-h-9 rounded-full border border-border bg-background px-3 text-sm',
                        mood === value ? MOOD_TONE_STYLES[meta.tone].chip : 'text-foreground/80',
                      )}
                    >
                      {meta.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">¿Quién puede verlo?</p>
                <div className="flex flex-wrap gap-2">
                  {audiences.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={visibility === value}
                      onClick={() => setVisibility(value)}
                      className={cn(
                        'inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm',
                        visibility === value
                          ? 'bg-presence-soft text-presence-strong'
                          : 'bg-background text-foreground/80',
                      )}
                    >
                      <Icon className="size-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <SensitiveToggle checked={contentWarning} onChange={setContentWarning} text={content} />

          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => navigate('/feed')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!content.trim()} loading={submitting}>
              Compartir
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
