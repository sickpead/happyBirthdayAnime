import type { DeskStageId, DeskZoomStage } from '../types';
import { assetUrl } from '../utils/assetUrl';
import { ASSET_DIRECTORIES } from './assets';

/** Каталог картинок сцены Desk внутри `public/`. */
export const DESK_ASSET_DIRECTORY = `${ASSET_DIRECTORIES.images}/desk`;

/** Каталог роликов-переходов сцены Desk внутри `public/`. */
export const DESK_VIDEO_DIRECTORY = `${ASSET_DIRECTORIES.videos}/desk`;

/** Пропорции плейсхолдера стадии, пока картинки нет, — как у готовых картинок сада (1408×768). */
export const DESK_STAGE_FALLBACK_ASPECT_RATIO = 1408 / 768;

/**
 * Стадии сцены Desk по порядку: камера подъезжает от общего плана к столу.
 *
 * Сцена идёт по массиву: картинка стадии появляется → если задан `zoom`, через
 * `startDelayMs` картинка увеличивается до `maxSafeScale` вокруг точки `originX/YPercent`
 * (в процентах самой картинки) → переход к следующей стадии способом `transitionIn`
 * следующей стадии. На последней стадии зума и перехода нет.
 *
 * Сейчас стадий две: общий план → стол с предметами. Наезд от общего плана к столу делает
 * ролик (`transitionVideoSrc`). Если ролика нет на диске или он не запустился, стадия
 * показывается своим `transitionIn` без него, а `video-transition` сводится к
 * перетеканию, поэтому сцена работает и без роликов.
 *
 * Промежуточные планы `garden-medium.jpg` и `garden-close.jpg` (стадии `medium` и `close`)
 * в цепочке сейчас не участвуют — их заменил ролик. Чтобы вернуть их, добавьте сюда записи
 * с их картинкой, `transitionIn` и зумом; файлы лежат на месте.
 *
 * Точки зума стоят на столе на каждой картинке, масштабы и длительности — дефолты;
 * подбираются на глаз в браузере, код компонентов менять не нужно.
 */
export const DESK_ZOOM_STAGES: readonly DeskZoomStage[] = [
  {
    id: 'wide',
    imageSrc: assetUrl(`${DESK_ASSET_DIRECTORY}/garden-wide.jpg`),
    transitionIn: 'video-transition', // для первой стадии не используется
    // Без зума: ролик начинается ровно этим кадром, и любой зум отпрыгнул бы назад на его старте.
  },
  {
    id: 'hub',
    // Пустой стол: предметы и декор кладутся поверх него отдельными PNG
    // (`deskHubObjects.ts` и `deskHubDecor.ts`). Раскладку задаёт `desk-hub.jpg` —
    // тот же стол с нарисованными предметами, он служит образцом.
    imageSrc: assetUrl(`${DESK_ASSET_DIRECTORY}/desk-hub-empty.jpg`),
    // Сперва ролик — наезд от общего плана к столу, затем затемнение, и под ним стол.
    transitionIn: 'dark-fade',
    transitionVideoSrc: assetUrl(`${DESK_VIDEO_DIRECTORY}/garden-to-desk.mp4`),
    // без zoom — финальная интерактивная стадия
  },
];

/** URL картинок стадий по их id — для предзагрузки. */
export const DESK_STAGE_SOURCES = Object.fromEntries(
  DESK_ZOOM_STAGES.map((stage) => [stage.id, stage.imageSrc]),
) as Readonly<Record<DeskStageId, string>>;
