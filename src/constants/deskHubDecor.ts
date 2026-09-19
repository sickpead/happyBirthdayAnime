import type { DeskHubDecorProp } from '../types';
import { assetUrl } from '../utils/assetUrl';
import { DESK_ASSET_DIRECTORY } from './deskZoomStages';

/** Каталог декоративных картинок стадии HUB внутри `public/`. */
export const DESK_DECOR_DIRECTORY = `${DESK_ASSET_DIRECTORY}/decor`;

/**
 * Декор стола: ваза с розами и стопка пластинок на траве, ручка и карандаши на столешнице.
 * Только для атмосферы — без клика, наведения и модалок. Листы-черновики с собственными
 * модалками живут отдельно, в `deskDraftSheets.ts`.
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
export const DESK_HUB_DECOR: readonly DeskHubDecorProp[] = [
  // За дальним краем стола, по центру кадра.
  {
    id: 'rose-vase',
    imageSrc: assetUrl(`${DESK_DECOR_DIRECTORY}/rose-vase.png`),
    xPercent: 55.7,
    yPercent: 15.6,
    widthPercent: 34.2,
    layer: 'below',
  },
  // На траве справа, у ножки стола.
  {
    id: 'vinyl-stack',
    imageSrc: assetUrl(`${DESK_DECOR_DIRECTORY}/vinyl-stack.png`),
    xPercent: 88.2,
    yPercent: 65.4,
    widthPercent: 21.8,
    layer: 'below',
  },
  // На столешнице слева от книги — поверх неё, а не под ней.
  {
    id: 'fountain-pen',
    imageSrc: assetUrl(`${DESK_DECOR_DIRECTORY}/fountain-pen.png`),
    xPercent: 35.7,
    yPercent: 37.8,
    widthPercent: 11.5,
    rotateDeg: -12,
    layer: 'above',
  },
  // На столешнице справа от книги.
  {
    id: 'colored-pencils',
    imageSrc: assetUrl(`${DESK_DECOR_DIRECTORY}/colored-pencils.png`),
    xPercent: 62,
    yPercent: 36.8,
    widthPercent: 12.6,
    rotateDeg: 8,
    layer: 'above',
  },
];

/** URL декоративных картинок — для предзагрузки. */
export const DESK_HUB_DECOR_SOURCES: Readonly<Record<string, string>> = Object.fromEntries(
  DESK_HUB_DECOR.map((prop): readonly [string, string] => [prop.id, prop.imageSrc]),
);
