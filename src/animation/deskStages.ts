import { gsap } from 'gsap';

import { CROSSFADE_DURATION_MS, WIDE_FADE_IN_MS } from '../constants/deskTimings';
import { EASINGS } from '../constants/timings';
import type { DeskStageId, DeskStageZoom } from '../types';
import { msToSeconds } from '../utils/time';

/**
 * Селектор кадра стадии в разметке сцены Desk (`data-desk-frame` у `DeskStageFrame`) —
 * контракт между компонентом и анимациями.
 *
 * @param stage - Стадия, чей кадр нужен.
 */
export function deskFrameSelector(stage: DeskStageId): string {
  return `[data-desk-frame="${stage}"]`;
}

/**
 * Проявление первой стадии при появлении сцены: opacity 0 → 1 за `WIDE_FADE_IN_MS`.
 *
 * @param frame - Кадр первой стадии.
 * @param onComplete - Стадия проявилась полностью.
 * @returns Твин; при уходе со стадии его нужно остановить (`kill`).
 */
export function createStageFadeIn(frame: Element, onComplete: () => void): gsap.core.Tween {
  return gsap.fromTo(
    frame,
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: msToSeconds(WIDE_FADE_IN_MS), ease: EASINGS.fade, onComplete },
  );
}

/** Параметры {@link createStageRun}. */
export interface StageRunOptions {
  /** Пауза до отсчёта `startDelayMs` зума, мс (атмосферная пауза первой стадии, иначе 0). */
  holdMs: number;
  /** Зум стадии; без него стадия только держит паузу `holdMs`. */
  zoom: DeskStageZoom | undefined;
  /** prefers-reduced-motion: пауза той же длины без увеличения. */
  reducedMotion: boolean;
  /** Стадия отыграла — пора переходить к следующей. */
  onComplete: () => void;
}

/**
 * Жизнь стадии до перехода к следующей: пауза `holdMs`, затем через `startDelayMs` зум
 * «камера подъезжает ближе» — кадр увеличивается от 1 до `maxSafeScale` за `durationMs`
 * вокруг точки `originX/YPercent` (`transform-origin` в процентах кадра, то есть самой
 * картинки). Дальше `maxSafeScale` зум не идёт. Без зума — сразу после паузы.
 *
 * @param frame - Кадр стадии.
 * @param options - Пауза, зум, режим движения и колбэк завершения.
 * @returns Таймлайн стадии. Останавливайте его `kill`, а не `revert`: переход к следующей
 * стадии начинается с уже приближенного кадра.
 */
export function createStageRun(
  frame: Element,
  { holdMs, zoom, reducedMotion, onComplete }: StageRunOptions,
): gsap.core.Timeline {
  const timeline = gsap.timeline({ onComplete });
  if (!zoom) {
    // Пустой твин задаёт длительность паузы; при нулевой таймлайн завершится на ближайшем кадре.
    return timeline.to({}, { duration: msToSeconds(holdMs) });
  }

  const { originXPercent, originYPercent, maxSafeScale, durationMs, startDelayMs } = zoom;
  // Меньше 1 кадр перестал бы закрывать экран — по краям открылся бы фон.
  const scale = reducedMotion ? 1 : Math.max(1, maxSafeScale);
  return timeline
    .set(frame, { transformOrigin: `${String(originXPercent)}% ${String(originYPercent)}%` })
    .fromTo(
      frame,
      { scale: 1 },
      { scale, duration: msToSeconds(durationMs), ease: EASINGS.gardenZoom },
      msToSeconds(holdMs + startDelayMs),
    );
}

/**
 * Перетекание стадий: следующая картинка проявляется поверх текущей (opacity 0 → 1),
 * и одновременно текущая — уже приближенная своим зумом — гаснет (1 → 0), обе за
 * `CROSSFADE_DURATION_MS`. Кривые разные (см. `EASINGS.crossfadeIn/Out`): текущая гаснет
 * в основном под конец, когда следующая почти проявилась, поэтому фон сцены сквозь них
 * не просвечивает.
 *
 * @param outgoing - Кадр текущей стадии.
 * @param incoming - Кадр следующей стадии, до перехода скрытый.
 * @param onComplete - Перетекание завершилось: текущий кадр можно убирать.
 * @returns Таймлайн; при размонтировании его нужно остановить (`kill`).
 */
export function createCrossfade(
  outgoing: Element,
  incoming: Element,
  onComplete: () => void,
): gsap.core.Timeline {
  const duration = msToSeconds(CROSSFADE_DURATION_MS);
  return gsap
    .timeline({ onComplete })
    .fromTo(incoming, { autoAlpha: 0 }, { autoAlpha: 1, duration, ease: EASINGS.crossfadeIn }, 0)
    .to(outgoing, { autoAlpha: 0, duration, ease: EASINGS.crossfadeOut }, 0);
}
