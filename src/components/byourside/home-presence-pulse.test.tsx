import { render, screen } from '@testing-library/react';
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

  it('does not invent an intent for listening or an opinion', async () => {
    const onSeekCompany = vi.fn();
    const view = render(<HomePresencePulse {...base} onSeekCompany={onSeekCompany} />);

    await userEvent.click(screen.getByRole('button', { name: 'Necesito compañía' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Solo escucharme' }));
    await userEvent.click(screen.getByRole('button', { name: 'Encontrar compañía' }));
    expect(onSeekCompany).toHaveBeenCalledWith(null);

    view.rerender(<HomePresencePulse {...base} onSeekCompany={onSeekCompany} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Necesito compañía' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Me vendría bien una opinión' }));
    await userEvent.click(screen.getByRole('button', { name: 'Encontrar compañía' }));
    expect(onSeekCompany).toHaveBeenLastCalledWith(null);
  });

  it('declares exact availability and leaves listening unmapped', async () => {
    const onDeclareAvailability = vi.fn();
    render(<HomePresencePulse {...base} onDeclareAvailability={onDeclareAvailability} />);

    await userEvent.click(screen.getByRole('button', { name: 'Estoy disponible' }));
    expect(screen.getByRole('heading', { name: '¿Cómo podés estar hoy?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Podemos charlar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar disponibilidad' }));
    expect(onDeclareAvailability).toHaveBeenCalledWith('TALK');

    await userEvent.click(screen.getByRole('radio', { name: 'Podemos distraernos' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar disponibilidad' }));
    expect(onDeclareAvailability).toHaveBeenLastCalledWith('DISTRACTION');

    await userEvent.click(screen.getByRole('radio', { name: 'Puedo escuchar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar disponibilidad' }));
    expect(onDeclareAvailability).toHaveBeenLastCalledWith(null);
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
