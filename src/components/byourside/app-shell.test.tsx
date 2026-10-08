import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '../../context/ThemeProvider';
import { THEME_STORAGE_KEY } from '../../lib/theme';
import { AppShell } from './app-shell';

function renderShell(notifications?: number) {
  return render(
    <ThemeProvider>
      <AppShell active="feed" onNavigate={() => {}} unread={{ notifications }}>
        <p>Contenido</p>
      </AppShell>
    </ThemeProvider>,
  );
}

describe('notification badge', () => {
  it('hides the badge when there are no unread notifications', () => {
    renderShell(0);
    expect(screen.getAllByRole('button', { name: 'Novedades' })).toHaveLength(2);
    expect(screen.queryByText('9+')).not.toBeInTheDocument();
  });

  it('shows the real count on desktop and mobile when it is between 1 and 9', () => {
    renderShell(3);
    expect(screen.getAllByRole('button', { name: 'Novedades, 3 sin leer' })).toHaveLength(2);
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(2);
  });

  it('compacts 10 or more as 9+ while keeping the real count in the accessible name', () => {
    renderShell(12);
    expect(screen.getAllByRole('button', { name: 'Novedades, 12 sin leer' })).toHaveLength(2);
    expect(screen.getAllByText('9+')).toHaveLength(2);
  });
});

describe('theme toggle', () => {
  it('switches to night mode, applies it to <html> and remembers the choice', async () => {
    const user = userEvent.setup();
    renderShell();

    const [desktopToggle, mobileToggle] = screen.getAllByRole('button', { name: 'Modo nocturno' });
    expect(desktopToggle).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.dataset.theme).toBe('light');

    await user.click(desktopToggle);

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(mobileToggle).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await user.click(mobileToggle);

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('starts in night mode when the user chose it before', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    renderShell();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getAllByRole('button', { name: 'Modo nocturno' })[0]).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('accessibility landmarks', () => {
  it('offers a skip link as the first focusable element, pointing at <main>', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.tab();
    const skip = screen.getByRole('link', { name: 'Saltar al contenido' });
    expect(skip).toHaveFocus();
    const main = screen.getByRole('main');
    expect(skip).toHaveAttribute('href', `#${main.id}`);
    expect(main).toHaveTextContent('Contenido');
  });

  it('keeps a <main> landmark in the bare layout used by messages', () => {
    render(
      <ThemeProvider>
        <AppShell active="messages" onNavigate={() => {}} bare>
          <p>Chat</p>
        </AppShell>
      </ThemeProvider>,
    );
    expect(screen.getByRole('main')).toHaveTextContent('Chat');
  });

  it('names the avatar button and announces unread messages', () => {
    render(
      <ThemeProvider>
        <AppShell
          active="feed"
          onNavigate={() => {}}
          unread={{ messages: 2 }}
          authenticated
          user={{ id: 'u1', username: 'facu', displayName: null, avatarId: null }}
        >
          <p>Contenido</p>
        </AppShell>
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Tu perfil' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Mensajes, hay mensajes sin leer' })).toHaveLength(2);
  });
});
