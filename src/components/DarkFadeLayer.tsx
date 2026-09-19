import { gsap } from 'gsap';
import { useEffect, useEffectEvent, useRef, type ReactElement } from 'react';

import { EASINGS } from '../constants/timings';
import type { DarkFadeTimings, SceneTransitionPhase } from '../types';
import { classNames } from '../utils/classNames';
import { msToSeconds } from '../utils/time';
import styles from './DarkFadeLayer.module.css';

/** Пропсы {@link DarkFadeLayer}. */
export interface DarkFadeLayerProps {
  /** Фаза: `covering` — экран темнеет и остаётся тёмным, `revealing` — рассветляется. */
  phase: SceneTransitionPhase;
  /** Длительности затемнения и рассветления. */
  timings: DarkFadeTimings;
  /** Экран полностью затемнён — можно подменять то, что под ним. */
  onCovered: () => void;
  /** Затемнение ушло — переход завершён. */
  onRevealed: () => void;
  /** Класс корня: положение и слой наложения задаёт владелец. */
  className?: string;
}

/**
 * Переход через затемнение «закрыть → подменить → открыть» — тот же контракт, что
 * у `CloudTransitionLayer`, но без облаков: однотонный слой `--color-overlay-dark` плавно
 * набирает непрозрачность (`covering`), держится, пока фаза не сменится, и плавно уходит
 * (`revealing`). Пока слой виден, он блокирует клики по содержимому под ним; в `idle`
 * скрыт и не участвует в отрисовке.
 */
export function DarkFadeLayer({
  phase,
  timings,
  onCovered,
  onRevealed,
  className,
}: DarkFadeLayerProps): ReactElement {
  const rootRef = useRef<HTMLDivElement>(null);
  const notifyCovered = useEffectEvent(onCovered);
  const notifyRevealed = useEffectEvent(onRevealed);
  const { coverMs, revealMs } = timings;

  useEffect(() => {
    const layer = rootRef.current;
    if (!layer || phase === 'idle') {
      return;
    }

    const isCovering = phase === 'covering';
    const fade = gsap.to(layer, {
      autoAlpha: isCovering ? 1 : 0,
      duration: msToSeconds(isCovering ? coverMs : revealMs),
      ease: EASINGS.fade,
      onComplete: () => {
        if (isCovering) {
          notifyCovered();
        } else {
          notifyRevealed();
        }
      },
    });

    // kill, а не revert: следующая фаза продолжает с текущей непрозрачности.
    return () => {
      fade.kill();
    };
  }, [phase, coverMs, revealMs]);

  return (
    <div
      ref={rootRef}
      className={classNames(styles.layer, className)}
      data-phase={phase}
      aria-hidden="true"
    />
  );
}
