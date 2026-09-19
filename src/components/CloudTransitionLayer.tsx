import { useEffect, useEffectEvent, useLayoutEffect, useRef, type ReactElement } from 'react';

import {
  CLOUD_CURTAIN_SELECTORS,
  createCloudCurtainTimeline,
  setCloudCurtainState,
} from '../animation/cloudCurtain';
import type { CloudTransitionTimings, SceneTransitionPhase } from '../types';
import { classNames } from '../utils/classNames';
import { CloudCurtain } from './CloudCurtain';
import styles from './CloudTransitionLayer.module.css';

/** Пропсы {@link CloudTransitionLayer}. */
export interface CloudTransitionLayerProps {
  /** Фаза перехода: `covering` — облака закрывают экран и стоят закрытыми, `revealing` — расходятся. */
  phase: SceneTransitionPhase;
  /** Длительности движения облаков. */
  timings: CloudTransitionTimings;
  /** Облака закрыли экран — можно подменять то, что под ними. */
  onCovered: () => void;
  /** Облака разошлись — переход завершён. */
  onRevealed: () => void;
  /** Класс корня: положение и слой наложения задаёт владелец. */
  className?: string;
}

/**
 * Облачный переход «закрыть → подменить → открыть». В фазе `covering` облака съезжаются
 * и закрывают экран (и остаются закрытыми, пока фаза не сменится), в `revealing` —
 * расходятся. В `idle` слой скрыт и не перехватывает клики, а во время перехода блокирует
 * клики по содержимому под облаками.
 *
 * Общий переход между сценами (`SceneTransitionClouds`) и переходы между стадиями
 * внутри сцены Desk — отдельные экземпляры этого слоя, каждый со своими таймингами.
 */
export function CloudTransitionLayer({
  phase,
  timings,
  onCovered,
  onRevealed,
  className,
}: CloudTransitionLayerProps): ReactElement {
  const rootRef = useRef<HTMLDivElement>(null);
  const notifyCovered = useEffectEvent(onCovered);
  const notifyRevealed = useEffectEvent(onRevealed);
  const { coverMs, revealMs, staggerMs } = timings;

  // До первой отрисовки: облака за краями экрана.
  useLayoutEffect(() => {
    const curtain = rootRef.current?.querySelector(CLOUD_CURTAIN_SELECTORS.root);
    if (curtain) {
      setCloudCurtainState(curtain, 'open');
    }
  }, []);

  useEffect(() => {
    const curtain = rootRef.current?.querySelector(CLOUD_CURTAIN_SELECTORS.root);
    if (!curtain) {
      return;
    }
    if (phase === 'idle') {
      setCloudCurtainState(curtain, 'open');
      return;
    }

    const isCovering = phase === 'covering';
    const timeline = createCloudCurtainTimeline(curtain, isCovering ? 'closed' : 'open', {
      durationMs: isCovering ? coverMs : revealMs,
      staggerMs,
    });
    timeline.eventCallback('onComplete', () => {
      if (isCovering) {
        notifyCovered();
      } else {
        notifyRevealed();
      }
    });

    // kill, а не revert: следующая фаза продолжает движение из текущего положения облаков.
    return () => {
      timeline.kill();
    };
  }, [phase, coverMs, revealMs, staggerMs]);

  return (
    <div
      ref={rootRef}
      className={classNames(styles.layer, className)}
      data-phase={phase}
      aria-hidden="true"
    >
      <CloudCurtain />
    </div>
  );
}
