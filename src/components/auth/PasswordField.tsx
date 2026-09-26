import { useId, useState, type ComponentPropsWithoutRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { TextField } from '../byourside/ui';

type PasswordFieldProps = Omit<ComponentPropsWithoutRef<typeof TextField>, 'type' | 'suffix' | 'id'>;

export function PasswordField(props: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Ocultar contraseña' : 'Mostrar contraseña';

  return (
    <TextField
      {...props}
      id={id}
      type={visible ? 'text' : 'password'}
      suffix={
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 ease-[var(--ease-calm)] hover:bg-muted hover:text-foreground"
          aria-label={label}
          aria-pressed={visible}
          aria-controls={id}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      }
    />
  );
}
