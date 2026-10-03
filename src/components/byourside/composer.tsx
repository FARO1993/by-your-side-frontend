import { useState, type FormEvent } from 'react';
import { useDraft } from '../../hooks/useDraft';
import type { StatusMood } from '../../api/types';
import { cn } from '../../lib/cn';
import { MOOD_TONE_STYLES, STATUS_MOOD_UI } from '../../lib/visual';
import Avatar from '../Avatar';
import { CrisisNotice } from '../safety/CrisisNotice';
import { DraftNotice } from './draft-notice';
import { SensitiveToggle } from './sensitive-toggle';
import { Button } from './ui';

const CHECK_IN_MOODS: StatusMood[] = ['WELL', 'NEED_DISTRACTION', 'DIFFICULT_DAY'];

const chipClass =
  'min-h-11 rounded-full border border-border bg-background px-3 py-1.5 text-left text-sm leading-snug text-foreground/80';

export function Composer({
  authorName,
  avatarId,
  onSubmit,
  onMood,
  submitting = false,
  draftKey = null,
}: {
  authorName: string;
  avatarId?: string | null;
  onSubmit: (content: string, options: { contentWarning: boolean }) => Promise<void> | void;
  onMood?: (mood: StatusMood) => void;
  submitting?: boolean;
  /** Clave de borrador (lib/drafts.ts). null = no guardar. */
  draftKey?: string | null;
}) {
  const { text: content, setText: setContent, discard, restored } = useDraft(draftKey);
  const [mood, setMood] = useState<StatusMood | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [contentWarning, setContentWarning] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    setSubmitError(null);
    try {
      await onSubmit(content.trim(), { contentWarning });
      setContent('');
      setContentWarning(false);
    } catch {
      setSubmitError('No pudimos compartirlo. Tu texto sigue acá, podés intentar de nuevo.');
    }
  }

  return (
    <section className="rounded-2xl bg-card p-4 shadow-soft sm:p-5">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Avatar avatarId={avatarId} name={authorName} size="md" />
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
          <CrisisNotice text={content} className="mb-3" />
          {submitError ? (
            <p role="alert" className="mb-2 text-xs font-medium text-destructive">
              {submitError}
            </p>
          ) : null}
          {draftKey ? (
            <DraftNotice restored={restored} hasText={content.trim() !== ''} onDiscard={discard} className="mb-2" />
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
            <p className="text-xs text-muted-foreground">Compartís con quienes te acompañan.</p>
            <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
              <SensitiveToggle checked={contentWarning} onChange={setContentWarning} text={content} compact />
              <Button type="submit" size="sm" disabled={!content.trim()} loading={submitting}>
                Compartir
              </Button>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
