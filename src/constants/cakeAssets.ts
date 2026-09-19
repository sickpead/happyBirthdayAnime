import type { CakeImageId, CanvasRect, CanvasSprite } from '../types';
import { assetUrl } from '../utils/assetUrl';
import { ASSET_DIRECTORIES } from './assets';

const CAKE_DIRECTORY = `${ASSET_DIRECTORIES.images}/cake`;

/**
 * Изображения торта: `cake` — единая картинка торта с поздравлением и свечами (огня на ней
 * нет, только фитили), `flame` — один огонь на все свечи, `smoke` — одна струйка дыма.
 * Горит свеча или потушена — решает код: огни и дым лежат отдельными слоями поверх торта.
 */
export const CAKE_IMAGES: Readonly<Record<CakeImageId, string>> = {
  cake: assetUrl(`${CAKE_DIRECTORY}/cake-v2.png`),
  flame: assetUrl(`${CAKE_DIRECTORY}/flame.png`),
  smoke: assetUrl(`${CAKE_DIRECTORY}/smoke.png`),
};

/*
 * Геометрия задаётся в px исходных картинок и переводится в проценты от контейнера торта
 * (см. BirthdayCake.tsx) — поэтому огни и дым масштабируются вместе с тортом и не зависят
 * от viewport. Все значения измерены по самим PNG.
 */

/** Холст картинки торта `cake-v2.png`, px. */
export const CAKE_CANVAS = {
  width: 1380,
  height: 752,
} as const;

/** Холст спрайтов огня и дыма (`flame.png`, `smoke.png`), px. */
export const CAKE_SPRITE_CANVAS = {
  width: 704,
  height: 1500,
} as const;

/**
 * Видимая область торта на холсте `cake-v2.png`: сам торт (473…1021 × 23…603) и место над
 * свечами под огни — оно выходит выше холста, поэтому `y` отрицательный. Остальное —
 * прозрачные поля; дым поднимается ещё выше, контейнер его не обрезает.
 */
export const CAKE_VIEWBOX: CanvasRect = {
  x: 463,
  y: -24,
  width: 568,
  height: 637,
};

/** Огонь на `flame.png`: содержимое и середина закруглённого низа пламени, px. */
export const FLAME_SPRITE: CanvasSprite = {
  box: { x: 236, y: 446, width: 232, height: 506 },
  base: { x: 347.9, y: 950 },
};

/** Дым на `smoke.png`: содержимое и нижний кончик струйки, px. */
export const SMOKE_SPRITE: CanvasSprite = {
  box: { x: 237, y: 394, width: 237, height: 649 },
  base: { x: 360.5, y: 1039 },
};

/** Высота огня на холсте торта, px — примерно две ширины свечи (свеча ≈ 19 px). */
export const FLAME_HEIGHT = 38;

/** Насколько основание огня ниже кончика фитиля, px: верх фитиля «входит» в пламя. */
export const FLAME_SINK = 4;

/** Высота струйки дыма на холсте торта, px. */
export const SMOKE_HEIGHT = 66;
