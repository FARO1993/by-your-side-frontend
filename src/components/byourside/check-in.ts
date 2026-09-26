import type { CompanionIntent } from '../../api/types';

export type PulseMode = 'idle' | 'seeking' | 'available';

export type CompanyNeed = 'listen-only' | 'talk' | 'opinion';
export type OfferWay = 'listen' | 'chat' | 'distract';

export const COMPANY_NEEDS: { id: CompanyNeed; label: string }[] = [
  { id: 'listen-only', label: 'Solo escucharme' },
  { id: 'talk', label: 'Quiero conversar' },
  { id: 'opinion', label: 'Me vendría bien una opinión' },
];

export const OFFER_WAYS: { id: OfferWay; label: string }[] = [
  { id: 'listen', label: 'Puedo escuchar' },
  { id: 'chat', label: 'Podemos charlar' },
  { id: 'distract', label: 'Podemos distraernos' },
];

const COMPANION_INTENTS = new Set<CompanionIntent>([
  'TALK',
  'DISTRACTION',
  'WATCH_TOGETHER',
  'MUSIC',
  'LAUGH',
  'JUST_COMPANY',
]);

/**
 * Solo se mapean opciones cuya semántica coincide con un CompanionIntent.
 * Escuchar y pedir una opinión no tienen intent propio en el contrato actual.
 */
export function intentForCompanyNeed(need: CompanyNeed): CompanionIntent | null {
  if (need === 'talk') return 'TALK';
  return null;
}

export function intentForOffer(way: OfferWay): CompanionIntent | null {
  if (way === 'chat') return 'TALK';
  if (way === 'distract') return 'DISTRACTION';
  return null;
}

export function readCompanionIntent(state: unknown): CompanionIntent | null {
  if (!state || typeof state !== 'object' || !('intent' in state)) return null;
  const intent = (state as { intent?: unknown }).intent;
  if (typeof intent !== 'string' || !COMPANION_INTENTS.has(intent as CompanionIntent)) return null;
  return intent as CompanionIntent;
}
