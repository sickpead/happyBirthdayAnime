import { lazy, Suspense, useCallback, useState, type ReactElement } from 'react';

import styles from './App.module.css';
import { CornerTurntable } from './components/CornerTurntable';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ModalHost } from './components/modals/ModalHost';
import { SceneLoader, SceneLoadError } from './components/SceneFallback';
import { INITIAL_SCENE } from './constants/scenes';
import { useModalManager } from './hooks/useModalManager';
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

/**
 * Сопоставляет сцене её компонент. `switch` по union-типу проверяется на полноту
 * (TypeScript + правило `switch-exhaustiveness-check`), а каждая сцена сохраняет
 * собственный набор пропсов — на шаге 2 они разойдутся.
 *
 * @param scene - Активная сцена.
 * @param onNext - Колбэк перехода к следующей сцене.
 */
function renderScene(scene: SceneName, onNext: () => void): ReactElement {
  switch (scene) {
    case 'intro':
      return <IntroScene onNext={onNext} />;
    case 'cake':
      return <CakeScene onNext={onNext} />;
    case 'desk':
      return <DeskScene onNext={onNext} />;
  }
}

/**
 * Корневой компонент. Владеет состоянием текущей сцены и открытой модалки и рендерит
 * активную сцену, проигрыватель в углу (виден везде, кроме intro), хост модалок и dev-панель.
 */
export function App(): ReactElement {
  const [scene, setScene] = useState<SceneName>(INITIAL_SCENE);
  const { activeModal, openModal, closeModal } = useModalManager();

  useStopAudioOnUnmount();

  const goToNextScene = useCallback(() => {
    setScene(getNextScene);
  }, []);

  return (
    <div className={styles.app}>
      <main className={styles.stage}>
        {/* key={scene}: при смене сцены граница ошибок сбрасывается. */}
        <ErrorBoundary key={scene} fallback={<SceneLoadError />}>
          <Suspense fallback={<SceneLoader />}>{renderScene(scene, goToNextScene)}</Suspense>
        </ErrorBoundary>
      </main>

      <CornerTurntable visible={scene !== 'intro'} />
      <ModalHost activeModal={activeModal} onClose={closeModal} />

      {import.meta.env.DEV && DevToolbar !== null && (
        <Suspense fallback={null}>
          <DevToolbar currentScene={scene} onSceneSelect={setScene} onModalOpen={openModal} />
        </Suspense>
      )}
    </div>
  );
}
