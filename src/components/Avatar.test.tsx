import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Avatar from './Avatar';

describe('Avatar', () => {
  it('draws the chosen illustration', () => {
    const { container } = render(<Avatar avatarId="faro" name="Ana" />);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container).not.toHaveTextContent('AN');
  });

  it('falls back to initials without an avatar, or with anything unknown (never an image)', () => {
    const { container, rerender } = render(<Avatar avatarId={null} name="Ana Paz" />);
    expect(container).toHaveTextContent('AP');
    rerender(<Avatar avatarId="https://example.com/me.png" name="Ana Paz" />);
    expect(container).toHaveTextContent('AP');
    expect(container.querySelector('img')).toBeNull();
  });
});
