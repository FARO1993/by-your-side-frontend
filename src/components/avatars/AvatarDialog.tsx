import { useState } from 'react';
import { setAvatar } from '../../api/users';
import type { User } from '../../api/types';
import { isAvatarId, type AvatarId } from '../../lib/avatars';
import { friendlyError } from '../../lib/friendlyError';
import { Dialog } from '../byourside/dialog';
import { Button } from '../byourside/ui';
import { AvatarPicker } from './AvatarPicker';

/** Cambiar el avatar desde el perfil. */
export function AvatarDialog({
  current,
  name,
  onClose,
  onSaved,
}: {
  current: string | null;
  name: string;
  onClose: () => void;
  onSaved: (user: User) => void;
}) {
  const [value, setValue] = useState<AvatarId | null>(isAvatarId(current) ? current : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setSaving(true);
    setError('');
    try {
      const user = await setAvatar(value);
      onSaved(user);
      onClose();
    } catch (err) {
      setError(friendlyError(err, 'No pudimos guardar tu avatar. Probá de nuevo en un momento.'));
      setSaving(false);
    }
  }

  return (
    <Dialog
      title="Elegí tu avatar"
      description="En ByYourSide no usamos fotos: así cuidamos la privacidad de todos."
      onClose={onClose}
    >
      <AvatarPicker value={value} onChange={setValue} name={name} />
      {error ? (
        <p role="alert" className="mt-3 text-sm text-muted-foreground">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" variant="listening" disabled={saving} onClick={() => void save()}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </Dialog>
  );
}
