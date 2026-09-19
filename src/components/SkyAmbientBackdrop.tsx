import type { CSSProperties, ReactElement } from 'react';

import {
  AMBIENT_CLOUD_MAX_DRIFT_MS,
  AMBIENT_CLOUD_MIN_DRIFT_MS,
  SKY_AMBIENT_CLOUDS,
} from '../constants/ambientBackdrop';
import { CLOUD_IMAGES } from '../constants/cloudAssets';
import { classNames } from '../utils/classNames';
import styles from './SkyAmbientBackdrop.module.css';

/** Пропсы {@link SkyAmbientBackdrop}. */
export interface SkyAmbientBackdropProps {
  /**
   * Видны ли облака на небе: `true` — плавно проявляются (opacity 0 → 1), `false` — гаснут
   * (1 → 0), за `AMBIENT_CLOUD_FADE_MS`. Небо-градиент видно всегда.
   */
  visible: boolean;
  /** Дополнительный класс корня. */
  className?: string;
}

type CloudStyle = CSSProperties & Record<'--drift-distance' | '--drift-duration', string>;

const vw = (value: number): string => `${String(value)}vw`;
const vh = (value: number): string => `${String(value)}vh`;
const ms = (value: number): string => `${String(value)}ms`;

/** Доля золотого сечения: равномерно разбрасывает полупериоды дрейфа по диапазону. */
const GOLDEN_RATIO_FRACTION = 0.618;
const DRIFT_ROUNDING_MS = 100;

/** Полупериод дрейфа облака по его номеру — детерминированно в диапазоне min…max. */
function driftDurationMs(index: number): number {
  const share = (index * GOLDEN_RATIO_FRACTION) % 1;
  const duration =
    AMBIENT_CLOUD_MIN_DRIFT_MS + (AMBIENT_CLOUD_MAX_DRIFT_MS - AMBIENT_CLOUD_MIN_DRIFT_MS) * share;
  return Math.round(duration / DRIFT_ROUNDING_MS) * DRIFT_ROUNDING_MS;
}

/**
 * Фон-небо сцены: градиент `--gradient-sky-backdrop` на всю сцену и поверх него мягкие
 * бледные облака (картинки из `cloudAssets.ts`, раскладка и тайминги — `ambientBackdrop.ts`),
 * которые медленно дрейфуют. Больше ничего — содержимое сцены лежит поверх.
 *
 * Слой стоит под всем содержимым сцены (`z-index: -1`), поэтому корень сцены должен
 * создавать контекст наложения — это делает утилита `.scene-ambient-light`, которую
 * подключает корень каждой сцены. При `prefers-reduced-motion` облака не дрейфуют.
 */
export function SkyAmbientBackdrop({ visible, className }: SkyAmbientBackdropProps): ReactElement {
  return (
    <div className={classNames(styles.backdrop, className)} data-sky-backdrop aria-hidden="true">
      <div className={styles.clouds} data-sky-clouds data-visible={visible}>
        {SKY_AMBIENT_CLOUDS.map((cloud, index) => {
          const style: CloudStyle = {
            left: vw(cloud.leftVw),
            top: vh(cloud.topVh),
            width: vw(cloud.widthVw),
            opacity: cloud.opacity,
            '--drift-distance': vw(cloud.driftVw),
            '--drift-duration': ms(driftDurationMs(index)),
          };
          return (
            <div key={cloud.id} className={styles.cloud} style={style} data-sky-cloud={cloud.id}>
              <img
                className={styles.image}
                src={CLOUD_IMAGES[cloud.image]}
                alt=""
                decoding="async"
                draggable={false}
                data-flipped={cloud.flipped}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
