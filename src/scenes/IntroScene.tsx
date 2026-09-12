import type { ReactElement } from 'react';

import { ScenePlaceholder } from '../components/ScenePlaceholder';
import type { SceneProps } from '../types';

/**
 * Сцена «Intro» — стартовый экран.
 * Шаг 2: клик по экрану опускает иглу проигрывателя и запускает звук через audioManager.
 * Шаг 1: заглушка с временной кнопкой «Далее».
 *
 * Default export — соглашение для модулей сцен: любую из них можно подключить через `React.lazy`.
 */
export default function IntroScene({ onNext }: SceneProps): ReactElement {
  return <ScenePlaceholder scene="intro" onNext={onNext} />;
}
