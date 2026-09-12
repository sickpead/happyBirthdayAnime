import type { ReactElement } from 'react';

import { ScenePlaceholder } from '../components/ScenePlaceholder';
import type { SceneProps } from '../types';

/**
 * Сцена «Cake» — торт со свечой.
 * Шаг 2: механика задувания свечи, после которой сцена сама вызывает переход.
 * Шаг 1: заглушка с временной кнопкой «Далее».
 */
export default function CakeScene({ onNext }: SceneProps): ReactElement {
  return <ScenePlaceholder scene="cake" onNext={onNext} />;
}
