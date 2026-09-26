import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppShell } from './app-shell';

function renderShell(notifications?: number) {
  return render(
    <AppShell active="feed" onNavigate={() => {}} unread={{ notifications }}>
      <p>Contenido</p>
    </AppShell>,
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
