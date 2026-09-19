import type { ReactElement } from 'react';

import { SCENE_TRANSITION_TIMINGS } from '../constants/timings';
import type { SceneTransitionPhase } from '../types';
import { CloudTransitionLayer } from './CloudTransitionLayer';
import styles from './SceneTransitionClouds.module.css';

/** Пропсы {@link SceneTransitionClouds}. */
export interface SceneTransitionCloudsProps {
  /** Фаза перехода из `useSceneTransitionController`. */
  phase: SceneTransitionPhase;
  /** Облака закрыли экран — можно менять сцену. */
  onCovered: () => void;
  /** Облака разошлись — переход завершён. */
  onRevealed: () => void;
}

/**
 * Общий облачный переход между сценами. В фазе `covering` облака съезжаются и закрывают
 * экран, в `revealing` — расходятся, показывая уже сменённую сцену. В `idle` слой скрыт
 * и не перехватывает клики. Лежит над сценами, но под иконкой проигрывателя.
 */
export function SceneTransitionClouds({
  phase,
  onCovered,
  onRevealed,
}: SceneTransitionCloudsProps): ReactElement {
  return (
    <CloudTransitionLayer
      className={styles.overlay}
      phase={phase}
      timings={SCENE_TRANSITION_TIMINGS}
      onCovered={onCovered}
      onRevealed={onRevealed}
    />
  );
}
