import { describe, expect, it } from 'vitest';
import { DRAFT_TTL_MS, clearAllDrafts, clearDraft, draftKey, readDraft, writeDraft } from './drafts';

describe('drafts', () => {
  it('scopes keys by user and place, and does not save without a user', () => {
    expect(draftKey('u1', 'chat:c9')).toBe('byyourside.draft.u1.chat:c9');
    expect(draftKey(null, 'feed-composer')).toBeNull();

    writeDraft(null, 'algo');
    expect(localStorage.length).toBe(0);
  });

  it('saves, reads and clears a draft', () => {
    const key = draftKey('u1', 'create-post');
    writeDraft(key, 'Hoy fue un día raro');
    expect(readDraft(key)).toBe('Hoy fue un día raro');
    clearDraft(key);
    expect(readDraft(key)).toBe('');
  });

  it('removes the draft instead of saving blank text', () => {
    const key = draftKey('u1', 'create-post');
    writeDraft(key, 'algo');
    writeDraft(key, '   \n ');
    expect(localStorage.getItem(key!)).toBeNull();
  });

  it('expires drafts after seven days', () => {
    const key = draftKey('u1', 'feed-composer');
    writeDraft(key, 'viejo', 0);
    expect(readDraft(key, DRAFT_TTL_MS)).toBe('viejo');
    expect(readDraft(key, DRAFT_TTL_MS + 1)).toBe('');
    expect(localStorage.getItem(key!)).toBeNull();
  });

  it('drops corrupted entries', () => {
    const key = draftKey('u1', 'feed-composer')!;
    localStorage.setItem(key, '{no es json');
    expect(readDraft(key)).toBe('');
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('clears every draft without touching other app data', () => {
    writeDraft(draftKey('u1', 'feed-composer'), 'a');
    writeDraft(draftKey('u2', 'chat:c1'), 'b');
    localStorage.setItem('bys-theme', 'dark');

    clearAllDrafts();

    expect(readDraft(draftKey('u1', 'feed-composer'))).toBe('');
    expect(readDraft(draftKey('u2', 'chat:c1'))).toBe('');
    expect(localStorage.getItem('bys-theme')).toBe('dark');
  });
});
