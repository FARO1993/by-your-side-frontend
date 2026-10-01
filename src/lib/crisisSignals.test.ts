import { describe, expect, it } from 'vitest';
import { hasCrisisSignal, normalizeForSignals } from './crisisSignals';

describe('normalizeForSignals', () => {
  it('ignores case, accents and punctuation', () => {
    expect(normalizeForSignals('¡NO QUIERO VIVIR MÁS, de verdad!!')).toBe('no quiero vivir mas de verdad');
  });
});

describe('hasCrisisSignal — detects risk', () => {
  it.each([
    'Me quiero morir',
    'me quiero matar',
    'ya no quiero vivir',
    'NO QUIERO VIVIR MÁS',
    'no puedo seguir viviendo así',
    'pienso en suicidarme',
    'tengo ideas de suicidio',
    'a veces pienso en quitarme la vida',
    'quiero terminar con mi vida',
    'quiero acabar con todo esto',
    'no le encuentro sentido a vivir',
    'no tiene sentido seguir',
    'todos estarían mejor sin mí',
    'ojalá no despertar mañana',
    'no quiero despertarme nunca más',
    'tengo ganas de morirme',
    'me voy a matar',
    'me volví a cortar',
    'tengo ganas de cortarme',
    'quiero hacerme daño',
    'me lastimé a propósito',
    'quiero lastimarme',
    'quiero desaparecer para siempre',
  ])('"%s"', (text) => {
    expect(hasCrisisSignal(text)).toBe(true);
  });
});

describe('hasCrisisSignal — ignores everyday expressions', () => {
  it.each([
    'me muero de risa jajaja',
    'me quiero morir de vergüenza',
    'me quiero morir de amor',
    'me muero de hambre',
    'me mata este calor',
    'me voy a matar estudiando para el final',
    'me voy a matar de risa con esta serie',
    'mi viejo me va a matar si llego tarde',
    'no doy más del cansancio',
    'no aguanto más este calor',
    'me corté el pelo',
    'quiero cortarme el pelo',
    'no quiero vivir en Buenos Aires',
    'no quiero vivir con mis viejos',
    'me lastimé la rodilla jugando al fútbol',
    'hoy me costó levantarme',
    'leí un artículo sobre prevención del suic',
    '',
  ])('"%s"', (text) => {
    expect(hasCrisisSignal(text)).toBe(false);
  });
});
