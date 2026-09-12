import type { SceneName } from '../types';

/** Сцена, с которой стартует приложение. */
export const INITIAL_SCENE: SceneName = 'intro';

/** Порядок сцен — используется dev-переключателем. */
export const SCENE_ORDER = ['intro', 'cake', 'desk'] as const satisfies readonly SceneName[];

/**
 * Следующая сцена для каждой сцены. `Record` гарантирует, что при добавлении
 * новой сцены TypeScript потребует описать и её переход.
 *
 * Шаг 1: после 'desk' поток замыкается на 'intro' — только для проверки навигации.
 * На шаге 2 переходы будут инициировать сами механики сцен.
 */
export const NEXT_SCENE: Readonly<Record<SceneName, SceneName>> = {
  intro: 'cake',
  cake: 'desk',
  desk: 'intro',
};

/** Человекочитаемые названия сцен. */
export const SCENE_LABELS: Readonly<Record<SceneName, string>> = {
  intro: 'Intro',
  cake: 'Cake',
  desk: 'Desk',
};
