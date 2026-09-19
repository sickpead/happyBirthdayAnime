import type { DeskHubObjectId, DeskHubObjectLayer } from '../types';
import { assetUrl } from '../utils/assetUrl';
import { CAKE_IMAGES } from './cakeAssets';
import { DESK_ASSET_DIRECTORY } from './deskZoomStages';

/**
 * Предметы на столе стадии HUB: каждый — своя PNG поверх пустого стола
 * (`desk-hub-empty.jpg`). Порядок в массиве — порядок обхода клавишей Tab и наложения.
 *
 * Координаты — проценты от картинки стола: `xPercent` / `yPercent` — левый верхний угол
 * слоя, `widthPercent` — его ширина, высота берётся из пропорций самой PNG. Картинка стола
 * заполняет экран как `object-fit: cover`, слои масштабируются вместе с ней.
 *
 * Раскладка подгоняется на глаз, код менять не нужно: откройте стадию с `?layout=1`
 * (см. README), перетащите предметы мышью и вставьте сюда числа из «Copy config».
 * В комментариях у предметов указан центр слоя — то, чем оперирует редактор раскладки;
 * в самих полях — левый верхний угол.
 *
 * `heightPercent`, `hoverReveal` и `paintedInBackdrop` нужны только варианту, когда предмет
 * нарисован прямо на фоне: тогда кнопка — невидимый хитбокс, а при наведении показывается
 * оверлей. Сейчас этот режим не используется.
 */
export const DESK_HUB_OBJECTS: readonly DeskHubObjectLayer[] = [
  {
    id: 'cake',
    label: 'Торт',
    imageSrc: assetUrl(`${DESK_ASSET_DIRECTORY}/cake-on-desk.png`),
    // Дальний край столешницы левее книги (центр слоя — 33.4 / 17.8).
    xPercent: 26.2,
    yPercent: -1.9,
    widthPercent: 14.4,
    restRotationDeg: 1,
    modalId: 'cakeVideo',
    hoverStyle: 'light-candles',
    // Кончики фитилей, % слоя торта (сняты с `cake-on-desk.png`); подгоняются на глаз.
    candles: [
      { id: 'c1', xPercent: 38.2, yPercent: 22.9, flickerDelayMs: 0, scale: 0.2 },
      { id: 'c2', xPercent: 45.8, yPercent: 18.4, flickerDelayMs: 180, scale: 0.21 },
      { id: 'c3', xPercent: 51.2, yPercent: 25.2, flickerDelayMs: 340, scale: 0.2 },
      { id: 'c4', xPercent: 59.7, yPercent: 20.8, flickerDelayMs: 90, scale: 0.21 },
      { id: 'c5', xPercent: 66, yPercent: 23.9, flickerDelayMs: 260, scale: 0.19 },
    ],
  },
  {
    id: 'letter',
    label: 'Письмо',
    imageSrc: assetUrl(`${DESK_ASSET_DIRECTORY}/letter-closed.png`),
    imageSrcOpen: assetUrl(`${DESK_ASSET_DIRECTORY}/letter-open.png`),
    // Целиком на сиденье стула, не задевая спинку (центр слоя — 50.5 / 64.9).
    xPercent: 44.3,
    yPercent: 58.7,
    widthPercent: 12.4,
    restRotationDeg: -8,
    // Открытый конверт чуть больше закрытого; клапан уходит вверх, поэтому оверлей
    // поднят так, чтобы низ конверта остался на месте.
    hoverReveal: {
      widthPercent: 265,
      heightPercent: 295,
      offsetYPercent: -35,
    },
    modalId: 'letter',
    hoverStyle: 'crossfade-open',
  },
  {
    id: 'book',
    label: 'Книга',
    imageSrc: assetUrl(`${DESK_ASSET_DIRECTORY}/book.png`),
    imageSrcOpen: assetUrl(`${DESK_ASSET_DIRECTORY}/book-open.png`),
    // Главный предмет — по центру стола, крупнее остальных (центр слоя — 48.5 / 36.6).
    xPercent: 38.2,
    yPercent: 26.3,
    widthPercent: 20.6,
    hoverReveal: {
      widthPercent: 260,
      heightPercent: 210,
      offsetYPercent: -8,
    },
    modalId: 'book',
    hoverStyle: 'crossfade-open',
  },
  {
    id: 'turntable',
    label: 'Проигрыватель',
    imageSrc: assetUrl(`${DESK_ASSET_DIRECTORY}/turntable-desk-body.png`),
    // Правый дальний угол столешницы (центр слоя — 69.3 / 23.4).
    xPercent: 59.2,
    yPercent: 13.3,
    widthPercent: 20.2,
    modalId: 'playlist',
    hoverStyle: 'tonearm-swing',
    layers: {
      vinylSrc: assetUrl(`${DESK_ASSET_DIRECTORY}/turntable-desk-vinyl.png`),
      tonearmSrc: assetUrl(`${DESK_ASSET_DIRECTORY}/turntable-desk-tonearm.png`),
      vinyl: { scale: 0.52, offsetXPercent: -6.33, offsetYPercent: -5.16 },
      tonearm: {
        scale: 0.48,
        offsetXPercent: -0.99,
        offsetYPercent: -13.15,
        pivotXPercent: 73.86,
        pivotYPercent: 43.36,
        restRotationDeg: -32,
        hoverRotationDeg: -8,
      },
    },
  },
];

/** URL картинок предметов по их id — для предзагрузки. У составных — базовый слой. */
export const DESK_HUB_OBJECT_SOURCES = Object.fromEntries(
  DESK_HUB_OBJECTS.map((object) => [object.id, object.imageSrc]),
) as Readonly<Record<DeskHubObjectId, string>>;

/**
 * Дополнительная картинка предмета помимо `imageSrc`: слои составного предмета (`vinyl`,
 * `tonearm`) или открытое состояние у `crossfade-open` (`open`).
 */
export type DeskHubLayerName = 'vinyl' | 'tonearm' | 'open' | 'flame';

/**
 * Ключ дополнительной картинки предмета в {@link DESK_HUB_LAYER_SOURCES}, например
 * `turntable:vinyl` или `letter:open`.
 *
 * @param objectId - Предмет.
 * @param layer - Его дополнительная картинка.
 */
export function deskHubLayerKey(objectId: DeskHubObjectId, layer: DeskHubLayerName): string {
  return `${objectId}:${layer}`;
}

/** URL дополнительных картинок предметов (слои, открытое состояние) — для предзагрузки. */
export const DESK_HUB_LAYER_SOURCES: Readonly<Record<string, string>> = Object.fromEntries(
  DESK_HUB_OBJECTS.flatMap((object): (readonly [string, string])[] => [
    ...(object.layers
      ? ([
          [deskHubLayerKey(object.id, 'vinyl'), object.layers.vinylSrc],
          [deskHubLayerKey(object.id, 'tonearm'), object.layers.tonearmSrc],
        ] as const)
      : []),
    ...(object.imageSrcOpen === undefined
      ? []
      : ([[deskHubLayerKey(object.id, 'open'), object.imageSrcOpen]] as const)),
    ...(object.hoverStyle === 'light-candles'
      ? ([[deskHubLayerKey(object.id, 'flame'), CAKE_IMAGES.flame]] as const)
      : []),
  ]),
);
