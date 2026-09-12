import type { ReactElement } from 'react';

import styles from './CornerTurntable.module.css';

/** Пропсы {@link CornerTurntable}. */
export interface CornerTurntableProps {
  /** Показан ли проигрыватель. Скрытие — через opacity и transition, без размонтирования. */
  visible: boolean;
}

/**
 * Проигрыватель в правом верхнем углу экрана (`position: fixed`), виден на сценах 'cake' и 'desk'.
 *
 * Шаг 1: декоративная заглушка — пластинка из CSS-примитивов. Компонент всегда смонтирован,
 * а видимость переключается CSS-переходом: на шаге 2 сюда добавляется анимация иглы
 * и вращения пластинки (GSAP).
 */
export function CornerTurntable({ visible }: CornerTurntableProps): ReactElement {
  return (
    <div className={styles.turntable} data-visible={visible} aria-hidden="true">
      <div className={styles.record}>
        <div className={styles.label} />
      </div>
    </div>
  );
}
