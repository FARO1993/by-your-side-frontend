import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue';

function Probe({ value }: { value: string }) {
  const debounced = useDebouncedValue(value, 300);
  return <p>{debounced}</p>;
}

describe('useDebouncedValue', () => {
  it('updates only after the delay', async () => {
    vi.useFakeTimers();
    const view = render(<Probe value="a" />);
    expect(screen.getByText('a')).toBeInTheDocument();
    view.rerender(<Probe value="ab" />);
    expect(screen.getByText('a')).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(screen.getByText('ab')).toBeInTheDocument();
    vi.useRealTimers();
  });
});
