import { gsap } from 'gsap';

import {
  BLOW_OUT_KEYFRAMES,
  BLOW_OUT_STAGGER_MS,
  FLAME_CYCLE_MS,
  FLAME_FLICKER_KEYFRAMES,
  SMOKE_DELAY_MS,
  SMOKE_DRIFT_X_PERCENT,
  SMOKE_DURATION_MS,
  SMOKE_FADE_IN_MS,
  SMOKE_PEAK_OPACITY,
  SMOKE_RISE_Y_PERCENT,
  SMOKE_SCALE_FROM,
  SMOKE_SCALE_TO,
} from '../constants/cakeTimings';
import { EASINGS } from '../constants/timings';
import { msToSeconds } from '../utils/time';

/** Селекторы разметки `BirthdayCake` — контракт между компонентом и анимациями. */
export const CAKE_SELECTORS = {
  flame: '[data-cake-flame]',
  smoke: '[data-cake-smoke]',
} as const;

/** Значение для i-й свечи из массива «по свечам» (по кругу, если свечей больше). */
function forCandle(values: readonly [number, ...number[]], index: number): number {
  return values[index % values.length] ?? values[0];
}

const BLOW_OUT_TOTAL_MS = BLOW_OUT_KEYFRAMES.reduce((total, frame) => total + frame.durationMs, 0);

/**
 * Бесконечное «дыхание» огня: форма меняется через scaleX / scaleY / rotation / opacity
 * вокруг основания пламени (transform-origin задан в разметке). У каждой свечи свои
 * длительность цикла и сдвиг старта — огни не идут в такт.
 *
 * @param flame - Элемент огня.
 * @param index - Номер свечи слева направо (с нуля).
 * @param delayMs - Сдвиг старта этой свечи (`flickerDelayMs` из `cakeCandles.ts`).
 * @returns Бесконечный твин; его нужно остановить (`kill`), когда свечу задувают.
 */
export function createFlameFlicker(
  flame: Element,
  index: number,
  delayMs: number,
): gsap.core.Tween {
  return gsap.to(flame, {
    keyframes: { ...FLAME_FLICKER_KEYFRAMES, easeEach: EASINGS.flame },
    duration: msToSeconds(forCandle(FLAME_CYCLE_MS, index)),
    delay: msToSeconds(delayMs),
    ease: EASINGS.linear,
    repeat: -1,
  });
}

/** Параметры задувания. */
export interface BlowOutOptions {
  /** «Дыхание» каждого огня — останавливается в момент, когда задувают именно эту свечу. */
  flickers: readonly gsap.core.Tween[];
  /** Для prefers-reduced-motion: огни просто гаснут по очереди, без колебаний и дыма. */
  reducedMotion: boolean;
  /** Все свечи погашены и дым рассеялся. */
  onComplete: () => void;
}

/**
 * Задувание свечей: огни гаснут по очереди слева направо. Каждый сначала отклоняется,
 * будто на него подули, затем сжимается и гаснет; из фитиля поднимается струйка дыма —
 * растёт, сносится в сторону и растворяется.
 *
 * @param root - Элемент, внутри которого лежит `BirthdayCake`.
 * @param options - Горение огней, режим движения и колбэк завершения.
 * @returns Таймлайн задувания (создавайте внутри `gsap.context` сцены).
 */
export function createBlowOutTimeline(
  root: Element,
  { flickers, reducedMotion, onComplete }: BlowOutOptions,
): gsap.core.Timeline {
  const flames = Array.from(root.querySelectorAll<HTMLElement>(CAKE_SELECTORS.flame));
  const smokes = Array.from(root.querySelectorAll<HTMLElement>(CAKE_SELECTORS.smoke));
  const timeline = gsap.timeline({ onComplete });

  flames.forEach((flame, index) => {
    const start = msToSeconds(index * BLOW_OUT_STAGGER_MS);
    const flicker = flickers[index];
    timeline.call(
      () => {
        flicker?.kill();
      },
      undefined,
      start,
    );

    if (reducedMotion) {
      timeline.to(
        flame,
        { opacity: 0, duration: msToSeconds(BLOW_OUT_TOTAL_MS), ease: EASINGS.fade },
        start,
      );
      return;
    }

    // Огонь отклоняется от «дуновения», сжимается и гаснет — от своей текущей формы.
    timeline.to(
      flame,
      {
        keyframes: BLOW_OUT_KEYFRAMES.map(({ durationMs, ...shape }) => ({
          ...shape,
          duration: msToSeconds(durationMs),
          ease: EASINGS.flame,
        })),
      },
      start,
    );

    // Дым поднимается из фитиля, пока огонь догорает.
    const smoke = smokes[index];
    if (smoke === undefined) {
      return;
    }
    const smokeStart = start + msToSeconds(SMOKE_DELAY_MS);
    timeline
      .fromTo(
        smoke,
        { scale: SMOKE_SCALE_FROM, xPercent: 0, yPercent: 0 },
        {
          scale: SMOKE_SCALE_TO,
          xPercent: forCandle(SMOKE_DRIFT_X_PERCENT, index),
          yPercent: SMOKE_RISE_Y_PERCENT,
          duration: msToSeconds(SMOKE_DURATION_MS),
          ease: EASINGS.smokeRise,
        },
        smokeStart,
      )
      .fromTo(
        smoke,
        { autoAlpha: 0 },
        {
          autoAlpha: SMOKE_PEAK_OPACITY,
          duration: msToSeconds(SMOKE_FADE_IN_MS),
          ease: EASINGS.smokeAppear,
        },
        smokeStart,
      )
      .to(
        smoke,
        {
          autoAlpha: 0,
          duration: msToSeconds(SMOKE_DURATION_MS - SMOKE_FADE_IN_MS),
          ease: EASINGS.smokeVanish,
        },
        smokeStart + msToSeconds(SMOKE_FADE_IN_MS),
      );
  });

  return timeline;
}
