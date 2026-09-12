import { useId, type ReactElement } from 'react';

import { UI_TEXT } from '../constants/copy';
import { SCENE_LABELS } from '../constants/scenes';
import type { SceneName, SceneProps } from '../types';
import styles from './ScenePlaceholder.module.css';

/** Пропсы {@link ScenePlaceholder}. */
export interface ScenePlaceholderProps extends SceneProps {
  /** Сцена, название которой выводится в заголовке. */
  scene: SceneName;
}

/**
 * Временное содержимое сцены для шага 1: крупный заголовок «Сцена: …» и кнопка «Далее →».
 * На шаге 2 каждая сцена заменяет его своей механикой, а компонент удаляется.
 */
export function ScenePlaceholder({ scene, onNext }: ScenePlaceholderProps): ReactElement {
  const headingId = useId();

  return (
    <section className={styles.scene} aria-labelledby={headingId}>
      <h1 id={headingId} className={styles.title}>
        {UI_TEXT.sceneTitle(SCENE_LABELS[scene])}
      </h1>
      <button type="button" className={styles.nextButton} onClick={onNext}>
        {UI_TEXT.nextButton}
      </button>
    </section>
  );
}
