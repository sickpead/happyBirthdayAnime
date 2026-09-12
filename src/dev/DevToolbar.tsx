import type { ReactElement } from 'react';

import { MODAL_ORDER, MODAL_TITLES } from '../constants/modals';
import { SCENE_LABELS, SCENE_ORDER } from '../constants/scenes';
import type { ModalId, SceneName } from '../types';
import styles from './DevToolbar.module.css';

/** Тексты dev-панели. Живут в dev-модуле, чтобы целиком выпадать из production-бандла. */
const DEV_TOOLBAR_TEXT = {
  label: 'Dev-навигация',
  badge: 'DEV',
  scenesGroup: 'Сцены',
  modalsGroup: 'Модалки',
} as const;

/** Пропсы {@link DevToolbar}. */
export interface DevToolbarProps {
  /** Текущая сцена — её кнопка отмечается как нажатая. */
  currentScene: SceneName;
  /** Прямой переход к сцене в обход последовательного «Далее». */
  onSceneSelect: (scene: SceneName) => void;
  /** Открывает модалку — чтобы проверять модалки до появления их триггеров на шаге 2. */
  onModalOpen: (modalId: ModalId) => void;
}

/**
 * Временная dev-панель внизу экрана: прямое переключение сцен и открытие модалок.
 * App подключает её только при `import.meta.env.DEV` через динамический импорт,
 * поэтому в production-сборке панели нет. Default export нужен для `React.lazy`.
 */
export default function DevToolbar({
  currentScene,
  onSceneSelect,
  onModalOpen,
}: DevToolbarProps): ReactElement {
  return (
    <nav className={styles.toolbar} aria-label={DEV_TOOLBAR_TEXT.label}>
      <span className={styles.badge} aria-hidden="true">
        {DEV_TOOLBAR_TEXT.badge}
      </span>

      <div className={styles.group} role="group" aria-label={DEV_TOOLBAR_TEXT.scenesGroup}>
        {SCENE_ORDER.map((scene) => (
          <button
            key={scene}
            type="button"
            className={styles.button}
            aria-pressed={scene === currentScene}
            onClick={() => {
              onSceneSelect(scene);
            }}
          >
            {SCENE_LABELS[scene]}
          </button>
        ))}
      </div>

      <div className={styles.group} role="group" aria-label={DEV_TOOLBAR_TEXT.modalsGroup}>
        {MODAL_ORDER.map((modalId) => (
          <button
            key={modalId}
            type="button"
            className={styles.button}
            onClick={() => {
              onModalOpen(modalId);
            }}
          >
            {MODAL_TITLES[modalId]}
          </button>
        ))}
      </div>
    </nav>
  );
}
