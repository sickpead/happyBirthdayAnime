import type { ReactElement } from 'react';

import { UI_TEXT } from '../constants/copy';
import styles from './SceneFallback.module.css';

/** Индикатор загрузки лениво подключаемой сцены — fallback для `Suspense`. */
export function SceneLoader(): ReactElement {
  return (
    <div className={styles.fallback} role="status">
      {UI_TEXT.sceneLoading}
    </div>
  );
}

/**
 * Экран ошибки сцены — fallback для `ErrorBoundary`. Предлагает перезагрузить страницу:
 * повторный рендер не поможет, если не загрузился чанк ленивой сцены,
 * потому что `React.lazy` кэширует отклонённый импорт.
 */
export function SceneLoadError(): ReactElement {
  const handleReload = (): void => {
    window.location.reload();
  };

  return (
    <div className={styles.fallback} role="alert">
      <p className={styles.message}>{UI_TEXT.sceneLoadError}</p>
      <button type="button" className={styles.reloadButton} onClick={handleReload}>
        {UI_TEXT.reloadPage}
      </button>
    </div>
  );
}
