/**
 * Типизированная обёртка над Howler — единственная точка работы со звуком в приложении.
 * Компоненты и хуки не создают `Howl` напрямую, а вызывают функции этого модуля.
 *
 * Шаг 1: публичный API зафиксирован, тела функций — заглушки с DEV-логом.
 * Шаг 2: ленивое создание `Howl` из `AUDIO_SOURCES` (src/constants/assets.ts),
 * реальные тайминги и фейды.
 */
import type { Howl } from 'howler';

import type { AudioTrackId } from '../types';
import { devLog } from '../utils/devLog';

const LOG_SCOPE = 'audio';

/** Созданные экземпляры `Howl` по дорожкам. На шаге 2 заполняется лениво при первом воспроизведении. */
const tracks = new Map<AudioTrackId, Howl>();

/** Запускает треск винила (фон интро и момент опускания иглы). */
export function playCrackle(): void {
  devLog(LOG_SCOPE, 'playCrackle() — заглушка шага 1');
}

/** Запускает основную песню. */
export function playSong(): void {
  devLog(LOG_SCOPE, 'playSong() — заглушка шага 1');
}

/**
 * Плавно меняет громкость всех активных дорожек.
 *
 * @param volume - Целевая громкость в диапазоне 0–1.
 * @param durationMs - Длительность фейда в миллисекундах.
 */
export function fadeAll(volume: number, durationMs: number): void {
  devLog(LOG_SCOPE, 'fadeAll() — заглушка шага 1', { volume, durationMs });
}

/** Немедленно останавливает все дорожки. Безопасно вызывать многократно. */
export function stopAll(): void {
  tracks.forEach((track) => {
    track.stop();
  });
  devLog(LOG_SCOPE, 'stopAll()');
}

// HMR (только dev): при горячей замене модуля старые экземпляры Howl не должны продолжать играть.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopAll();
  });
}
