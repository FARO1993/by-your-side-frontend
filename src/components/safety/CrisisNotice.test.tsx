import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Composer } from '../byourside/composer';
import { CrisisNotice } from './CrisisNotice';

const placeholder = '¿Cómo venís hoy? Acá te leemos sin apuro…';

function renderComposer(onSubmit = vi.fn()) {
  render(
    <MemoryRouter>
      <Composer authorName="Ana" onSubmit={onSubmit} />
    </MemoryRouter>,
  );
  return onSubmit;
}

describe('CrisisNotice', () => {
  it('gently offers help when the text has crisis signals, without blocking the post', async () => {
    const user = userEvent.setup();
    const onSubmit = renderComposer();

    await user.type(screen.getByPlaceholderText(placeholder), 'ya no quiero vivir más');

    expect(await screen.findByText('Lo que estás escribiendo suena muy pesado.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Hablar ahora \(135\)/ })).toHaveAttribute('href', 'tel:135');
    expect(screen.getByRole('link', { name: 'Ver líneas de ayuda' })).toHaveAttribute('href', '/help');

    await user.click(screen.getByRole('button', { name: 'Compartir' }));
    expect(onSubmit).toHaveBeenCalledWith('ya no quiero vivir más', { contentWarning: false });
  });

  it('stays quiet for everyday expressions', async () => {
    const user = userEvent.setup();
    renderComposer();
    await user.type(screen.getByPlaceholderText(placeholder), 'me muero de risa con esta serie');
    await new Promise((resolve) => setTimeout(resolve, 700));
    expect(screen.queryByText(/suena muy pesado/)).not.toBeInTheDocument();
  });

  it('"Seguir escribiendo" hides it until the field is emptied', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <MemoryRouter>
        <CrisisNotice text="me quiero morir" />
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: 'Seguir escribiendo' }));
    expect(screen.queryByText(/suena muy pesado/)).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <CrisisNotice text="me quiero morir, de verdad" />
      </MemoryRouter>,
    );
    await new Promise((resolve) => setTimeout(resolve, 700));
    expect(screen.queryByText(/suena muy pesado/)).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <CrisisNotice text="" />
      </MemoryRouter>,
    );
    rerender(
      <MemoryRouter>
        <CrisisNotice text="no quiero vivir" />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/suena muy pesado/)).toBeInTheDocument();
  });
});
