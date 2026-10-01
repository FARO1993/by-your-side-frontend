import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CompanionCandidate, CompanionNeed, CompanionOffering } from '../api/types';

const api = vi.hoisted(() => ({
  getMyNeed: vi.fn(),
  setNeed: vi.fn(),
  cancelNeed: vi.fn(),
  getMyOffering: vi.fn(),
  setOffering: vi.fn(),
  cancelOffering: vi.fn(),
  listCompatibleOfferings: vi.fn(),
  getOrCreateConversation: vi.fn(),
}));

vi.mock('../api/companion', () => ({
  getMyNeed: api.getMyNeed,
  setNeed: api.setNeed,
  cancelNeed: api.cancelNeed,
  getMyOffering: api.getMyOffering,
  setOffering: api.setOffering,
  cancelOffering: api.cancelOffering,
  listCompatibleOfferings: api.listCompatibleOfferings,
}));

vi.mock('../api/chat', () => ({
  getOrCreateConversation: api.getOrCreateConversation,
}));

import CompanionModePage from './CompanionModePage';

function need(type: CompanionNeed['type'] = 'TALK'): CompanionNeed {
  return { id: 'need-1', type, createdAt: '2026-09-20T12:00:00.000Z', expiresAt: '2026-09-20T14:00:00.000Z' };
}

function offering(type: CompanionOffering['type'] = 'LISTEN'): CompanionOffering {
  return { id: 'off-1', type, createdAt: '2026-09-20T12:00:00.000Z', expiresAt: '2026-09-20T18:00:00.000Z' };
}

function candidate(offeringType: CompanionCandidate['offeringType'] = 'LISTEN'): CompanionCandidate {
  return {
    user: { id: 'user-2', username: 'luz', displayName: 'Luz', avatarUrl: null },
    offeringType,
    expiresAt: '2026-09-20T18:00:00.000Z',
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/companion']}>
      <Routes>
        <Route path="/companion" element={<CompanionModePage />} />
        <Route path="/messages/:conversationId" element={<p>Conversación</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CompanionModePage', () => {
  beforeEach(() => {
    api.getMyNeed.mockReset();
    api.setNeed.mockReset();
    api.cancelNeed.mockReset();
    api.getMyOffering.mockReset();
    api.setOffering.mockReset();
    api.cancelOffering.mockReset();
    api.listCompatibleOfferings.mockReset();
    api.getOrCreateConversation.mockReset();
    api.getMyNeed.mockResolvedValue(null);
    api.getMyOffering.mockResolvedValue(null);
    api.listCompatibleOfferings.mockResolvedValue([]);
  });

  it('explains the limits of accompanying before offering, and hides them once available', async () => {
    renderPage();
    expect(await screen.findByText('Antes de ofrecerte')).toBeInTheDocument();
    expect(screen.getByText(/Acompañar no es hacer terapia/)).toBeInTheDocument();
    expect(screen.getByText(/Podés cortar la charla cuando lo necesites/)).toBeInTheDocument();
  });

  it('does not repeat the limits while already available', async () => {
    api.getMyOffering.mockResolvedValue(offering());
    renderPage();
    expect(await screen.findByText('Estás disponible')).toBeInTheDocument();
    expect(screen.queryByText('Antes de ofrecerte')).not.toBeInTheDocument();
  });

  it('reminds that companions are community members, not professionals', async () => {
    api.getMyNeed.mockResolvedValue(need());
    api.listCompatibleOfferings.mockResolvedValue([candidate()]);
    renderPage();
    expect(await screen.findByText(/Son personas de la comunidad, no profesionales/)).toBeInTheDocument();
  });

  it('starts without a need or an offering and does not search candidates', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Modo compañía' })).toBeInTheDocument();
    expect(await screen.findByText('¿Cómo querés que estemos con vos?')).toBeInTheDocument();
    expect(screen.getByText('¿Cómo podés estar ahora?')).toBeInTheDocument();
    expect(screen.queryByText('Quienes pueden acompañarte')).not.toBeInTheDocument();
    expect(api.listCompatibleOfferings).not.toHaveBeenCalled();
  });

  it('sets and cancels a need, then shows a calm empty search', async () => {
    api.setNeed.mockResolvedValue(need('LISTEN_TO_ME'));
    api.cancelNeed.mockResolvedValue(undefined);
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Solo escucharme' }));
    expect(await screen.findByText('Estás buscando compañía')).toBeInTheDocument();
    expect(screen.getByText(/Solo escucharme/)).toBeInTheDocument();
    await waitFor(() => expect(api.listCompatibleOfferings).toHaveBeenCalled());
    expect(screen.getByText('Ahora mismo no encontramos a alguien disponible de esa forma.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar búsqueda' }));
    await waitFor(() => expect(screen.queryByText('Estás buscando compañía')).not.toBeInTheDocument());
    expect(screen.queryByText('Quienes pueden acompañarte')).not.toBeInTheDocument();
  });

  it('sets and cancels an offering without clearing a need', async () => {
    api.getMyNeed.mockResolvedValue(need());
    api.setOffering.mockResolvedValue(offering('DISTRACT'));
    api.cancelOffering.mockResolvedValue(undefined);
    renderPage();

    expect(await screen.findByText('Estás buscando compañía')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Podemos distraernos' }));
    expect(await screen.findByText('Estás disponible')).toBeInTheDocument();
    expect(screen.getByText(/Podemos distraernos/)).toBeInTheDocument();
    expect(screen.getByText('Estás buscando compañía')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar disponibilidad' }));
    await waitFor(() => expect(screen.queryByText('Estás disponible')).not.toBeInTheDocument());
    expect(screen.getByText('Estás buscando compañía')).toBeInTheDocument();
  });

  it('shows compatible people and opens the existing conversation', async () => {
    api.getMyNeed.mockResolvedValue(need());
    api.getMyOffering.mockResolvedValue(offering());
    api.listCompatibleOfferings.mockResolvedValue([candidate('LISTEN'), { ...candidate('TALK'), user: { id: 'user-3', username: 'sol', displayName: 'Sol', avatarUrl: null } }]);
    api.getOrCreateConversation.mockResolvedValue({ id: 'conversation-9' });
    renderPage();

    expect(await screen.findByText('Luz')).toBeInTheDocument();
    expect(screen.getByText('Puede escucharte')).toBeInTheDocument();
    expect(screen.getByText('Puede conversar')).toBeInTheDocument();
    expect(screen.getByText('Estás disponible')).toBeInTheDocument();
    expect(screen.queryByText(/match/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'Escribirle' })[0]);
    expect(api.getOrCreateConversation).toHaveBeenCalledWith('user-2');
    expect(await screen.findByText('Conversación')).toBeInTheDocument();
  });

  it('keeps the confirmed need when saving fails', async () => {
    api.getMyNeed.mockResolvedValue(need('TALK'));
    const error = new AxiosError('bad');
    error.response = { status: 400, data: {}, statusText: 'Bad Request', headers: {}, config: {} as never };
    api.setNeed.mockRejectedValue(error);
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Cambiar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Solo acompañame' }));
    expect(await screen.findByText('Esa opción no es válida. Elegí otra.')).toBeInTheDocument();
    expect(screen.getByText(/Quiero conversar/)).toBeInTheDocument();
  });
});
