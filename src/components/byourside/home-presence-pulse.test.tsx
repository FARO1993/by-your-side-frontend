import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HomePresencePulse } from './home-presence-pulse';

const base = {
  onSeekCompany: vi.fn(),
  onDeclareAvailability: vi.fn(),
  onReset: vi.fn(),
};

describe('HomePresencePulse', () => {
  it('starts idle, with presence and two actions', () => {
    render(<HomePresencePulse {...base} />);

    expect(screen.getByText('Hay personas por acá')).toBeInTheDocument();
    expect(screen.queryByText('Pulso de ByYourSide')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Necesito compañía' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Estoy disponible' })).toBeInTheDocument();
    expect(document.querySelector('.home-pulse-field')).toBeTruthy();
  });

  it('asks how to be together and finds company for an exact intent', async () => {
    const onSeekCompany = vi.fn();
    render(<HomePresencePulse {...base} onSeekCompany={onSeekCompany} />);

    await userEvent.click(screen.getByRole('button', { name: 'Necesito compañía' }));
    expect(screen.getByRole('heading', { name: '¿Cómo querés que estemos con vos?' })).toBeInTheDocument();
    expect(screen.getByText('Necesito compañía')).toBeInTheDocument();
    expect(document.querySelector('.home-pulse-field')).toBeNull();

    const cta = screen.getByRole('button', { name: 'Encontrar compañía' });
    expect(cta).toBeDisabled();
    await userEvent.click(screen.getByRole('radio', { name: 'Quiero conversar' }));
    expect(screen.getByRole('radio', { name: 'Solo escucharme' })).not.toBeChecked();
    await userEvent.click(cta);
    expect(onSeekCompany).toHaveBeenCalledWith('TALK');
  });

  it('maps every company need, including distraction and company', async () => {
    const onSeekCompany = vi.fn().mockResolvedValue(undefined);
    render(<HomePresencePulse {...base} onSeekCompany={onSeekCompany} />);

    async function choose(label: string) {
      await userEvent.click(screen.getByRole('button', { name: 'Necesito compañía' }));
      await userEvent.click(screen.getByRole('radio', { name: label }));
      await userEvent.click(screen.getByRole('button', { name: 'Encontrar compañía' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Necesito compañía' })).toBeInTheDocument());
    }

    await choose('Solo escucharme');
    expect(onSeekCompany).toHaveBeenLastCalledWith('LISTEN_TO_ME');
    await choose('Quiero conversar');
    expect(onSeekCompany).toHaveBeenLastCalledWith('TALK');
    await choose('Me vendría bien una opinión');
    expect(onSeekCompany).toHaveBeenLastCalledWith('GET_OPINION');
    await choose('Quiero distraerme');
    expect(onSeekCompany).toHaveBeenLastCalledWith('DISTRACTION');
    await choose('Solo acompañame');
    expect(onSeekCompany).toHaveBeenLastCalledWith('JUST_COMPANY');
  });

  it('maps every way of being available', async () => {
    const onDeclareAvailability = vi.fn().mockResolvedValue(undefined);
    render(<HomePresencePulse {...base} onDeclareAvailability={onDeclareAvailability} />);

    await userEvent.click(screen.getByRole('button', { name: 'Estoy disponible' }));
    expect(screen.getByRole('heading', { name: '¿Cómo podés estar hoy?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Puedo escuchar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar disponibilidad' }));
    await waitFor(() => expect(onDeclareAvailability).toHaveBeenCalledWith('LISTEN'));

    await userEvent.click(screen.getByRole('button', { name: 'Estoy disponible' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Podemos charlar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar disponibilidad' }));
    await waitFor(() => expect(onDeclareAvailability).toHaveBeenLastCalledWith('TALK'));

    await userEvent.click(screen.getByRole('button', { name: 'Estoy disponible' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Podemos distraernos' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar disponibilidad' }));
    await waitFor(() => expect(onDeclareAvailability).toHaveBeenLastCalledWith('DISTRACT'));
  });

  it('shows an active need and an active offering at the same time', async () => {
    const onCancelNeed = vi.fn();
    const onCancelOffering = vi.fn();
    render(
      <HomePresencePulse
        {...base}
        activeNeed={{ id: 'need-1', type: 'TALK', createdAt: '2026-09-20T12:00:00.000Z', expiresAt: '2026-09-20T14:00:00.000Z' }}
        activeOffering={{ id: 'off-1', type: 'LISTEN', createdAt: '2026-09-20T12:00:00.000Z', expiresAt: '2026-09-20T18:00:00.000Z' }}
        onCancelNeed={onCancelNeed}
        onCancelOffering={onCancelOffering}
      />,
    );

    expect(screen.getByText('Estás buscando compañía')).toBeInTheDocument();
    expect(screen.getByText(/Quiero conversar/)).toBeInTheDocument();
    expect(screen.getByText('Estás disponible')).toBeInTheDocument();
    expect(screen.getByText(/Puedo escuchar/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Necesito compañía' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Estoy disponible' })).not.toBeInTheDocument();

    const cancelButtons = screen.getAllByRole('button', { name: 'Cancelar' });
    await userEvent.click(cancelButtons[0]);
    await userEvent.click(cancelButtons[1]);
    expect(onCancelNeed).toHaveBeenCalled();
    expect(onCancelOffering).toHaveBeenCalled();
  });

  it('returns to the idle pulse when changing', async () => {
    const onReset = vi.fn();
    render(<HomePresencePulse {...base} onReset={onReset} />);

    await userEvent.click(screen.getByRole('button', { name: 'Necesito compañía' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar' }));
    expect(onReset).toHaveBeenCalled();
    expect(screen.getByText('Hay personas por acá')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '¿Cómo querés que estemos con vos?' })).not.toBeInTheDocument();
  });
});
