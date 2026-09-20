import { gsap } from 'gsap';

import { CLOUD_CURTAIN_SELECTORS, createCloudCurtainTimeline } from '../animation/cloudCurtain';
import {
  CLOSE_AUDIO_FADE_MS,
  CLOUD_CLOSE_DURATION_MS,
  CLOUD_CLOSE_STAGGER_MS,
  CLOUD_REVEAL_DURATION_MS,
  CLOUD_REVEAL_STAGGER_MS,
  DECK_APPEAR_FROM_BRIGHTNESS,
  DECK_FADE_IN_MS,
  GREETING_FADE_OUT_MS,
  NEEDLE_DROP_DELAY_MS,
  SCENE_HOLD_MS,
  SHRINK_TO_CORNER_DELAY_MS,
  SHRINK_TO_CORNER_DURATION_MS,
  SONG_START_DELAY_MS,
  TONEARM_MOVE_DURATION_MS,
  VINYL_SPIN_MS_PER_ROTATION,
  VINYL_SPIN_UP_MS,
  WAIT_AFTER_REVEAL_MS,
} from '../constants/introTimings';
import { EASINGS } from '../constants/timings';
import { TONEARM_REST_ANGLE_DEG } from '../constants/turntableAssets';
import { prefersReducedMotion } from '../utils/motion';
import { afterLabel, msToSeconds } from '../utils/time';

/**
 * Селекторы элементов intro — контракт с разметкой `IntroScene`, `IntroCloudCover`,
 * `TurntableArt` и `CornerTurntable`.
 */
export const INTRO_SELECTORS = {
  greeting: '[data-intro-greeting]',
  invite: '[data-intro-invite]',
  deck: '[data-intro-deck]',
  vinyl: '[data-turntable-vinyl]',
  tonearm: '[data-turntable-tonearm]',
  /** Холст иконки в углу — сюда «приземляется» проигрыватель. */
  dockTarget: '[data-corner-turntable] [data-turntable-canvas]',
} as const;

/**
 * Побочные эффекты сценария. Звук и состояние React живут в сцене,
 * таймлайн только вызывает их в нужные моменты.
 */
export interface IntroTimelineCallbacks {
  /** f. Игла коснулась пластинки — в этот момент начинается вращение: звук иглы и треск. */
  onNeedleLanded: () => void;
  /** g. Старт песни. */
  onSongStart: () => void;
  /** i. Начало закрытия: приглушение обеих дорожек. */
  onCloseStart: () => void;
  /** j. Проигрыватель приземлился в правый верхний угол. */
  onDocked: () => void;
  /** k. Облака закрыли экран и проигрыватель в углу — пора к следующей сцене. */
  onComplete: () => void;
}

interface DockTransform {
  x: number;
  y: number;
  scale: number;
}

/** Находит обязательный элемент сцены; отсутствие — ошибка разметки, а не рантайма. */
function requireElement(root: Element, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (element === null) {
    throw new Error(`intro: не найден элемент ${selector}`);
  }
  return element;
}

/**
 * Сдвиг и масштаб, переводящие проигрыватель сцены точно на место иконки `CornerTurntable`.
 * Оба холста одних пропорций, поэтому хватает равномерного масштаба и сдвига центра.
 * Считается в момент старта анимации — по текущим размерам окна.
 */
function measureDockTransform(deck: HTMLElement): DockTransform {
  const target = document.querySelector(INTRO_SELECTORS.dockTarget);
  if (target === null) {
    return { x: 0, y: 0, scale: 1 };
  }
  const from = deck.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  return {
    x: to.left + to.width / 2 - (from.left + from.width / 2),
    y: to.top + to.height / 2 - (from.top + from.height / 2),
    scale: to.width / from.width,
  };
}

/**
 * Собирает сценарий intro одним таймлайном GSAP (пункты a–k сценария).
 *
 * Вращение пластинки — отдельный бесконечный твин (в таймлайн его не вложить: таймлайн
 * никогда бы не закончился). Он создаётся здесь же, поэтому попадает в тот же
 * `gsap.context` сцены и откатывается вместе с таймлайном.
 *
 * @param root - Корневой элемент сцены; все элементы ищутся внутри него.
 * @param callbacks - Побочные эффекты в ключевые моменты сценария.
 * @returns Запущенный таймлайн. Его нужно убить при размонтировании сцены (через `gsap.context`).
 */
