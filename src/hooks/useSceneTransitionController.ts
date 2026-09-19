import { useCallback, useMemo, useRef, useState } from 'react';

import type { SceneName, SceneTransitionApi, SceneTransitionPhase } from '../types';

/** Состояние и обработчики общего перехода — для `App` и `SceneTransitionClouds`. */
export interface SceneTransitionController {
  /** Текущая фаза перехода. */
  phase: SceneTransitionPhase;
  /** API для сцен — кладётся в `SceneTransitionContext`. */
  api: SceneTransitionApi;
  /** Облака закрыли экран: меняем сцену и начинаем раскрытие. */
  handleCovered: () => void;
  /** Облака разошлись: переход завершён. */
  handleRevealed: () => void;
  /** Прервать переход без смены сцены (прямая навигация из dev-панели). */
  cancel: () => void;
}

/**
 * Машина состояний общего перехода: `idle` → `covering` → (смена сцены) → `revealing` → `idle`.
 * Сама анимация — в `SceneTransitionClouds`; хук только хранит фазу и целевую сцену.
 *
 * @param swapScene - Меняет сцену, пока экран закрыт облаками.
 */
export function useSceneTransitionController(
  swapScene: (scene: SceneName) => void,
): SceneTransitionController {
  const [phase, setPhase] = useState<SceneTransitionPhase>('idle');
  // Целевая сцена в ref: проверка «переход уже идёт» должна быть синхронной,
  // иначе два быстрых вызова успеют запустить два перехода.
  const pendingSceneRef = useRef<SceneName | null>(null);

  const transitionToScene = useCallback((scene: SceneName) => {
    if (pendingSceneRef.current !== null) {
      return;
    }
    pendingSceneRef.current = scene;
    setPhase('covering');
  }, []);

  const handleCovered = useCallback(() => {
    const scene = pendingSceneRef.current;
    if (scene !== null) {
      swapScene(scene);
    }
    setPhase('revealing');
  }, [swapScene]);

  const handleRevealed = useCallback(() => {
    pendingSceneRef.current = null;
    setPhase('idle');
  }, []);

  const cancel = useCallback(() => {
    pendingSceneRef.current = null;
    setPhase('idle');
  }, []);

  const api = useMemo<SceneTransitionApi>(
    () => ({ transitionToScene, isTransitioning: phase !== 'idle' }),
    [transitionToScene, phase],
  );

  return { phase, api, handleCovered, handleRevealed, cancel };
}
