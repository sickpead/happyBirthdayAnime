import type { ReactElement } from 'react';

import styles from './CornerTurntable.module.css';
import { TurntableArt } from './TurntableArt';

/** Пропсы {@link CornerTurntable}. */
export interface CornerTurntableProps {
  /** Показан ли проигрыватель. Скрытие — через opacity и transition, без размонтирования. */
  visible: boolean;
}

/**
 * Иконка проигрывателя в правом верхнем углу (`position: fixed`): те же слои, что в intro —
 * корпус, вращающаяся пластинка (тот же период) и тонарм в рабочем положении поверх неё.
 * Появляется, когда проигрыватель из intro «приземлился» в угол, и остаётся видимой во всех
 * следующих сценах.
 *
 * Корень помечен `data-corner-turntable`: по его холсту intro вычисляет, куда уменьшаться.
 * Декоративна для скринридеров; пока скрыта — пластинка не вращается.
 */
export function CornerTurntable({ visible }: CornerTurntableProps): ReactElement {
  return (
    <div className={styles.corner} data-visible={visible} data-corner-turntable aria-hidden="true">
      <TurntableArt isVinylSpinning={visible} />
    </div>
  );
}
