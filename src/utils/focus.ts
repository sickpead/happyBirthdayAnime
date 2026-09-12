const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

/**
 * Возвращает элементы контейнера, достижимые клавишей Tab, в порядке документа.
 * Отбрасывает элементы с `tabIndex < 0` и невидимые (`display: none`, `visibility: hidden`).
 *
 * @param container - Элемент, внутри которого ищутся фокусируемые потомки.
 */
export function getTabbableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.tabIndex >= 0 && element.checkVisibility({ visibilityProperty: true }),
  );
}
