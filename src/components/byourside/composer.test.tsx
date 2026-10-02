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
    expect(onSubmit).toHaveBeenCalledWith('Hoy vengo bien', { contentWarning: false });
  });
});

describe('Composer drafts', () => {
  const key = 'byyourside.draft.u1.feed-composer';
  const placeholder = '¿Cómo venís hoy? Acá te leemos sin apuro…';

  it('restores an unsent draft and lets the user discard it', async () => {
    const first = render(<Composer authorName="Ana" onSubmit={vi.fn()} draftKey={key} />);
    await userEvent.type(screen.getByPlaceholderText(placeholder), 'Algo a medias');
    expect(screen.getByText('Borrador guardado en este dispositivo.')).toBeInTheDocument();
    first.unmount();

    render(<Composer authorName="Ana" onSubmit={vi.fn()} draftKey={key} />);
    expect(screen.getByPlaceholderText(placeholder)).toHaveValue('Algo a medias');
    expect(screen.getByRole('status')).toHaveTextContent('Recuperamos lo que estabas escribiendo.');

    await userEvent.click(screen.getByRole('button', { name: 'Descartar' }));
    expect(screen.getByPlaceholderText(placeholder)).toHaveValue('');
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('clears the draft after publishing, but keeps it if publishing fails', async () => {
    const failing = vi.fn().mockRejectedValue(new Error('offline'));
    const first = render(<Composer authorName="Ana" onSubmit={failing} draftKey={key} />);
    await userEvent.type(screen.getByPlaceholderText(placeholder), 'No lo pierdas');
    await userEvent.click(screen.getByRole('button', { name: 'Compartir' }));
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos compartirlo');
    expect(screen.getByPlaceholderText(placeholder)).toHaveValue('No lo pierdas');
    expect(localStorage.getItem(key)).not.toBeNull();
    first.unmount();

    render(<Composer authorName="Ana" onSubmit={vi.fn()} draftKey={key} />);
    await userEvent.click(screen.getByRole('button', { name: 'Compartir' }));
    expect(localStorage.getItem(key)).toBeNull();
  });
});

describe('Composer content warning', () => {
  it('sends the sensitive flag and resets it after publishing', async () => {
    const onSubmit = vi.fn();
    render(<Composer authorName="Ana" onSubmit={onSubmit} />);
    await userEvent.type(screen.getByPlaceholderText('¿Cómo venís hoy? Acá te leemos sin apuro…'), 'algo pesado');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Contenido sensible' }));
    await userEvent.click(screen.getByRole('button', { name: 'Compartir' }));
    expect(onSubmit).toHaveBeenCalledWith('algo pesado', { contentWarning: true });
    expect(screen.getByRole('checkbox', { name: 'Contenido sensible' })).not.toBeChecked();
  });
});
