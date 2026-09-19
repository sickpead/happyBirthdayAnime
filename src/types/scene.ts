/**
 * Идентификатор сцены. Порядок прохождения и переходы задаются в `src/constants/scenes.ts`.
 */
export type SceneName = 'intro' | 'cake' | 'desk';

/**
 * Общий контракт пропсов сцены-заглушки.
 * Сцены с собственной механикой объявляют свои пропсы (см. {@link IntroSceneProps}).
 */
export interface SceneProps {
  /** Запрашивает переход к следующей сцене. */
  onNext: () => void;
}

/** Пропсы сцены intro. */
export interface IntroSceneProps {
  /**
   * Проигрыватель «приземлился» в правый верхний угол — пора показать `CornerTurntable`.
   * Вызывается под облачным закрытием, до перехода к следующей сцене.
   */
  onTurntableDocked: () => void;
}
