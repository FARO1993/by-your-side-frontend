import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { draftKey, readDraft, writeDraft } from '../lib/drafts';
import { useDraft } from './useDraft';

describe('useDraft', () => {
  it('saves as the user types and restores it on the next mount', () => {
    const key = draftKey('u1', 'create-post');
    const first = renderHook(() => useDraft(key));
    expect(first.result.current.restored).toBe(false);

    act(() => first.result.current.setText('Necesito contar algo'));
    expect(readDraft(key)).toBe('Necesito contar algo');
    first.unmount();

    const second = renderHook(() => useDraft(key));
    expect(second.result.current.text).toBe('Necesito contar algo');
    expect(second.result.current.restored).toBe(true);
  });

  it('discard empties the field and the stored draft', () => {
    const key = draftKey('u1', 'create-post');
    writeDraft(key, 'mejor no');
    const { result } = renderHook(() => useDraft(key));

    act(() => result.current.discard());

    expect(result.current.text).toBe('');
    expect(result.current.restored).toBe(false);
    expect(readDraft(key)).toBe('');
  });

  it('keeps a separate draft per conversation', () => {
    writeDraft(draftKey('u1', 'chat:a'), 'hola A');
    writeDraft(draftKey('u1', 'chat:b'), 'hola B');
    const { result, rerender } = renderHook(({ key }) => useDraft(key), {
      initialProps: { key: draftKey('u1', 'chat:a') },
    });
    expect(result.current.text).toBe('hola A');

    rerender({ key: draftKey('u1', 'chat:b') });
    expect(result.current.text).toBe('hola B');

    act(() => result.current.setText('hola B editado'));
    rerender({ key: draftKey('u1', 'chat:a') });
    expect(result.current.text).toBe('hola A');
    expect(readDraft(draftKey('u1', 'chat:b'))).toBe('hola B editado');
  });

  it('works as plain state when there is no key', () => {
    const { result } = renderHook(() => useDraft(null));
    act(() => result.current.setText('sin usuario'));
    expect(result.current.text).toBe('sin usuario');
    expect(localStorage.length).toBe(0);
  });
});
