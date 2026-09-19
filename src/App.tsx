import { lazy, Suspense, useCallback, useState, type ReactElement } from 'react';

import styles from './App.module.css';
import { CornerTurntable } from './components/CornerTurntable';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ModalHost } from './components/modals/ModalHost';
import { SceneLoader, SceneLoadError } from './components/SceneFallback';
import { SceneTransitionClouds } from './components/SceneTransitionClouds';
import { INITIAL_SCENE } from './constants/scenes';
import { useModalManager } from './hooks/useModalManager';
import { SceneTransitionContext } from './hooks/useSceneTransition';
import { useSceneTransitionController } from './hooks/useSceneTransitionController';
import { useStopAudioOnUnmount } from './hooks/useStopAudioOnUnmount';
import CakeScene from './scenes/CakeScene';
import IntroScene from './scenes/IntroScene';
import { getNextScene } from './scenes/sceneSequence';
import type { SceneName } from './types';

// На шаге 2 сцена стола тянет Three.js / R3F / drei. Отдельный чанк через React.lazy
// избавляет стартовую сцену (intro) от загрузки 3D-зависимостей.
const DeskScene = lazy(() => import('./scenes/DeskScene'));

// Dev-панель: динамический импорт стоит за статически заменяемым `import.meta.env.DEV`,
// поэтому в production-сборку не попадают ни её код, ни стили.
const DevToolbar = import.meta.env.DEV ? lazy(() => import('./dev/DevToolbar')) : null;

/** Обработчики, которые App передаёт сценам. */
interface SceneHandlers {
  /** Переход к следующей сцене через общий облачный переход. */
  onNext: () => void;
  /** Проигрыватель из intro приземлился в правый верхний угол. */
  onTurntableDocked: () => void;
}

/**
 * Сопоставляет сцене её компонент. `switch` по union-типу проверяется на полноту
 * (TypeScript + правило `switch-exhaustiveness-check`), а каждая сцена получает
 * собственный набор пропсов.
 *
 * @param scene - Активная сцена.
 * @param handlers - Обработчики навигации и событий сцен.
 */
function renderScene(scene: SceneName, handlers: SceneHandlers): ReactElement {
  switch (scene) {
    case 'intro':
      return <IntroScene onTurntableDocked={handlers.onTurntableDocked} />;
    case 'cake':
      return <CakeScene onNext={handlers.onNext} />;
    case 'desk':
      return <DeskScene onNext={handlers.onNext} />;
  }
}

/**
 * Корневой компонент. Владеет текущей сценой, общим облачным переходом и открытой модалкой;
 * рендерит активную сцену, слой перехода, проигрыватель в углу (виден после intro),
 * хост модалок и dev-панель.
 */
export function App(): ReactElement {
  const [scene, setScene] = useState<SceneName>(INITIAL_SCENE);
  const [isTurntableDocked, setTurntableDocked] = useState(false);
  const { activeModal, openModal, closeModal } = useModalManager();

  useStopAudioOnUnmount();

  const changeScene = useCallback((next: SceneName) => {
    setScene(next);
    // Intro проигрывается с начала: иконка скрыта, пока проигрыватель снова не приземлится.
    if (next === 'intro') {
      setTurntableDocked(false);
    }
  }, []);

  const transition = useSceneTransitionController(changeScene);
  const { transitionToScene } = transition.api;
  const { cancel: cancelTransition } = transition;

  const goToNextScene = useCallback(() => {
    transitionToScene(getNextScene(scene));
  }, [scene, transitionToScene]);

  const handleTurntableDocked = useCallback(() => {
    setTurntableDocked(true);
  }, []);

  // Dev-панель переключает сцены мгновенно, прерывая идущий переход.
  const selectSceneDirectly = useCallback(
    (next: SceneName) => {
      cancelTransition();
      changeScene(next);
    },
    [cancelTransition, changeScene],
  );

  return (
    <SceneTransitionContext value={transition.api}>
      <div className={styles.app}>
        <main className={styles.stage}>
          {/* key={scene}: при смене сцены граница ошибок сбрасывается. */}
          <ErrorBoundary key={scene} fallback={<SceneLoadError />}>
            <Suspense fallback={<SceneLoader />}>
              {renderScene(scene, {
                onNext: goToNextScene,
                onTurntableDocked: handleTurntableDocked,
              })}
            </Suspense>
          </ErrorBoundary>
        </main>

        <SceneTransitionClouds
          phase={transition.phase}
          onCovered={transition.handleCovered}
          onRevealed={transition.handleRevealed}
        />
        <CornerTurntable visible={scene !== 'intro' || isTurntableDocked} />
        <ModalHost activeModal={activeModal} onClose={closeModal} />

        {import.meta.env.DEV && DevToolbar !== null && (
          <Suspense fallback={null}>
            <DevToolbar
              currentScene={scene}
              onSceneSelect={selectSceneDirectly}
              onModalOpen={openModal}
            />
          </Suspense>
        )}
      </div>
    </SceneTransitionContext>
  );
}
