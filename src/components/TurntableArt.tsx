import type { ReactElement } from 'react';

import { TURNTABLE_IMAGES } from '../constants/turntableAssets';
import { classNames } from '../utils/classNames';
import styles from './TurntableArt.module.css';

/** Пропсы {@link TurntableArt}. */
export interface TurntableArtProps {
  /**
   * Постоянное CSS-вращение пластинки (иконка в углу). Когда `false`, CSS-анимации нет вовсе —
   * вращением может управлять GSAP (сцена intro).
   */
  isVinylSpinning: boolean;
  /** Доступное имя. Если задано — проигрыватель получает `role="img"`, иначе он декоративный. */
  label?: string;
  /** Дополнительный класс корня (размер, позиционирование). */
  className?: string;
}

/**
 * Проигрыватель из PNG-слоёв на общем холсте фиксированных пропорций:
 * 1. корпус — с уже нарисованным тонармом (отдельный слой давал двойной рычаг);
 * 2. пластинка — обёртка-квадрат вокруг диска, вращается вокруг собственного центра.
 *
 * Вся геометрия — в процентах от холста (CSS-переменные из `cssVariables.ts`), поэтому
 * проигрыватель масштабируется целиком. Для GSAP слои помечены `data-turntable-*`.
 */
export function TurntableArt({
  isVinylSpinning,
  label,
  className,
}: TurntableArtProps): ReactElement {
  const hasLabel = label !== undefined;

  return (
    <div
      className={classNames(styles.turntable, className)}
      data-turntable-canvas
      role={hasLabel ? 'img' : undefined}
      aria-label={label}
      aria-hidden={hasLabel ? undefined : true}
    >
      <img
        className={styles.playerBody}
        src={TURNTABLE_IMAGES['player-body']}
        alt=""
        decoding="async"
        draggable={false}
      />
      <div className={styles.vinyl} data-turntable-vinyl data-spinning={isVinylSpinning ? 'true' : 'false'}>
        <img
          className={styles.vinylImage}
          src={TURNTABLE_IMAGES.vinyl}
          alt=""
          decoding="async"
          draggable={false}
        />
      </div>
      {/*
        Тонарм уже нарисован на `player-body.png`. Отдельный слой давал второго
        «гигантского» тонарма. Pivot оставляем пустым — intro GSAP может на него ссылаться.
      */}
      <div className={styles.tonearmPivot} data-turntable-tonearm aria-hidden="true" />
    </div>
  );
}
