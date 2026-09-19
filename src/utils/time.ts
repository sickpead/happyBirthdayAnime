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
