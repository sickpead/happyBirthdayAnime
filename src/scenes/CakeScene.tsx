import '@fontsource/marck-script/index.css';

import { gsap } from 'gsap';
import { useCallback, useId, useLayoutEffect, useRef, useState, type ReactElement } from 'react';

import { CAKE_SELECTORS, createBlowOutTimeline, createFlameFlicker } from '../animation/candles';
import { CLOUD_CURTAIN_SELECTORS, setCloudCurtainState } from '../animation/cloudCurtain';
import { BirthdayCake } from '../components/BirthdayCake';
import { CloudCurtain } from '../components/CloudCurtain';
import { SkyAmbientBackdrop } from '../components/SkyAmbientBackdrop';
import { CAKE_CANDLE_POSITIONS } from '../constants/cakeCandles';
import { CAKE_TEXT, UI_TEXT } from '../constants/copy';
import { SCENE_LABELS } from '../constants/scenes';
import type { SceneProps } from '../types';
import { prefersReducedMotion } from '../utils/motion';
import { createCakeCloseTimeline } from './cakeTimeline';
import styles from './CakeScene.module.css';

/** Фаза сцены: свечи горят → их задувают → облака закрывают торт. */
type CakePhase = 'lit' | 'blowing' | 'closing';

/**
 * Сцена «Cake» — торт с горящими свечами. По кнопке «Задуть свечу»
 * огни гаснут, из фитилей поднимается дым, затем облака закрывают экран и на них
 * появляется пожелание — после паузы сцена уходит на стол.
 *
 * Default export — соглашение для модулей сцен: любую из них можно подключить через `React.lazy`.
 */
export default function CakeScene({ onNext }: SceneProps): ReactElement {
  const headingId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const animationContextRef = useRef<gsap.Context | null>(null);
  const flickersRef = useRef<gsap.core.Tween[]>([]);
  // Синхронная защита от двойного клика: состояние обновится только после ререндера.
  const hasBlownOutRef = useRef(false);
  const [phase, setPhase] = useState<CakePhase>('lit');
  const [isCurtainOpen, setCurtainOpen] = useState(true);

  // Огни горят с момента появления сцены. Шторка стартует открытой: торт виден сразу.
  // Всё, что создано в GSAP-контексте (включая задувание и закрытие), откатывается при уходе.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root === null) {
      return;
    }
    const context = gsap.context(() => {
      const curtain = root.querySelector(CLOUD_CURTAIN_SELECTORS.root);
      if (curtain !== null) {
        setCloudCurtainState(curtain, 'open');
      }
      if (prefersReducedMotion()) {
        return;
      }
      flickersRef.current = Array.from(root.querySelectorAll(CAKE_SELECTORS.flame)).map(
        (flame, index) =>
          createFlameFlicker(flame, index, CAKE_CANDLE_POSITIONS[index]?.flickerDelayMs ?? 0),
      );
    }, root);
    animationContextRef.current = context;

    return () => {
      context.revert();
      animationContextRef.current = null;
      flickersRef.current = [];
    };
  }, []);

  const handleBlowOut = useCallback(() => {
    const root = rootRef.current;
    const context = animationContextRef.current;
    if (root === null || context === null || hasBlownOutRef.current) {
      return;
    }
    hasBlownOutRef.current = true;
    setPhase('blowing');

    context.add(() => {
      createBlowOutTimeline(root, {
        flickers: flickersRef.current,
        reducedMotion: prefersReducedMotion(),
        onComplete: () => {
          setPhase('closing');
          setCurtainOpen(false);
          createCakeCloseTimeline(root, {
            reducedMotion: prefersReducedMotion(),
            onComplete: onNext,
          });
        },
      });
    });
  }, [onNext]);

  return (
    <section ref={rootRef} className={styles.scene} aria-labelledby={headingId}>
      <SkyAmbientBackdrop visible={isCurtainOpen} />
      <h1 id={headingId} className={styles.sceneName}>
        {UI_TEXT.sceneTitle(SCENE_LABELS.cake)}
      </h1>
      <div className={styles.stage}>
        <p className={styles.hint} data-cake-hint>
          {CAKE_TEXT.hint}
        </p>
        <BirthdayCake className={styles.cake} label={CAKE_TEXT.cakeLabel} />
      </div>
      <div className={styles.actions} data-cake-actions>
        <button
          type="button"
          className={styles.button}
          disabled={phase !== 'lit'}
          onClick={handleBlowOut}
        >
          {CAKE_TEXT.blowOut}
        </button>
      </div>
      <CloudCurtain className={styles.cover}>
        <p className={styles.wish} data-cake-wish>
          {CAKE_TEXT.wish}
        </p>
      </CloudCurtain>
    </section>
  );
}
