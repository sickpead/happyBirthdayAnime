import type { ReactElement, ReactNode } from 'react';

import { CLOUD_CURTAIN_LAYOUT, CLOUD_IMAGES, CLOUD_SIDES } from '../constants/cloudAssets';
import { classNames } from '../utils/classNames';
import styles from './CloudCurtain.module.css';

/** Пропсы {@link CloudCurtain}. */
export interface CloudCurtainProps {
  /** Дополнительный класс корня (позиционирование, слой). */
  className?: string;
  /** Контент поверх облаков — например, надпись и приглашение в intro. */
  children?: ReactNode;
}

const vw = (value: number): string => `${String(value)}vw`;
const vh = (value: number): string => `${String(value)}vh`;

/**
 * Облачная шторка: небо (`--gradient-sky-backdrop` из tokens.css) и две группы облаков
 * из `cloudAssets.ts`, которые вместе закрывают экран.
 *
 * Компонент статичен: в разметке облака стоят в закрытом положении, раскрытие и закрытие
 * анимирует GSAP (`src/animation/cloudCurtain.ts`) по data-атрибутам. Используется в intro
 * (`IntroCloudCover`) и в облачных переходах (`CloudTransitionLayer`: общий переход между
 * сценами и переходы между стадиями сцены Desk) — у каждого свой экземпляр.
 */
export function CloudCurtain({ className, children }: CloudCurtainProps): ReactElement {
  return (
    <div className={classNames(styles.curtain, className)} data-cloud-curtain>
      <div className={styles.sky} data-cloud-sky aria-hidden="true" />
      {CLOUD_SIDES.map((side) => (
        <div key={side} className={styles.group} aria-hidden="true">
          {CLOUD_CURTAIN_LAYOUT[side].map((cloud) => (
            <div
              key={cloud.id}
              className={styles.cloud}
              data-cloud-side={side}
              style={{ left: vw(cloud.leftVw), top: vh(cloud.topVh), width: vw(cloud.widthVw) }}
            >
              <img
                className={styles.image}
                src={CLOUD_IMAGES[cloud.image]}
                alt=""
                decoding="async"
                draggable={false}
                data-flipped={cloud.flipped}
              />
            </div>
          ))}
        </div>
      ))}
      {children}
    </div>
  );
}
