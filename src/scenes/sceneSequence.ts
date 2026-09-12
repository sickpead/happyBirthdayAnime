import { NEXT_SCENE } from '../constants/scenes';
import type { SceneName } from '../types';

/**
 * Возвращает сцену, следующую за текущей (правила — в `NEXT_SCENE`).
 * Чистая функция: подходит как updater для `setState` — `setScene(getNextScene)`.
 *
 * @param current - Текущая сцена.
 */
export function getNextScene(current: SceneName): SceneName {
  return NEXT_SCENE[current];
}
