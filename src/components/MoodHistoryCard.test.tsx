import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MoodHistoryEntry } from '../api/types';

const api = vi.hoisted(() => ({ getMyMoodHistory: vi.fn() }));
vi.mock('../api/statuses', () => ({ getMyMoodHistory: api.getMyMoodHistory }));

import { MoodHistoryCard } from './MoodHistoryCard';

function daysAgo(days: number, hour = 12): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - days, hour).toISOString();
}

function renderCard() {
  return render(
    <MemoryRouter>
      <MoodHistoryCard />
    </MemoryRouter>,
  );
}

describe('MoodHistoryCard', () => {
  // Con llaves: si el callback devuelve una función, vitest la usa como teardown.
  beforeEach(() => {
    api.getMyMoodHistory.mockReset();
  });

  it('shows the last two weeks privately, with a gentle summary and an accessible label per day', async () => {
    const entries: MoodHistoryEntry[] = [
      { id: '1', mood: 'WELL', createdAt: daysAgo(0) },
      { id: '2', mood: 'DIFFICULT_DAY', createdAt: daysAgo(2) },
      { id: '3', mood: 'NEED_DISTRACTION', createdAt: daysAgo(5) },
    ];
    api.getMyMoodHistory.mockResolvedValue(entries);
    renderCard();

    expect(await screen.findByText('En estas dos semanas registraste 3 días: 2 días más tranquilos y 1 día más pesado.')).toBeInTheDocument();
    expect(api.getMyMoodHistory).toHaveBeenCalledWith(14);
    expect(screen.getByText('Solo vos ves esto')).toBeInTheDocument();

    const list = screen.getByRole('list', { name: 'Tus últimos 14 días' });
    const days = list.querySelectorAll('[role="img"]');
    expect(days).toHaveLength(14);
    expect(days[13]).toHaveAccessibleName(/Estoy bien$/);
    expect(days[11]).toHaveAccessibleName(/Día difícil$/);
    expect(days[12]).toHaveAccessibleName(/sin registro$/);

    // Legend: identity never relies on color alone.
    expect(screen.getByText('Más tranquilos')).toBeInTheDocument();
    expect(screen.getByText('Más pesados')).toBeInTheDocument();
    expect(screen.getByText('Sin registro')).toBeInTheDocument();
  });

  it('offers a day-by-day text view', async () => {
    api.getMyMoodHistory.mockResolvedValue([{ id: '1', mood: 'NEED_TO_TALK', createdAt: daysAgo(1) }]);
    const user = userEvent.setup();
    renderCard();
    await user.click(await screen.findByText('Ver día por día'));
    expect(screen.getByText('Necesito hablar')).toBeVisible();
  });

  it('invites without pressure when there are no records', async () => {
    api.getMyMoodHistory.mockResolvedValue([]);
    renderCard();
    expect(await screen.findByText(/Todavía no hay registros/)).toBeInTheDocument();
    expect(screen.queryByText('Ver día por día')).not.toBeInTheDocument();
  });

  it('gently points to help after several heavy days', async () => {
    api.getMyMoodHistory.mockResolvedValue([
      { id: '1', mood: 'DIFFICULT_DAY', createdAt: daysAgo(0) },
      { id: '2', mood: 'NEED_TO_TALK', createdAt: daysAgo(1) },
      { id: '3', mood: 'DIFFICULT_DAY', createdAt: daysAgo(3) },
      { id: '4', mood: 'WELL', createdAt: daysAgo(4) },
    ]);
    renderCard();
    expect(await screen.findByText(/Vienen siendo días pesados/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'hay personas para hablar ahora' })).toHaveAttribute('href', '/help');
  });

  it('does not show the help note for mostly steady days', async () => {
    api.getMyMoodHistory.mockResolvedValue([
      { id: '1', mood: 'DIFFICULT_DAY', createdAt: daysAgo(0) },
      { id: '2', mood: 'WELL', createdAt: daysAgo(1) },
    ]);
    renderCard();
    await screen.findByText(/registraste 2 días/);
    expect(screen.queryByText(/Vienen siendo días pesados/)).not.toBeInTheDocument();
  });

  it('renders nothing when the backend does not have the endpoint yet', async () => {
    api.getMyMoodHistory.mockResolvedValue(null);
    const { container } = renderCard();
    await vi.waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('explains calmly when loading fails', async () => {
    api.getMyMoodHistory.mockRejectedValue(new Error('offline'));
    renderCard();
    expect(await screen.findByText(/No pudimos traer tu historial ahora/)).toBeInTheDocument();
  });
});
