import axios from 'axios';
import type { CompanionPreferenceType, NeedType, OfferingType } from '../api/types';

export const NEED_LABEL: Record<NeedType, string> = {
  LISTEN_TO_ME: 'Solo escucharme',
  TALK: 'Quiero conversar',
  GET_OPINION: 'Me vendría bien una opinión',
  DISTRACTION: 'Quiero distraerme',
  JUST_COMPANY: 'Solo acompañame',
};

export const OFFERING_SELF_LABEL: Record<OfferingType, string> = {
  LISTEN: 'Puedo escuchar',
  TALK: 'Podemos charlar',
  DISTRACT: 'Podemos distraernos',
};

export const CANDIDATE_OFFERING_LABEL: Record<OfferingType, string> = {
  LISTEN: 'Puede escucharte',
  TALK: 'Puede conversar',
  DISTRACT: 'Puede distraerse con vos',
};

export const PUBLIC_AVAILABILITY_LABEL: Record<OfferingType, string> = {
  LISTEN: 'Puede escuchar',
  TALK: 'Puede conversar',
  DISTRACT: 'Puede distraerse con vos',
};

export const PREFERENCE_ORDER: CompanionPreferenceType[] = ['LISTEN', 'TALK', 'DISTRACT'];

export const PREFERENCE_LABEL: Record<CompanionPreferenceType, string> = {
  LISTEN: 'Escuchar',
  TALK: 'Conversar',
  DISTRACT: 'Distraernos',
};

export function formatCompanionUntil(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function companionFailure(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.status === 409) {
    return 'Hubo un cruce al guardar. Volvé a intentar.';
  }
  if (axios.isAxiosError(error) && error.response?.status === 400) {
    return 'Esa opción no es válida. Elegí otra.';
  }
  return fallback;
}
