/** Изображения торта: сам торт со свечами и фитилями, огонь и дым. */
export type CakeImageId = 'cake' | 'flame' | 'smoke';

/** Свеча на картинке торта: где её фитиль и как живёт её огонь. */
export interface CakeCandlePosition {
  id: string;
  /** Кончик фитиля, % ширины картинки торта. */
  xPercent: number;
  /** Кончик фитиля, % высоты картинки торта. */
  yPercent: number;
  /** Сдвиг старта «дыхания» огня, мс: с разными сдвигами огни не мерцают синхронно. */
  flickerDelayMs: number;
  /** Масштаб огня и дыма этой свечи (по умолчанию 1). */
  scale?: number;
}

/** Точка на холсте исходной картинки, px. */
export interface CanvasPoint {
  x: number;
  y: number;
}

/** Прямоугольник на холсте исходной картинки, px. */
export interface CanvasRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Спрайт на холсте: область с содержимым и точка основания (за неё спрайт крепится). */
export interface CanvasSprite {
  box: CanvasRect;
  base: CanvasPoint;
}
