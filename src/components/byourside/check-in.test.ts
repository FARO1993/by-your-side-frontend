import { describe, expect, it } from 'vitest';
import { intentForCompanyNeed, intentForOffer, readCompanionIntent } from './check-in';

describe('check-in companion mapping', () => {
  it('maps only exact companion intents', () => {
    expect(intentForCompanyNeed('talk')).toBe('TALK');
    expect(intentForCompanyNeed('listen-only')).toBeNull();
    expect(intentForCompanyNeed('opinion')).toBeNull();
    expect(intentForOffer('chat')).toBe('TALK');
    expect(intentForOffer('distract')).toBe('DISTRACTION');
    expect(intentForOffer('listen')).toBeNull();
  });

  it('ignores unsafe navigation state', () => {
    expect(readCompanionIntent(null)).toBeNull();
    expect(readCompanionIntent({ intent: 'NOT_REAL' })).toBeNull();
    expect(readCompanionIntent({ intent: 'TALK' })).toBe('TALK');
  });
});
