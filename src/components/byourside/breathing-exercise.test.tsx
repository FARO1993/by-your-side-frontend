import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BreathingExercise } from './breathing-exercise';

function tick(seconds: number) {
  act(() => {
    vi.advanceTimersByTime(seconds * 1000);
  });
}

describe('BreathingExercise', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('guides inhale 4 · hold 4 · exhale 6 and announces only the phase', () => {
    render(<BreathingExercise />);
    expect(screen.getByText('Un minuto para vos')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    expect(screen.getByText('Inhalá')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Inhalá. Ciclo 1 de 4.');

    tick(4);
    expect(screen.getByText('Sostené')).toBeInTheDocument();
    tick(4);
    expect(screen.getByText('Exhalá despacio')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Exhalá despacio. Ciclo 1 de 4.');
    tick(6);
    expect(screen.getByRole('status')).toHaveTextContent('Inhalá. Ciclo 2 de 4.');
  });

  it('ends after about a minute and can be repeated', () => {
    render(<BreathingExercise />);
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    tick(56);
    expect(screen.getByText('Bien hecho')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Terminaste el ejercicio.');

    fireEvent.click(screen.getByRole('button', { name: 'Otra vez' }));
    expect(screen.getByText('Inhalá')).toBeInTheDocument();
  });

  it('can be stopped at any moment', () => {
    render(<BreathingExercise />);
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    tick(5);
    fireEvent.click(screen.getByRole('button', { name: 'Terminar' }));
    expect(screen.getByText('Un minuto para vos')).toBeInTheDocument();
    tick(10);
    expect(screen.queryByText('Inhalá')).not.toBeInTheDocument();
  });
});
