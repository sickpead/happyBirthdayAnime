import type { DeskVideoPhase } from '../components/DeskTransitionVideo';
import type { DeskTransitionType, DeskZoomStage, SceneTransitionPhase } from '../types';

/** Переходы, которые закрывают экран и подменяют картинку под собой. */
export type DeskOverlayTransitionType = Exclude<
  DeskTransitionType,
  'crossfade' | 'video-transition'
>;

/**
 * Этап перехода через оверлей (затемнение или облака): `covering` — оверлей закрывает экран;
 * `covered` — закрыто, стадия уже подменена, ждём готовности её картинок и паузу;
 * `revealing` — оверлей открывает новую стадию.
 */
export type DeskOverlayPhase = 'covering' | 'covered' | 'revealing';

/**
 * Переход к следующей стадии: `none` — перехода нет, стадия живёт (пауза, зум);
 * `crossfade` — картинки перетекают друг в друга, без фаз;
 * `video` — поверх текущей стадии играет ролик, на его последнем кадре стадия подменяется;
 * `overlay` — затемнение или облака: закрыть → подменить → открыть; если перед ними шёл
 * ролик, он стоит на последнем кадре, пока экран закрывается.
 */
export type DeskTransitionState =
  | { kind: 'none' }
  | { kind: 'crossfade' }
  | { kind: 'video'; src: string; phase: Exclude<DeskVideoPhase, 'last-frame'> }
  | {
      kind: 'overlay';
      type: DeskOverlayTransitionType;
      phase: DeskOverlayPhase;
      /** Ролик, доигравший до последнего кадра, пока оверлей закрывает экран. */
      video: string | null;
    };

/** Состояние сцены Desk: какая стадия на экране и идёт ли переход к следующей. */
export interface DeskSequenceState {
  /** Индекс стадии на экране в массиве стадий; во время перетекания — уходящей. */
  stageIndex: number;
  /** Переход к стадии `stageIndex + 1`. */
  transition: DeskTransitionState;
}

/**
 * События сцены: `advance` — стадия отыграла, пора к следующей; `crossfaded` — перетекание
 * закончилось; `videoEnded` — ролик доиграл до последнего кадра; `videoFinished` — ролик
 * догорел поверх новой стадии; `videoUnavailable` — ролик не запустился, нужен запасной
 * переход; `covered` — оверлей закрыл экран; `reveal` — картинки новой стадии готовы, пора
 * открывать; `revealed` — оверлей открылся.
 */
export type DeskSequenceEvent =
  | 'advance'
  | 'crossfaded'
  | 'videoEnded'
  | 'videoFinished'
  | 'videoUnavailable'
  | 'covered'
  | 'reveal'
  | 'revealed';

/** Сцена начинается с первой стадии, перехода нет. */
export const INITIAL_DESK_SEQUENCE: DeskSequenceState = {
  stageIndex: 0,
  transition: { kind: 'none' },
};

const NO_TRANSITION: DeskTransitionState = { kind: 'none' };
const CROSSFADE: DeskTransitionState = { kind: 'crossfade' };

/**
 * Начало перехода в стадию: если у неё есть ролик, сперва идёт он, а как показать картинку
 * после него — решает `transitionIn`. Без ролика (его нет в конфиге или он не запустился)
 * `video-transition` сводится к перетеканию.
 *
 * @param next - Стадия, в которую идёт переход.
 * @param isVideoAllowed - Можно ли начинать с ролика (`false` — ролик уже не запустился).
 */
function transitionInto(next: DeskZoomStage, isVideoAllowed: boolean): DeskTransitionState {
  if (isVideoAllowed && next.transitionVideoSrc !== undefined) {
    return { kind: 'video', src: next.transitionVideoSrc, phase: 'playing' };
  }
  switch (next.transitionIn) {
    case 'video-transition':
    case 'crossfade':
      return CROSSFADE;
    case 'clouds':
    case 'dark-fade':
      return { kind: 'overlay', type: next.transitionIn, phase: 'covering', video: null };
  }
}

