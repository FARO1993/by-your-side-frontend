import { describe, expect, it } from 'vitest';
import { greetingName } from './greetingName';

describe('greetingName', () => {
  it('uses the first word of a display name', () => {
    expect(greetingName('Facundo')).toBe('Facundo');
    expect(greetingName('Facqundop Test 3')).toBe('Facqundop');
    expect(greetingName('  Ana María  ')).toBe('Ana');
  });

  it('prefers displayName over the internal username', () => {
    expect(greetingName('Facundo', 'facu_test')).toBe('Facundo');
  });

  it('falls back to username when there is no display name', () => {
    expect(greetingName(null, 'ana')).toBe('ana');
    expect(greetingName('   ', 'ana')).toBe('ana');
  });

  it('returns an empty string when nothing is usable', () => {
    expect(greetingName(null, null)).toBe('');
    expect(greetingName('  ', '  ')).toBe('');
  });
});
