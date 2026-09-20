const MS_PER_SECOND = 1000;

/**
 * Переводит миллисекунды в секунды — GSAP принимает длительности и позиции в секундах,
 * а все тайминги проекта хранятся в миллисекундах.
 *
 * @param ms - Длительность в миллисекундах.
 */
export function msToSeconds(ms: number): number {
  return ms / MS_PER_SECOND;
}

/**
 * Позиция на таймлайне GSAP относительно метки: `"label+=1.4"`.
 *
 * @param label - Метка таймлайна.
 * @param offsetMs - Смещение от метки, мс.
 */
export function afterLabel(label: string, offsetMs: number): string {
  return `${label}+=${String(msToSeconds(offsetMs))}`;
}

const SECONDS_PER_MINUTE = 60;

/**
 * Время воспроизведения для плеера: `1:05`. Нечисловые и отрицательные значения — `0:00`.
 *
 * @param seconds - Позиция или длина дорожки в секундах.
 */
export function formatPlaybackTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / SECONDS_PER_MINUTE);
  const rest = total % SECONDS_PER_MINUTE;
  return `${String(minutes)}:${String(rest).padStart(2, '0')}`;
}
