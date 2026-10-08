const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'summary',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Controles alcanzables con Tab dentro de `container`, en orden de documento. */
export function focusableWithin(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => !element.closest('[inert], [hidden], [aria-hidden="true"]'),
  );
}

/**
 * Mantiene el foco adentro de un modal: Tab en el último control vuelve al
 * primero y Shift+Tab en el primero va al último. Si el foco se escapó (por
 * ejemplo, quedó en el body), lo trae de vuelta.
 * Se llama desde un listener de keydown; no hace nada con otras teclas.
 */
export function trapTabKey(event: KeyboardEvent, container: HTMLElement | null) {
  if (event.key !== 'Tab' || !container) return;
  const items = focusableWithin(container);
  if (items.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement as HTMLElement | null;
  const inside = active ? container.contains(active) : false;

  if (event.shiftKey) {
    if (!inside || active === first || active === container) {
      event.preventDefault();
      last.focus();
    }
  } else if (!inside || active === last) {
    event.preventDefault();
    first.focus();
  }
}
