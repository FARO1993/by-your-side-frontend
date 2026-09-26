import { useState, type FormEvent } from 'react';
import type { StatusMood } from '../../api/types';
import { cn } from '../../lib/cn';
import { MOOD_TONE_STYLES, STATUS_MOOD_UI } from '../../lib/visual';
import Avatar from '../Avatar';
import { Button } from './ui';

const CHECK_IN_MOODS: StatusMood[] = ['WELL', 'NEED_DISTRACTION', 'DIFFICULT_DAY'];

const chipClass =
  'min-h-11 rounded-full border border-border bg-background px-3 py-1.5 text-left text-sm leading-snug text-foreground/80';

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
          <h2 className="font-serif text-xl text-balance sm:text-2xl">¿Cómo llegás hoy?</h2>
          <div className="mt-3 mb-4 flex flex-wrap gap-2" role="group" aria-label="Cómo llegás hoy">
            {CHECK_IN_MOODS.map((value) => {
              const meta = STATUS_MOOD_UI[value];
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={mood === value}
                  onClick={() => {
                    setMood(value);
                    onMood?.(value);
                  }}
                  className={cn(chipClass, mood === value ? MOOD_TONE_STYLES[meta.tone].chip : undefined)}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
          <textarea
            rows={2}
            value={content}
            maxLength={2000}
            onChange={(event) => setContent(event.target.value)}
            placeholder="¿Cómo venís hoy? Acá te leemos sin apuro…"
            className="w-full resize-none bg-transparent text-[0.975rem] leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
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
