import { useEffect, useId, useRef, useState } from 'react';
import { setAvatar } from '../../api/users';
import type { AvatarId } from '../../lib/avatars';
import { friendlyError } from '../../lib/friendlyError';
import { AvatarPicker } from '../avatars/AvatarPicker';
import { Logo } from '../byourside/logo';
import { Button } from '../byourside/ui';

/**
 * Al entrar por primera vez: elegir cómo te ven. Se puede saltear ("Ahora
 * no") y cambiar después desde el perfil. Nunca se piden fotos.
 */
export function AvatarOnboarding({ name, onDone }: { name: string; onDone: () => void }) {
  const [value, setValue] = useState<AvatarId | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const headingId = useId();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  async function choose() {
    if (!value) {
      onDone();
      return;
    }
    setSaving(true);
    setError('');
    try {
      await setAvatar(value);
      onDone();
    } catch (err) {
      setError(friendlyError(err, 'No pudimos guardar tu avatar. Podés elegirlo después desde tu perfil.'));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-background">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pt-8 pb-8 sm:pt-14"
      >
        <Logo wordmark />
        <h1 ref={heading} id={headingId} tabIndex={-1} className="mt-8 font-serif text-2xl outline-none sm:text-3xl">
          ¿Cómo querés que te vean?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          En ByYourSide no usamos fotos: así cuidamos la privacidad de todos. Elegí un dibujo que te guste. Lo podés
          cambiar cuando quieras.
        </p>
        <div className="mt-6">
          <AvatarPicker value={value} onChange={setValue} name={name} />
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-muted-foreground">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>
            Ahora no
          </Button>
          <Button type="button" variant="listening" disabled={saving} onClick={() => void choose()}>
            {value ? (saving ? 'Guardando…' : 'Elegir este') : 'Seguir con mis iniciales'}
          </Button>
        </div>
      </div>
    </div>
  );
}
