import { gsap } from 'gsap';

import { CLOUD_CURTAIN_SELECTORS, createCloudCurtainTimeline } from '../animation/cloudCurtain';
import {
  CLOSE_AUDIO_FADE_MS,
  CLOUD_CLOSE_DURATION_MS,
  CLOUD_CLOSE_STAGGER_MS,
  CLOUD_REVEAL_DURATION_MS,
  CLOUD_REVEAL_STAGGER_MS,
  GREETING_FADE_OUT_MS,
  NEEDLE_DROP_DELAY_MS,
  SCENE_HOLD_MS,
  SHRINK_TO_CORNER_DELAY_MS,
  SHRINK_TO_CORNER_DURATION_MS,
  SONG_START_DELAY_MS,
  TONEARM_MOVE_DURATION_MS,
  WAIT_AFTER_REVEAL_MS,
} from '../constants/introTimings';
import { EASINGS } from '../constants/timings';
import { msToSeconds } from '../utils/time';

/**
 * Селекторы intro. Внутренности VinylPlayer (диск/тонарм) таймлайн больше не трогает —
 * ими управляет сам проигрыватель.
 */
export const INTRO_SELECTORS = {
  greeting: '[data-intro-greeting]',
  invite: '[data-intro-invite]',
  deck: '[data-intro-deck]',
  /** Холст иконки в углу — сюда «приземляется» проигрыватель. */
  dockTarget: '[data-corner-turntable] [data-turntable-canvas]',
} as const;

export interface IntroTimelineCallbacks {
  /** Облака разъехались: проигрыватель выходит из-за обложки вперёд. */
  onCurtainOpened: () => void;
  /** Пауза кончилась: запуск VinylPlayer (тонарм → диск). */
  onStartPlayer: () => void;
  /** Игла на пластинке — SFX иглы/треска. */
  onNeedleLanded: () => void;
  /** Игла прошла первые витки — вступает песня (первая дорожка фоновой очереди). */
  onSongStart: () => void;
  /** Начало закрытия: приглушение / парковка. */
  onCloseStart: () => void;
  /** Проигрыватель в углу. */
  onDocked: () => void;
  /** Сцена завершена. */
  onComplete: () => void;
}

interface DockTransform {
  x: number;
  y: number;
  scale: number;
}

function requireElement(root: Element, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (element === null) {
    throw new Error(`intro: не найден элемент ${selector}`);
  }
  return element;
}

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
 * Сценарий intro: облака, появление деки, уезд в угол.
 * Вращение пластинки и тонарм — только внутри VinylPlayer (не GSAP).
 */
export function createIntroTimeline(
  root: HTMLElement,
  callbacks: IntroTimelineCallbacks,
): gsap.core.Timeline {
  const curtain = requireElement(root, CLOUD_CURTAIN_SELECTORS.root);
  const greeting = requireElement(root, INTRO_SELECTORS.greeting);
  const invite = requireElement(root, INTRO_SELECTORS.invite);
  const deck = requireElement(root, INTRO_SELECTORS.deck);

  const fade = (durationMs: number): gsap.TweenVars => ({
    duration: msToSeconds(durationMs),
    ease: EASINGS.fade,
  });
  const pause = (durationMs: number): string => `+=${String(msToSeconds(durationMs))}`;

  const timeline = gsap.timeline({ onComplete: callbacks.onComplete });

  const curtainOpen = createCloudCurtainTimeline(curtain, 'open', {
    durationMs: CLOUD_REVEAL_DURATION_MS,
    staggerMs: CLOUD_REVEAL_STAGGER_MS,
  });

  timeline
    .add(curtainOpen, 0)
    .to(greeting, { autoAlpha: 0, ...fade(GREETING_FADE_OUT_MS) }, 0)
    .call(
      () => {
        gsap.killTweensOf(invite);
      },
      undefined,
      msToSeconds(GREETING_FADE_OUT_MS),
    )
    // Облака ушли за края — проигрыватель выходит вперёд: в финале облака закрываются
    // уже вокруг него, а он уезжает в угол поверх них.
    .call(callbacks.onCurtainOpened, undefined, curtainOpen.duration());

  // Проигрыватель уже стоит на сцене: облака разошлись — и он сразу на виду, ничего
  // не проявляется. Сцена дышит, потом пауза перед движением тонарма, и дальше
  // VinylPlayer сам ведёт тонарм → диск.
  timeline
    .addLabel('player', pause(WAIT_AFTER_REVEAL_MS + NEEDLE_DROP_DELAY_MS))
    .call(callbacks.onStartPlayer, undefined, 'player')
    // Игла/треск — когда тонарм уже должен дойти (длительность свинга).
    .call(
      callbacks.onNeedleLanded,
      undefined,
      `player+=${String(msToSeconds(TONEARM_MOVE_DURATION_MS))}`,
    );

  const holdStart = `player+=${String(msToSeconds(TONEARM_MOVE_DURATION_MS + SONG_START_DELAY_MS))}`;

  // Песня вступает после первых витков — и дальше играет уже сама по себе.
  timeline.call(callbacks.onSongStart, undefined, holdStart);

  timeline
    .addLabel('close', `${holdStart}+=${String(msToSeconds(SCENE_HOLD_MS))}`)
    .call(callbacks.onCloseStart, undefined, 'close')
    .add(
      createCloudCurtainTimeline(curtain, 'closed', {
        durationMs: CLOUD_CLOSE_DURATION_MS,
        staggerMs: CLOUD_CLOSE_STAGGER_MS,
      }),
      'close',
    )
    .to({}, { duration: msToSeconds(CLOSE_AUDIO_FADE_MS) }, 'close');

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
    `close+=${String(msToSeconds(SHRINK_TO_CORNER_DELAY_MS))}`,
  );

  return timeline;
}
