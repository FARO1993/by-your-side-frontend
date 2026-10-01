import { describe, expect, it } from 'vitest';
import { needTypeFor, offeringTypeFor } from './check-in';

describe('check-in companion mapping', () => {
  it('maps every company need to its own NeedType', () => {
    expect(needTypeFor('listen-only')).toBe('LISTEN_TO_ME');
    expect(needTypeFor('talk')).toBe('TALK');
    expect(needTypeFor('opinion')).toBe('GET_OPINION');
    expect(needTypeFor('distraction')).toBe('DISTRACTION');
    expect(needTypeFor('company')).toBe('JUST_COMPANY');
  });

  it('maps every offer way to its own OfferingType', () => {
    expect(offeringTypeFor('listen')).toBe('LISTEN');
    expect(offeringTypeFor('chat')).toBe('TALK');
    expect(offeringTypeFor('distract')).toBe('DISTRACT');
  });
});
