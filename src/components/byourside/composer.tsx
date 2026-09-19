import { useState, type FormEvent } from 'react';
import type { StatusMood } from '../../api/types';
import { cn } from '../../lib/cn';
import { MOOD_TONE_STYLES, STATUS_MOOD_UI } from '../../lib/visual';
import Avatar from '../Avatar';
import { Button } from './ui';

const moods = Object.entries(STATUS_MOOD_UI) as [StatusMood, { label: string; tone: keyof typeof MOOD_TONE_STYLES }][];

export function Composer({
  authorName,
  avatarUrl,
  onSubmit,
  onMood,
  submitting = false,
}: {
  authorName: string;
  avatarUrl?: string | null;
  onSubmit: (content: string) => Promise<void> | void;
  onMood?: (mood: StatusMood) => void;
  submitting?: boolean;
}) {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<StatusMood | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    await onSubmit(content.trim());
    setContent('');
  }

  return (
    <section className="rounded-2xl bg-card p-4 shadow-soft sm:p-5">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Avatar avatarUrl={avatarUrl} name={authorName} size="md" />
        <div className="min-w-0 flex-1">
          <textarea
            rows={2}
            value={content}
            maxLength={2000}
            onChange={(event) => setContent(event.target.value)}
            placeholder="¿Cómo venís hoy? Acá te leemos sin apuro…"
            className="w-full resize-none bg-transparent text-[0.975rem] leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
          />
          <p className="mb-3 text-sm font-medium text-muted-foreground">¿Cómo estás hoy?</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {moods.map(([value, meta]) => (
              <button
                key={value}
                type="button"
                data-on={mood === value}
                onClick={() => {
                  setMood(value);
                  onMood?.(value);
                }}
                className={cn(
                  'min-h-9 rounded-full border border-border bg-background px-3 text-sm',
                  mood === value ? MOOD_TONE_STYLES[meta.tone].chip : 'text-foreground/80',
                )}
              >
                {meta.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <p className="text-xs text-muted-foreground">Compartís con quienes te acompañan.</p>
            <Button type="submit" size="sm" disabled={!content.trim()} loading={submitting}>
              Compartir
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