export function createIntroTimeline(
  root: HTMLElement,
  callbacks: IntroTimelineCallbacks,
): gsap.core.Timeline {
  const curtain = requireElement(root, CLOUD_CURTAIN_SELECTORS.root);
  const greeting = requireElement(root, INTRO_SELECTORS.greeting);
  const invite = requireElement(root, INTRO_SELECTORS.invite);
  const deck = requireElement(root, INTRO_SELECTORS.deck);
  const vinyl = requireElement(root, INTRO_SELECTORS.vinyl);
  const tonearm = requireElement(root, INTRO_SELECTORS.tonearm);

  const fade = (durationMs: number): gsap.TweenVars => ({
    duration: msToSeconds(durationMs),
    ease: EASINGS.fade,
  });
  const pause = (durationMs: number): string => `+=${String(msToSeconds(durationMs))}`;

  const timeline = gsap.timeline({ onComplete: callbacks.onComplete });

  // Исходное состояние проигрывателя: тонарм поднят (запаркован), пластинка неподвижна.
  timeline.set(tonearm, { rotation: TONEARM_REST_ANGLE_DEG, transformOrigin: '0% 0%' }, 0);

  // a. Облака разъезжаются в стороны, поздравление тает и больше не возвращается.
  timeline
    .add(
      createCloudCurtainTimeline(curtain, 'open', {
        durationMs: CLOUD_REVEAL_DURATION_MS,
        staggerMs: CLOUD_REVEAL_STAGGER_MS,
      }),
      0,
    )
    .to(greeting, { autoAlpha: 0, ...fade(GREETING_FADE_OUT_MS) }, 0)
    // Пульсация приглашения больше не нужна — останавливаем её, когда надпись растаяла.
    .call(
      () => {
        gsap.killTweensOf(invite);
      },
      undefined,
      msToSeconds(GREETING_FADE_OUT_MS),
    );

  // b–c. Пауза с кремовым фоном и дымкой, затем проигрыватель появляется из темноты.
  timeline
    .addLabel('deck', pause(WAIT_AFTER_REVEAL_MS))
    .fromTo(
      deck,
      { autoAlpha: 0, filter: `brightness(${String(DECK_APPEAR_FROM_BRIGHTNESS)})` },
      { autoAlpha: 1, filter: 'brightness(1)', ...fade(DECK_FADE_IN_MS), clearProps: 'filter' },
      'deck',
    );

  // d–e. Пауза, затем тонарм плавно поворачивается вокруг шарнира: игла идёт к краю пластинки.
  timeline
    .addLabel('tonearm', pause(NEEDLE_DROP_DELAY_MS))
    .to(
      tonearm,
      { rotation: 0, duration: msToSeconds(TONEARM_MOVE_DURATION_MS), ease: EASINGS.tonearm },
      'tonearm',
    );

  // f. Игла коснулась пластинки: в этот же момент пластинка начинает вращаться и стартует звук.
  //    Тонарм дальше неподвижен — он не связан с пластинкой.
  timeline.addLabel('needleLanded').call(callbacks.onNeedleLanded, undefined, 'needleLanded');
  let stopVinylSpin: (() => void) | undefined;
  if (!prefersReducedMotion()) {
    const spin = gsap.to(vinyl, {
      rotation: 360,
      duration: msToSeconds(VINYL_SPIN_MS_PER_ROTATION),
      ease: EASINGS.linear,
      repeat: -1,
      paused: true,
    });
    stopVinylSpin = (): void => {
      spin.pause();
    };
    // Разгон: скорость вращения плавно растёт от 0 до 33⅓ об/мин.
    timeline
      .call(
        () => {
          spin.play();
        },
        undefined,
        'needleLanded',
      )
      .fromTo(
        spin,
        { timeScale: 0 },
        { timeScale: 1, duration: msToSeconds(VINYL_SPIN_UP_MS), ease: EASINGS.spinUp },
        'needleLanded',
      );
  }

  // g. Песня.
  timeline.call(callbacks.onSongStart, undefined, afterLabel('needleLanded', SONG_START_DELAY_MS));

  // h–i. Сцена держится, затем одновременно: звук уходит в фон, облака закрывают экран.
  //      Пластинка останавливается вместе с уходом песни — крутится только пока идёт трек.
  //      Фейд звука идёт в Howler; пустой твин его длины не даёт таймлайну закончиться раньше.
  timeline
    .addLabel('close', afterLabel('needleLanded', SONG_START_DELAY_MS + SCENE_HOLD_MS))
    .call(
      () => {
        stopVinylSpin?.();
        callbacks.onCloseStart();
      },
      undefined,
      'close',
    )
    .add(
      createCloudCurtainTimeline(curtain, 'closed', {
        durationMs: CLOUD_CLOSE_DURATION_MS,
        staggerMs: CLOUD_CLOSE_STAGGER_MS,
      }),
      'close',
    )
    .to({}, { duration: msToSeconds(CLOSE_AUDIO_FADE_MS) }, 'close');

  // j. Проигрыватель уезжает и уменьшается в угол — точно на место иконки CornerTurntable.
  timeline.to(
    deck,
    {
      x: () => measureDockTransform(deck).x,
      y: () => measureDockTransform(deck).y,
      scale: () => measureDockTransform(deck).scale,
      duration: msToSeconds(SHRINK_TO_CORNER_DURATION_MS),
      ease: EASINGS.dock,
      onComplete: callbacks.onDocked,
    },
    afterLabel('close', SHRINK_TO_CORNER_DELAY_MS),
  );

  // k. onComplete таймлайна — когда завершились и i, и j.
  return timeline;
}
