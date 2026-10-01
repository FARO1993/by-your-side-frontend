import { useCallback, useState } from 'react';
import { clearDraft, readDraft, writeDraft } from '../lib/drafts';

type DraftState = { key: string | null; text: string; restored: boolean };

function load(key: string | null): DraftState {
  const text = readDraft(key);
  return { key, text, restored: text.trim() !== '' };
}

/**
 * Estado de texto que se guarda solo como borrador (ver lib/drafts.ts).
 *
 * - `key` null (sin usuario) => funciona como un useState común, sin guardar.
 * - Si cambia `key` (ej. otra conversación) carga el borrador de ese lugar.
 * - `restored` indica que el texto vino de un borrador anterior, para poder
 *   avisarlo y ofrecer descartarlo.
 */
export function useDraft(key: string | null) {
  const [state, setState] = useState<DraftState>(() => load(key));

  let current = state;
  if (state.key !== key) {
    // Patrón "ajustar estado al cambiar una prop" (sin efecto ni render extra visible).
    current = load(key);
    setState(current);
  }

  const setText = useCallback(
    (text: string) => {
      writeDraft(key, text);
      setState((prev) => ({ key, text, restored: prev.key === key ? prev.restored && text.trim() !== '' : false }));
    },
    [key],
  );

  const discard = useCallback(() => {
    clearDraft(key);
    setState({ key, text: '', restored: false });
  }, [key]);

  return { text: current.text, setText, discard, restored: current.restored };
}
