/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthLogoMotion } from './AuthLogoMotion';

describe('AuthLogoMotion', () => {
  it('renders one mark and does not ask JavaScript about reduced motion', () => {
    window.matchMedia = vi.fn();
    render(<AuthLogoMotion />);

    expect(document.querySelectorAll('.auth-logo-mark')).toHaveLength(1);
    expect(document.querySelectorAll('.auth-logo-presence')).toHaveLength(1);
    expect(document.querySelectorAll('.auth-logo-listening')).toHaveLength(1);
    expect(window.matchMedia).not.toHaveBeenCalled();
  });

  it('keeps the approach and reduced motion in CSS', () => {
    const css = readFileSync(join(process.cwd(), 'src/components/auth/auth-screen.css'), 'utf8');

    expect(css).toContain('@keyframes auth-presence');
    expect(css).toContain('800ms');
    expect(css).toContain('align-items: stretch');
    expect(css).toContain('align-self: flex-start');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('animation: none !important');
    expect(css).toContain('transform: none !important');
    expect(css).toContain('auth-logo-in 180ms');
    expect(css).not.toMatch(/prefers-reduced-motion[\s\S]*infinite/);
  });
});
