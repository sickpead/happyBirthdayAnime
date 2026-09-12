/**
 * Длительности анимаций и переходов, мс.
 * В CSS доступны как переменные `--duration-*` (см. `src/styles/cssVariables.ts`).
 */
export const TIMINGS = {
  /** Появление и скрытие проигрывателя в углу экрана. */
  turntableFadeMs: 600,
  /** Отклик интерактивных элементов на hover и focus. */
  interactionFeedbackMs: 150,
} as const;
