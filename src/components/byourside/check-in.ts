import type { NeedType, OfferingType } from '../../api/types';

export type PulseMode = 'idle' | 'seeking' | 'available';

export type CompanyNeed = 'listen-only' | 'talk' | 'opinion' | 'distraction' | 'company';
export type OfferWay = 'listen' | 'chat' | 'distract';

export const COMPANY_NEEDS: { id: CompanyNeed; label: string }[] = [
  { id: 'listen-only', label: 'Solo escucharme' },
  { id: 'talk', label: 'Quiero conversar' },
  { id: 'opinion', label: 'Me vendría bien una opinión' },
  { id: 'distraction', label: 'Quiero distraerme' },
  { id: 'company', label: 'Solo acompañame' },
];

export const OFFER_WAYS: { id: OfferWay; label: string }[] = [
  { id: 'listen', label: 'Puedo escuchar' },
  { id: 'chat', label: 'Podemos charlar' },
  { id: 'distract', label: 'Podemos distraernos' },
];

export function needTypeFor(need: CompanyNeed): NeedType {
  switch (need) {
    case 'listen-only':
      return 'LISTEN_TO_ME';
    case 'talk':
      return 'TALK';
    case 'opinion':
      return 'GET_OPINION';
    case 'distraction':
      return 'DISTRACTION';
    case 'company':
      return 'JUST_COMPANY';
  }
}

export function offeringTypeFor(way: OfferWay): OfferingType {
  switch (way) {
    case 'listen':
      return 'LISTEN';
    case 'chat':
      return 'TALK';
    case 'distract':
      return 'DISTRACT';
  }
}
