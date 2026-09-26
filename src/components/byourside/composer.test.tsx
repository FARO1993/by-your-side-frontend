import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Composer } from './composer';

describe('Composer check-in', () => {
  it('shows only the three emotional moods and publishes them', async () => {
    const onMood = vi.fn();
    render(<Composer authorName="Ana" onSubmit={vi.fn()} onMood={onMood} />);

    expect(screen.getByRole('button', { name: 'Estoy bien' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Necesito distraerme' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Día difícil' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Necesito hablar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Estoy acá para alguien' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Necesito compañía' })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Estoy bien' }));
    expect(onMood).toHaveBeenCalledWith('WELL');
    expect(screen.getByRole('button', { name: 'Estoy bien' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Necesito distraerme' }));
    expect(onMood).toHaveBeenCalledWith('NEED_DISTRACTION');
    await userEvent.click(screen.getByRole('button', { name: 'Día difícil' }));
    expect(onMood).toHaveBeenCalledWith('DIFFICULT_DAY');
  });

  it('still publishes a post', async () => {
    const onSubmit = vi.fn();
    render(<Composer authorName="Ana" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByPlaceholderText('¿Cómo venís hoy? Acá te leemos sin apuro…'), 'Hoy vengo bien');
    await userEvent.click(screen.getByRole('button', { name: 'Compartir' }));
    expect(onSubmit).toHaveBeenCalledWith('Hoy vengo bien');
  });
});
