import type { DeskHubDecorProp } from '../types';
import { DESK_ASSET_DIRECTORY } from './deskZoomStages';

/** Каталог декоративных картинок стадии HUB внутри `public/`. */
export const DESK_DECOR_DIRECTORY = `${DESK_ASSET_DIRECTORY}/decor`;

/**
 * Чисто декоративные предметы стола: картинка и ничего больше — без клика, наведения
 * и модалок.
 *
 * Сейчас массив пуст: ваза с розами, стопка пластинок, ручка и карандаши стали
 * кликабельными и переехали в `deskHubObjects.ts`, а листы-черновики со своими модалками
 * живут в `deskDraftSheets.ts`. Механика декора осталась — добавьте сюда запись, и картинка
 * снова появится на столе.
 *
 * `xPercent` / `yPercent` — центр предмета в процентах картинки стола (у кликабельных
 * предметов в `deskHubObjects.ts` это левый верхний угол), `widthPercent` — ширина в процентах
 * её ширины, `rotateDeg` — наклон. Ширина учитывает, что содержимое занимает лишь часть холста
 * картинки (у вазы, например, около трети).
 *
 * `layer` — где предмет лежит относительно кликабельных: `below` рисуется до них, `above` —
 * после. Ручка и карандаши лежат на столешнице, поэтому они `above`: иначе книга накрывала бы
 * их собой. Кликов не перехватывает ни тот, ни другой слой.
 *
 * Раскладка подгоняется на глаз, код менять не нужно: откройте стадию с `?layout=1`
 * (см. README) и перетащите предметы мышью.
 */
export const DESK_HUB_DECOR: readonly DeskHubDecorProp[] = [];

/** URL декоративных картинок — для предзагрузки. */
export const DESK_HUB_DECOR_SOURCES: Readonly<Record<string, string>> = Object.fromEntries(
  DESK_HUB_DECOR.map((prop): readonly [string, string] => [prop.id, prop.imageSrc]),
);
