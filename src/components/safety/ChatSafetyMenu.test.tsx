import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  blockUser: vi.fn(),
  unblockUser: vi.fn(),
  muteUser: vi.fn(),
  unmuteUser: vi.fn(),
  createReport: vi.fn(),
}));

vi.mock('../../api/blocks', () => ({ blockUser: api.blockUser, unblockUser: api.unblockUser }));
vi.mock('../../api/mutes', () => ({ muteUser: api.muteUser, unmuteUser: api.unmuteUser }));
vi.mock('../../api/reports', () => ({ createReport: api.createReport }));

import { ChatSafetyMenu, type ChatRelation } from './ChatSafetyMenu';

function renderMenu(relation: ChatRelation | null, onRelationChange = vi.fn()) {
  render(
    <MemoryRouter>
      <ChatSafetyMenu userId="u2" name="Lucía" relation={relation} onRelationChange={onRelationChange} />
    </MemoryRouter>,
  );
  return onRelationChange;
}

async function openMenu() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Opciones de la conversación con Lucía' }));
  return user;
}

describe('ChatSafetyMenu', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset().mockResolvedValue(undefined));
  });

  it('offers profile, mute, block and report when the relation is known', async () => {
    renderMenu({ blocked: false, muted: false });
    await openMenu();
    const items = within(screen.getByRole('menu')).getAllByRole('menuitem').map((item) => item.textContent);
    expect(items).toEqual(['Ver perfil', 'Silenciar', 'Bloquear', 'Reportar']);
  });

  it('only offers profile and report when the relation is unknown', async () => {
    renderMenu(null);
    await openMenu();
    const items = within(screen.getByRole('menu')).getAllByRole('menuitem').map((item) => item.textContent);
    expect(items).toEqual(['Ver perfil', 'Reportar']);
  });

  it('closes with Escape and returns focus to the trigger', async () => {
    renderMenu({ blocked: false, muted: false });
    const user = await openMenu();
    expect(screen.getByRole('menuitem', { name: 'Ver perfil' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Silenciar' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Opciones de la conversación con Lucía' })).toHaveFocus();
  });

  it('mutes right away and announces it', async () => {
    const onChange = renderMenu({ blocked: false, muted: false });
    const user = await openMenu();
    await user.click(screen.getByRole('menuitem', { name: 'Silenciar' }));
    expect(api.muteUser).toHaveBeenCalledWith('u2');
    expect(onChange).toHaveBeenCalledWith({ blocked: false, muted: true });
    expect(screen.getByRole('status')).toHaveTextContent('Silenciaste a Lucía');
  });

  it('asks for confirmation before blocking', async () => {
    const onChange = renderMenu({ blocked: false, muted: false });
    const user = await openMenu();
    await user.click(screen.getByRole('menuitem', { name: 'Bloquear' }));

    const dialog = screen.getByRole('dialog', { name: 'Bloquear a Lucía' });
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    expect(api.blockUser).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Bloquear' }));
    expect(api.blockUser).toHaveBeenCalledWith('u2');
    expect(onChange).toHaveBeenCalledWith({ blocked: true, muted: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the dialog open and explains when blocking fails', async () => {
    api.blockUser.mockRejectedValue(new Error('offline'));
    const onChange = renderMenu({ blocked: false, muted: false });
    const user = await openMenu();
    await user.click(screen.getByRole('menuitem', { name: 'Bloquear' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Bloquear' }));
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos actualizar esa relación');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reports with a reason, shows urgent help for self-harm risk, and offers to block', async () => {
    renderMenu({ blocked: false, muted: false });
    const user = await openMenu();
    await user.click(screen.getByRole('menuitem', { name: 'Reportar' }));

    const dialog = screen.getByRole('dialog', { name: 'Reportar a Lucía' });
    const submit = within(dialog).getByRole('button', { name: 'Enviar reporte' });
    expect(submit).toBeDisabled();

    await user.click(within(dialog).getByRole('radio', { name: /riesgo de hacerse daño/ }));
    expect(within(dialog).getByText(/911/)).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Ver todas las líneas de ayuda' })).toHaveAttribute('href', '/help');

    await user.type(within(dialog).getByRole('textbox'), '  Dijo que no quiere seguir  ');
    await user.click(submit);

    expect(api.createReport).toHaveBeenCalledWith({
      targetType: 'USER',
      targetId: 'u2',
      reason: 'SELF_HARM_RISK',
      description: '  Dijo que no quiere seguir  ',
    });
    const done = screen.getByRole('dialog', { name: 'Gracias por avisarnos' });
    expect(within(done).getByText(/911/)).toBeInTheDocument();

    await user.click(within(done).getByRole('button', { name: 'Bloquear también' }));
    expect(screen.getByRole('dialog', { name: 'Bloquear a Lucía' })).toBeInTheDocument();
  });

  it('keeps the report form when sending fails', async () => {
    api.createReport.mockRejectedValue(new Error('offline'));
    renderMenu(null);
    const user = await openMenu();
    await user.click(screen.getByRole('menuitem', { name: 'Reportar' }));
    await user.click(screen.getByRole('radio', { name: 'Spam o publicidad' }));
    await user.click(screen.getByRole('button', { name: 'Enviar reporte' }));
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos enviar el reporte');
    expect(screen.getByRole('dialog', { name: 'Reportar a Lucía' })).toBeInTheDocument();
  });
});

describe('Dialog focus', () => {
  it('focuses the data-autofocus control even when it is not first', async () => {
    const { Dialog } = await import('../byourside/dialog');
    render(
      <Dialog title="Prueba" onClose={() => {}}>
        <button type="button">Primero</button>
        <button type="button" data-autofocus>
          Preferido
        </button>
      </Dialog>,
    );
    expect(screen.getByRole('button', { name: 'Preferido' })).toHaveFocus();
  });
});
