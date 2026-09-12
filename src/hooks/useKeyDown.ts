import { useEffect, useEffectEvent } from 'react';

/**
 * Подписывается на `keydown` документа и вызывает обработчик для указанной клавиши.
 * Слушатель снимается при размонтировании и при `enabled === false`.
 * Обработчик читается через `useEffectEvent`, поэтому его смена не пересоздаёт подписку.
 *
 * @param key - Значение `KeyboardEvent.key`, например `'Escape'` (см. `KEYS`).
 * @param onKeyDown - Обработчик нажатия.
 * @param enabled - Активна ли подписка. По умолчанию `true`.
 */
export function useKeyDown(
  key: string,
  onKeyDown: (event: KeyboardEvent) => void,
  enabled = true,
): void {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === key && !event.isComposing) {
      onKeyDown(event);
    }
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const listener = (event: KeyboardEvent): void => {
      handleKeyDown(event);
    };
    document.addEventListener('keydown', listener);
    return () => {
      document.removeEventListener('keydown', listener);
    };
  }, [enabled]);
}
