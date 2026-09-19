import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Lock, Users } from 'lucide-react';
import axios from 'axios';
import { createPost } from '../api/posts';
import { setStatus } from '../api/statuses';
import type { ApiErrorResponse, CreatePostRequest, StatusMood } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/cn';
import { MOOD_TONE_STYLES, STATUS_MOOD_UI } from '../lib/visual';
import Avatar from '../components/Avatar';
import { Button, Card } from '../components/byourside/ui';

const moods = Object.entries(STATUS_MOOD_UI) as [StatusMood, { label: string; tone: keyof typeof MOOD_TONE_STYLES }][];

const audiences: { value: CreatePostRequest['visibility']; label: string; icon: typeof Globe }[] = [
  { value: 'PUBLIC', label: 'Toda la comunidad', icon: Globe },
  { value: 'FOLLOWERS_ONLY', label: 'Quienes me acompañan', icon: Users },
  { value: 'PRIVATE', label: 'Solo para mí', icon: Lock },
];

export default function CreatePostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<StatusMood | null>(null);
  const [visibility, setVisibility] = useState<CreatePostRequest['visibility']>('PUBLIC');
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
      if (mood) await setStatus(mood);
      await createPost({ content: content.trim(), visibility });
      navigate('/feed');
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setError(err.response?.data.message ?? 'Error al crear el post');
      } else {
        setError('Error al crear el post');
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
          <div className="flex items-center gap-3">
            <Avatar avatarUrl={user?.avatarUrl} name={name} size="md" />
            <div>
              <p className="font-medium">{name}</p>
              <p className="text-sm text-muted-foreground">Acá te leemos sin apuro.</p>
            </div>
          </div>

          <textarea
            autoFocus
            rows={6}
            maxLength={2000}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="¿Qué querés compartir hoy? No hace falta que esté perfecto."
            className="w-full resize-none bg-transparent text-[1.05rem] leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
          />
          <p className="text-right text-xs text-muted-foreground" aria-live="polite">
            {remaining} caracteres
          </p>

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
