import { gsap } from 'gsap';

import {
  CLOUD_CURTAIN_SELECTORS,
  createCloudCurtainTimeline,
  setCloudCurtainState,
} from '../animation/cloudCurtain';
import {
  CAKE_CLOUD_CLOSE_DURATION_MS,
  CAKE_CLOUD_CLOSE_STAGGER_MS,
  CAKE_CONTENT_FADE_MS,
  CAKE_WISH_FADE_IN_MS,
  CAKE_WISH_HOLD_MS,
} from '../constants/cakeTimings';
import { EASINGS } from '../constants/timings';
import { msToSeconds } from '../utils/time';

/** Селекторы сцены Cake — контракт между разметкой и таймлайном закрытия. */
export const CAKE_SCENE_SELECTORS = {
  hint: '[data-cake-hint]',
  actions: '[data-cake-actions]',
  wish: '[data-cake-wish]',
} as const;

export interface CakeCloseOptions {
  /** Для prefers-reduced-motion: облака и тексты переключаются без движения. */
  reducedMotion: boolean;
  /** Облака закрыты, пожелание прочитано. */
  onComplete: () => void;
}

function requireElement(root: Element, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (element === null) {
    throw new Error(`cake: не найден элемент ${selector}`);
  }
  return element;
}

const fade = (durationMs: number): gsap.TweenVars => ({
  duration: msToSeconds(durationMs),
  ease: EASINGS.fade,
});

/**
 * После дыма: подсказка и кнопка гаснут, облака закрывают торт, на них проявляется
 * пожелание — и сцена держит паузу, чтобы его успели прочитать.
 */
export function createCakeCloseTimeline(
  root: HTMLElement,
  { reducedMotion, onComplete }: CakeCloseOptions,
): gsap.core.Timeline {
  const curtain = requireElement(root, CLOUD_CURTAIN_SELECTORS.root);
  const hint = requireElement(root, CAKE_SCENE_SELECTORS.hint);
  const actions = requireElement(root, CAKE_SCENE_SELECTORS.actions);
  const wish = requireElement(root, CAKE_SCENE_SELECTORS.wish);
  const timeline = gsap.timeline({ onComplete });

  if (reducedMotion) {
    setCloudCurtainState(curtain, 'closed');
    gsap.set([hint, actions], { autoAlpha: 0 });
    gsap.set(wish, { autoAlpha: 1 });
    return timeline.to({}, { duration: msToSeconds(CAKE_WISH_HOLD_MS) });
  }

  return timeline
    .to([hint, actions], { autoAlpha: 0, ...fade(CAKE_CONTENT_FADE_MS) }, 0)
    .add(
      createCloudCurtainTimeline(curtain, 'closed', {
        durationMs: CAKE_CLOUD_CLOSE_DURATION_MS,
        staggerMs: CAKE_CLOUD_CLOSE_STAGGER_MS,
      }),
      0,
    )
    .to(
      wish,
      { autoAlpha: 1, ...fade(CAKE_WISH_FADE_IN_MS) },
      `-=${String(msToSeconds(CAKE_WISH_FADE_IN_MS))}`,
    )
    .to({}, { duration: msToSeconds(CAKE_WISH_HOLD_MS) });
}
