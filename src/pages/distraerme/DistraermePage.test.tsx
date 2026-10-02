import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import DistraermePage from './DistraermePage';

function renderPage(path = '/distraerme') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/distraerme" element={<DistraermePage />} />
        <Route path="/distraerme/memoria" element={<p>Juego de memoria</p>} />
        <Route path="/companion" element={<p>Modo compañía</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('DistraermePage', () => {
  it('asks how before what, with a calm tone', () => {
    renderPage();
    expect(screen.getByText(/Está bien desconectar un rato/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jugar solo\/a/ })).toBeInTheDocument();
    expect(screen.getByText('Invitar a alguien')).toBeInTheDocument();
    expect(screen.queryByText('Memoria')).not.toBeInTheDocument();
  });

  it('then shows the games, with the unavailable ones marked as coming soon', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Jugar solo\/a/ }));
    expect(screen.getByRole('button', { name: /Bloques/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Rebote/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /Memoria/ }));
    expect(screen.getByText('Juego de memoria')).toBeInTheDocument();
  });

  it('offers company while inviting is not available yet', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Mientras tanto, buscar compañía' }));
    expect(screen.getByText('Modo compañía')).toBeInTheDocument();
  });
});