/**
 * Что происходит, когда ролик доиграл: если он заканчивается кадром новой стадии
 * (`video-transition`), стадия подменяется прямо под ним, а он гаснет; если стадию
 * показывает затемнение или облака, они закрывают экран поверх последнего кадра ролика.
 *
 * @param state - Состояние с играющим роликом.
 * @param next - Стадия, в которую идёт переход.
 * @param src - Ролик.
 */
function afterVideo(state: DeskSequenceState, next: DeskZoomStage, src: string): DeskSequenceState {
  switch (next.transitionIn) {
    case 'clouds':
    case 'dark-fade':
      return {
        stageIndex: state.stageIndex,
        transition: { kind: 'overlay', type: next.transitionIn, phase: 'covering', video: src },
      };
    case 'video-transition':
    case 'crossfade':
      return {
        stageIndex: state.stageIndex + 1,
        transition: { kind: 'video', src, phase: 'finishing' },
      };
  }
}

/**
 * Создаёт чистый редьюсер сцены Desk для набора стадий. Стадии идут по порядку; переход
 * к следующей выбирается её `transitionIn`. При перетекании стадия сменяется, когда оно
 * закончилось, при ролике — на его последнем кадре, при оверлее — ровно в момент, когда
 * оверлей закрыл экран. Если ролика нет или он не запустился, стадия показывается своим
 * `transitionIn` без него (см. `transitionInto`). Событие, неуместное в текущем состоянии
 * (например, повторный `advance` во время перехода или `advance` на последней стадии),
 * состояние не меняет.
 *
 * @param stages - Стадии по порядку (см. `DESK_ZOOM_STAGES`).
 * @returns Редьюсер для `useReducer`.
 */
export function createDeskSequenceReducer(
  stages: readonly DeskZoomStage[],
): (state: DeskSequenceState, event: DeskSequenceEvent) => DeskSequenceState {
  return (state, event) => {
    const { stageIndex, transition } = state;
    switch (event) {
      case 'advance': {
        const next = stages[stageIndex + 1];
        return transition.kind === 'none' && next
          ? { stageIndex, transition: transitionInto(next, true) }
          : state;
      }
      case 'crossfaded':
        return transition.kind === 'crossfade'
          ? { stageIndex: stageIndex + 1, transition: NO_TRANSITION }
          : state;
      case 'videoEnded': {
        const next = stages[stageIndex + 1];
        return transition.kind === 'video' && transition.phase === 'playing' && next
          ? afterVideo(state, next, transition.src)
          : state;
      }
      case 'videoFinished':
        return transition.kind === 'video' && transition.phase === 'finishing'
          ? { stageIndex, transition: NO_TRANSITION }
          : state;
      case 'videoUnavailable': {
        const next = stages[stageIndex + 1];
        // Ролик не запустился — стадия показывается своим переходом без него.
        return transition.kind === 'video' && transition.phase === 'playing' && next
          ? { stageIndex, transition: transitionInto(next, false) }
          : state;
      }
      case 'covered':
        // Экран закрыт: стадия подменяется, а доигравший ролик больше не нужен.
        return transition.kind === 'overlay' && transition.phase === 'covering'
          ? {
              stageIndex: stageIndex + 1,
              transition: { ...transition, phase: 'covered', video: null },
            }
          : state;
      case 'reveal':
        return transition.kind === 'overlay' && transition.phase === 'covered'
          ? { stageIndex, transition: { ...transition, phase: 'revealing' } }
          : state;
      case 'revealed':
        return transition.kind === 'overlay' && transition.phase === 'revealing'
          ? { stageIndex, transition: NO_TRANSITION }
          : state;
    }
  };
}

/**
 * Фаза для слоя оверлея данного типа (`DarkFadeLayer`, `CloudTransitionLayer`): пока
 * стадия подменяется, оверлей стоит закрытым; вне своего перехода слой в покое.
 *
 * @param transition - Текущий переход сцены.
 * @param type - Тип оверлея, для слоя которого нужна фаза.
 */
export function toOverlayPhase(
  transition: DeskTransitionState,
  type: DeskOverlayTransitionType,
): SceneTransitionPhase {
  if (transition.kind !== 'overlay' || transition.type !== type) {
    return 'idle';
  }
  return transition.phase === 'revealing' ? 'revealing' : 'covering';
}
