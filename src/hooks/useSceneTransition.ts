import { createContext, useContext } from 'react';

import type { SceneTransitionApi } from '../types';

/**
 * Контекст общего перехода между сценами. Значение предоставляет `App`
 * (см. `useSceneTransitionController`), сцены получают его через {@link useSceneTransition}.
 */
export const SceneTransitionContext = createContext<SceneTransitionApi | null>(null);

/**
 * Даёт сцене доступ к общему облачному переходу:
 * `const { transitionToScene } = useSceneTransition(); transitionToScene('cake');`
 *
 * @throws Если вызван вне `SceneTransitionContext` — это ошибка сборки дерева компонентов.
 */
export function useSceneTransition(): SceneTransitionApi {
  const api = useContext(SceneTransitionContext);
  if (api === null) {
    throw new Error('useSceneTransition: нет SceneTransitionContext (провайдер задаётся в App)');
  }
  return api;
}
