import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Dialog } from './dialog';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      <button type="button">Afuera</button>
      {open ? (
        <Dialog title="Confirmar" onClose={() => setOpen(false)}>
          <button type="button">Primero</button>
          <button type="button" onClick={() => setOpen(false)}>
            Último
          </button>
        </Dialog>
      ) : null}
    </>
  );
}

describe('Dialog', () => {
  it('is a labelled modal that moves focus inside', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    expect(screen.getByRole('dialog', { name: 'Confirmar' })).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Primero' })).toHaveFocus();
  });

  it('keeps Tab and Shift+Tab inside the dialog', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    await user.tab();
    expect(screen.getByRole('button', { name: 'Último' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Primero' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Último' })).toHaveFocus();
  });

  it('closes with Escape and gives focus back to the opener', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Abrir' });
    await user.click(opener);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
