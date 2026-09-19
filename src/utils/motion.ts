const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Попросил ли пользователь в настройках ОС уменьшить движение.
 * Используется, чтобы отключать необязательные бесконечные анимации (пульсация, вращение).
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
