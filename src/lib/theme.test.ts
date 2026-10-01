import { afterEach, describe, expect, it } from 'vitest';
import {
  THEME_STORAGE_KEY,
  applyTheme,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
} from './theme';

afterEach(() => {
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = '';
});

describe('theme preference', () => {
  it('defaults to following the system when nothing is stored', () => {
    expect(readThemePreference()).toBe('system');
  });

  it('ignores unknown stored values', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
    expect(readThemePreference()).toBe('system');
  });

  it('stores explicit choices and clears the key when going back to system', () => {
    writeThemePreference('dark');
    expect(readThemePreference()).toBe('dark');
    writeThemePreference('system');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });
});

describe('resolveTheme', () => {
  it('follows the system only when there is no explicit choice', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});

describe('applyTheme', () => {
  it('sets data-theme, color-scheme and the browser theme-color', () => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);

    applyTheme('dark');

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(meta.content).not.toBe('');
    meta.remove();
  });
});
