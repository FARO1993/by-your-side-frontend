import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnimatedWelcome } from './animated-welcome';

function mockMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && String(query).includes('reduce'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('AnimatedWelcome reduced motion', () => {
  it('shows the final static state without waiting for the motion sequence', () => {
    mockMotion(true);
    render(<AnimatedWelcome variant="new-user" userName="Ana" onComplete={() => {}} />);

    expect(screen.getByRole('heading', { name: /Bienvenido a ByYourSide, Ana/ })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Empecemos 💜' })).toHaveAttribute('tabindex', '0');
  });

  it('keeps the call to action out of the tab order until the sequence finishes', () => {
    mockMotion(false);
    render(<AnimatedWelcome variant="new-user" userName="Ana" onComplete={() => {}} />);

    expect(screen.getByRole('button', { name: 'Empecemos 💜' })).toHaveAttribute('tabindex', '-1');
  });
});
