import { gsap } from 'gsap';

import { CLOUD_OFFSCREEN_SHIFT_VW } from '../constants/cloudAssets';
import { CLOUD_SKY_FADE_MS, EASINGS } from '../constants/timings';
import type { CloudCurtainState, CloudSide } from '../types';
import { msToSeconds } from '../utils/time';

/** Селекторы разметки `CloudCurtain` — контракт между компонентом и анимациями. */
export const CLOUD_CURTAIN_SELECTORS = {
  root: '[data-cloud-curtain]',
  sky: '[data-cloud-sky]',
  left: '[data-cloud-side="left"]',
  right: '[data-cloud-side="right"]',
} as const;

/** Параметры движения облаков. */
export interface CloudCurtainMotion {
  /** Длительность движения одного облака, мс. */
  durationMs: number;
  /** Задержка между соседними облаками одной группы, мс. */
  staggerMs: number;
}

interface CurtainParts {
  sky: HTMLElement[];
  left: HTMLElement[];
  right: HTMLElement[];
}

function getCurtainParts(curtain: Element): CurtainParts {
  const all = (selector: string): HTMLElement[] =>
    Array.from(curtain.querySelectorAll<HTMLElement>(selector));
  return {
    sky: all(CLOUD_CURTAIN_SELECTORS.sky),
    left: all(CLOUD_CURTAIN_SELECTORS.left),
    right: all(CLOUD_CURTAIN_SELECTORS.right),
  };
}

/** Смещение облака за край экрана: левые уезжают влево, правые — вправо. */
function offscreenX(side: CloudSide): string {
  const direction = side === 'left' ? -1 : 1;
  return `${String(direction * CLOUD_OFFSCREEN_SHIFT_VW)}vw`;
}

/**
 * Мгновенно (без анимации) переводит шторку в состояние.
 *
 * @param curtain - Корневой элемент `CloudCurtain`.
 * @param state - `open` — облака за краями, небо скрыто; `closed` — экран закрыт.
 */
export function setCloudCurtainState(curtain: Element, state: CloudCurtainState): void {
  const { sky, left, right } = getCurtainParts(curtain);
  const isOpen = state === 'open';
  gsap.set(left, { x: isOpen ? offscreenX('left') : 0 });
  gsap.set(right, { x: isOpen ? offscreenX('right') : 0 });
  gsap.set(sky, { autoAlpha: isOpen ? 0 : 1 });
}

/**
 * Создаёт таймлайн раскрытия или закрытия шторки: облака каждой группы по очереди
 * (с `staggerMs`) уезжают за свой край экрана или возвращаются.
 *
 * Небо за облаками видно напрямую всё время, пока облака в кадре: при закрытии оно
 * проявляется в самом начале (`CLOUD_SKY_FADE_MS`) — облака собираются уже на фоне неба;
 * при раскрытии остаётся до конца и гаснет, когда облака почти ушли. Длительность
 * таймлайна от этого не меняется: она по-прежнему равна движению облаков.
 *
 * @param curtain - Корневой элемент `CloudCurtain`.
 * @param target - Конечное состояние: `open` или `closed`.
 * @param motion - Длительность и задержка между облаками.
 * @returns Таймлайн GSAP — его можно вложить в другой таймлайн или слушать `onComplete`.
 */
export function createCloudCurtainTimeline(
  curtain: Element,
  target: CloudCurtainState,
  { durationMs, staggerMs }: CloudCurtainMotion,
): gsap.core.Timeline {
  const { sky, left, right } = getCurtainParts(curtain);
  const isOpening = target === 'open';
  const cloudMotion = {
    duration: msToSeconds(durationMs),
    stagger: msToSeconds(staggerMs),
    ease: EASINGS.clouds,
  };
  // Последнее облако самой длинной группы трогается позже первого на stagger × (n − 1).
  const cloudsEndMs = durationMs + staggerMs * Math.max(0, left.length - 1, right.length - 1);
  const skyFadeMs = Math.min(CLOUD_SKY_FADE_MS, durationMs);

  const timeline = gsap
    .timeline()
    .to(left, { ...cloudMotion, x: isOpening ? offscreenX('left') : 0 }, 0)
    .to(right, { ...cloudMotion, x: isOpening ? offscreenX('right') : 0 }, 0);

  return isOpening
    ? timeline.to(
        sky,
        { autoAlpha: 0, duration: msToSeconds(skyFadeMs), ease: EASINGS.skyVanish },
        msToSeconds(cloudsEndMs - skyFadeMs),
      )
    : timeline.to(
        sky,
        { autoAlpha: 1, duration: msToSeconds(skyFadeMs), ease: EASINGS.skyAppear },
        0,
      );
}
