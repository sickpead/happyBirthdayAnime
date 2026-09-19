import type { SceneName } from './scene';

/**
 * Фаза общего перехода между сценами:
 * `idle` — перехода нет; `covering` — облака закрывают экран;
 * `revealing` — сцена уже сменена, облака расходятся.
 */
export type SceneTransitionPhase = 'idle' | 'covering' | 'revealing';

/** Длительности облачного перехода (см. `CloudTransitionLayer`), мс. */
export interface CloudTransitionTimings {
  /** Облака съезжаются и закрывают экран. */
  coverMs: number;
  /** Облака расходятся. */
  revealMs: number;
  /** Задержка между соседними облаками одной группы. */
  staggerMs: number;
}

/** Длительности перехода через затемнение (см. `DarkFadeLayer`), мс. */
export type DarkFadeTimings = Pick<CloudTransitionTimings, 'coverMs' | 'revealMs'>;

/** Публичный API перехода между сценами (см. `useSceneTransition`). */
export interface SceneTransitionApi {
  /**
   * Запускает переход: облака закрывают экран → смена сцены → облака открывают новую сцену.
   * Пока идёт переход, повторные вызовы игнорируются.
   */
  transitionToScene: (scene: SceneName) => void;
  /** Идёт ли сейчас переход. */
  isTransitioning: boolean;
}
