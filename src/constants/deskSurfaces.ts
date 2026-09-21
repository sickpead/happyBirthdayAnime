import type { DeskShadowSurface } from '../types';
import { DESK_STAGE_FALLBACK_ASPECT_RATIO } from './deskZoomStages';

/**
 * Поверхности сцены HUB в процентах картинки стола (`desk-hub-empty.jpg`).
 * Снято с пустого кадра: столешница — только верхняя деревянная плоскость,
 * сиденье стула — доска, газон — лужайка вокруг, без неба и клумб.
 *
 * Тень предмета обрезается по своей поверхности: торт на столе не отбрасывает
 * силуэт на цветы за столом, винил на траве не заезжает на столешницу.
 */

export interface DeskPoint {
  x: number;
  y: number;
}

/** Бокс предмета в тех же процентах картинки стола, что и поверхности. */
export interface DeskLayerBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Столешница — верхняя плоскость, без ножек. */
export const DESK_TABLE_TOP: readonly DeskPoint[] = [
  { x: 14.4, y: 21 },
  { x: 85.6, y: 21 },
  { x: 87.4, y: 48.8 },
  { x: 12.6, y: 48.8 },
];

/** Сиденье стула — туда падает тень письма. */
export const DESK_CHAIR_SEAT: readonly DeskPoint[] = [
  { x: 44.6, y: 59.6 },
  { x: 55.6, y: 59.6 },
  { x: 56, y: 67.4 },
  { x: 44.2, y: 67.4 },
];

/** Лужайка: от нижнего края клумб до низа кадра. */
export const DESK_GRASS_LAWN: readonly DeskPoint[] = [
  { x: 0, y: 16 },
  { x: 100, y: 16 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

/**
 * Бокс слоя предмета. У кликабельных якорь — левый верх, у листов — центр.
 * Высота: явная `heightPercent` или пропорции PNG относительно кадра 1408×768.
 */
export function deskLayerBox(args: {
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent?: number;
  imageWidth?: number;
  imageHeight?: number;
  origin: 'top-left' | 'center';
}): DeskLayerBox | null {
  const { widthPercent } = args;
  const heightPercent =
    args.heightPercent ??
    (args.imageWidth !== undefined &&
    args.imageHeight !== undefined &&
    args.imageWidth > 0
      ? widthPercent * DESK_STAGE_FALLBACK_ASPECT_RATIO * (args.imageHeight / args.imageWidth)
      : null);

  if (heightPercent === null || heightPercent <= 0 || widthPercent <= 0) {
    return null;
  }

  const left = args.origin === 'center' ? args.xPercent - widthPercent / 2 : args.xPercent;
  const top = args.origin === 'center' ? args.yPercent - heightPercent / 2 : args.yPercent;

  return { left, top, width: widthPercent, height: heightPercent };
}

const toLocal = (point: DeskPoint, box: DeskLayerBox): DeskPoint => ({
  x: (point.x - box.left) / box.width,
  y: (point.y - box.top) / box.height,
});

const polygonCss = (points: readonly DeskPoint[], box: DeskLayerBox): string =>
  `polygon(${points
    .map((point) => {
      const local = toLocal(point, box);
      return `${String(local.x * 100)}% ${String(local.y * 100)}%`;
    })
    .join(', ')})`;

const pathEvenOdd = (outer: readonly DeskPoint[], holes: readonly (readonly DeskPoint[])[], box: DeskLayerBox): string => {
  const ring = (points: readonly DeskPoint[]): string => {
    const locals = points.map((point) => toLocal(point, box));
    const [first, ...rest] = locals;
    if (first === undefined) {
      return '';
    }
    return `M ${String(first.x)} ${String(first.y)} ${rest
      .map((point) => `L ${String(point.x)} ${String(point.y)}`)
      .join(' ')} Z`;
  };

  return `${ring(outer)} ${holes.map((hole) => ring(hole)).join(' ')}`.trim();
};

/** Как обрезать тень: CSS-многоугольник или SVG-path с дырками (газон минус стол и стул). */
export type DeskShadowClip =
  | { kind: 'polygon'; value: string }
  | { kind: 'path'; value: string };

/**
 * Обрезка тени по поверхности, на которой лежит предмет.
 * Координаты переводятся из процентов стола в бокс предмета.
 */
export function deskShadowClip(
  surface: DeskShadowSurface,
  box: DeskLayerBox,
): DeskShadowClip {
  if (surface === 'table') {
    return { kind: 'polygon', value: polygonCss(DESK_TABLE_TOP, box) };
  }
  if (surface === 'chair') {
    return { kind: 'polygon', value: polygonCss(DESK_CHAIR_SEAT, box) };
  }
  return {
    kind: 'path',
    value: pathEvenOdd(DESK_GRASS_LAWN, [DESK_TABLE_TOP, DESK_CHAIR_SEAT], box),
  };
}
