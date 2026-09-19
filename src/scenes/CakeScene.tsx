import { gsap } from 'gsap';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';

import { CAKE_SELECTORS, createBlowOutTimeline, createFlameFlicker } from '../animation/candles';
import { BirthdayCake } from '../components/BirthdayCake';
import { SkyAmbientBackdrop } from '../components/SkyAmbientBackdrop';
import { CAKE_CANDLE_POSITIONS } from '../constants/cakeCandles';
import { CAKE_TEXT, UI_TEXT } from '../constants/copy';
import { SCENE_LABELS } from '../constants/scenes';
import type { SceneProps } from '../types';
import { prefersReducedMotion } from '../utils/motion';
import styles from './CakeScene.module.css';

/** Фаза сцены: свечи горят → их задувают → погашены. */
type CakePhase = 'lit' | 'blowing' | 'blownOut';

/**
 * Сцена «Cake» — торт с пятью горящими свечами. По кнопке «Задуть свечу» огни гаснут
 * по очереди, из фитилей поднимается дым; после этого появляется кнопка «Далее →».
 * Вступление и тексты сцены — следующим шагом.
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
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<CakePhase>('lit');

  // Огни горят с момента появления сцены. Всё, что создано в GSAP-контексте
  // (включая задувание по клику), откатывается при уходе со сцены.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root === null) {
      return;
    }
    const context = gsap.context(() => {
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

  // Свечи погасли: «Далее» заменила «Задуть свечу» — переводим фокус на новую кнопку.
  useEffect(() => {
    if (phase === 'blownOut') {
      nextButtonRef.current?.focus();
    }
  }, [phase]);

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
          setPhase('blownOut');
        },
      });
    });
  }, []);

  return (
    <section ref={rootRef} className={styles.scene} aria-labelledby={headingId}>
      {/* Фон — небо с облаками, постоянно, пока сцена на экране. */}
      <SkyAmbientBackdrop visible={true} />
      <h1 id={headingId} className={styles.title}>
        {UI_TEXT.sceneTitle(SCENE_LABELS.cake)}
      </h1>
      <BirthdayCake className={styles.cake} label={CAKE_TEXT.cakeLabel} />
      <div className={styles.actions}>
        {phase === 'blownOut' ? (
          <button
            key="next"
            ref={nextButtonRef}
            type="button"
            className={styles.button}
            onClick={onNext}
          >
            {UI_TEXT.nextButton}
          </button>
        ) : (
          <button
            key="blow-out"
            type="button"
            className={styles.button}
            disabled={phase === 'blowing'}
            onClick={handleBlowOut}
          >
            {CAKE_TEXT.blowOut}
          </button>
        )}
      </div>
    </section>
  );
}
