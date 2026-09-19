import type { TurntableImageId } from '../types';
import { assetUrl } from '../utils/assetUrl';
import { ASSET_DIRECTORIES } from './assets';

const TURNTABLE_DIRECTORY = `${ASSET_DIRECTORIES.images}/turntable`;

/**
 * Слои проигрывателя:
 * - `player-body` — корпус без пластинки и без тонарма (основание шарнира нарисовано на нём);
 * - `vinyl` — отдельная пластинка, вращается вокруг собственного центра;
 * - `tonearm` — отдельный тонарм вместе с поворотным диском-основанием, лежит поверх пластинки.
 */
export const TURNTABLE_IMAGES: Readonly<Record<TurntableImageId, string>> = {
  'player-body': assetUrl(`${TURNTABLE_DIRECTORY}/player-body.png`),
  vinyl: assetUrl(`${TURNTABLE_DIRECTORY}/vinyl.png`),
  tonearm: assetUrl(`${TURNTABLE_DIRECTORY}/tonearm.png`),
};

/*
 * Геометрия задаётся в координатах общего холста TURNTABLE_CANVAS (px исходных картинок),
 * а в CSS переводится в проценты от размера проигрывателя (см. src/styles/cssVariables.ts) —
 * поэтому слои масштабируются вместе с проигрывателем и не зависят от viewport.
 * Все значения измерены по самим PNG.
 */

/** Общий холст слоёв, px. На нём без сдвига нарисован `tonearm.png` и холст `vinyl.png`. */
export const TURNTABLE_CANVAS = {
  width: 1408,
  height: 768,
} as const;

/**
 * Прямоугольник корпуса на холсте, px. `player-body.png` нарисован на холсте 1380×752;
 * сдвиг (15, 8) найден совмещением с исходным кадром деки того же рисунка.
 */
export const TURNTABLE_BODY_RECT = {
  x: 15,
  y: 8,
  width: 1380,
  height: 752,
} as const;

/** Где пластинка лежит на диске проигрывателя: центр и радиус на холсте, px. */
export const TURNTABLE_VINYL_PLACEMENT = {
  centerX: 627.6,
  centerY: 387.5,
  radius: 269.8,
} as const;

/** Диск на самом `vinyl.png` (холст 1408×768): центр и радиус, px. */
export const VINYL_IMAGE_DISC = {
  centerX: 702.8,
  centerY: 384.2,
  radius: 341.9,
} as const;

/**
 * Шарнир тонарма — центр поворотного диска-основания в `tonearm.png`, px холста.
 * Он совпадает с основанием, нарисованным на корпусе, поэтому при любом угле диск
 * тонарма остаётся на месте и закрывает основание корпуса без двойного контура.
 */
export const TONEARM_PIVOT = {
  x: 1009.7,
  y: 236.7,
} as const;

/**
 * Угол «поднятого» (запаркованного) тонарма относительно рабочего положения, градусы.
 * Отрицательный — против часовой стрелки: игла уходит за правый край пластинки.
 * 0° — рабочее положение из `tonearm.png`: игла у края пластинки.
 */
export const TONEARM_REST_ANGLE_DEG = -14;

/**
 * Границы самой деки на холсте, px (прозрачные поля вокруг не входят). Нужны, чтобы
 * выравнивать иконку в углу по краю деки, а не по краю прозрачного холста.
 */
export const TURNTABLE_DECK_BOUNDS = {
  left: 281,
  top: 64,
  right: 1157,
  bottom: 708,
} as const;
