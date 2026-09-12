import { useEffect, type RefObject } from 'react';

import { KEYS } from '../constants/keyboard';
import { getTabbableElements } from '../utils/focus';

/**
 * Управляет фокусом внутри контейнера (модального окна), пока `active === true`:
 * - при активации запоминает сфокусированный элемент (обычно триггер) и переводит фокус в контейнер;
 * - зацикливает Tab / Shift+Tab на границах контейнера;
 * - при деактивации или размонтировании возвращает фокус на запомненный элемент.
 *
 * Контейнер должен уметь принимать фокус программно (`tabIndex={-1}`).
 *
 * @param containerRef - Ref на контейнер, внутри которого удерживается фокус.
 * @param active - Включена ли ловушка фокуса.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!active || container === null) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    container.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== KEYS.tab) {
        return;
      }

      const tabbables = getTabbableElements(container);
      const first = tabbables.at(0);
      const last = tabbables.at(-1);
      if (first === undefined || last === undefined) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const current = document.activeElement;
      const isFocusOutside = current === null || !container.contains(current);

      if (event.shiftKey) {
        if (isFocusOutside || current === first || current === container) {
          event.preventDefault();
          last.focus();
        }
      } else if (isFocusOutside || current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [active, containerRef]);
}
