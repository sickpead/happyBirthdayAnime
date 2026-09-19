import type { CSSProperties, ReactElement } from 'react';

import {
  CAKE_CANVAS,
  CAKE_IMAGES,
  CAKE_SPRITE_CANVAS,
  CAKE_VIEWBOX,
  FLAME_HEIGHT,
  FLAME_SINK,
  FLAME_SPRITE,
  SMOKE_HEIGHT,
  SMOKE_SPRITE,
} from '../constants/cakeAssets';
import { CAKE_CANDLE_POSITIONS } from '../constants/cakeCandles';
import type { CakeCandlePosition, CanvasPoint, CanvasRect, CanvasSprite } from '../types';
import { classNames } from '../utils/classNames';
import styles from './BirthdayCake.module.css';

/** Пропсы {@link BirthdayCake}. */
export interface BirthdayCakeProps {
  /** Доступное имя торта для скринридеров. */
  label: string;
  /** Дополнительный класс корня (размер в раскладке сцены). */
  className?: string;
}

const PERCENT_PRECISION = 1000;
const percent = (fraction: number): string =>
  `${String(Math.round(fraction * 100 * PERCENT_PRECISION) / PERCENT_PRECISION)}%`;

/** Размеры холста картинки, px. */
interface CanvasSize {
  width: number;
  height: number;
}

/** Положение всего холста картинки внутри рамки `frame` — обрезка прозрачных полей. */
function canvasInFrame(frame: CanvasRect, canvas: CanvasSize): CSSProperties {
  return {
    left: percent(-frame.x / frame.width),
    top: percent(-frame.y / frame.height),
    width: percent(canvas.width / frame.width),
    height: percent(canvas.height / frame.height),
  };
}

/** Кончик фитиля свечи на холсте торта, px. */
function wickTip({ xPercent, yPercent }: CakeCandlePosition): CanvasPoint {
  return {
    x: (CAKE_CANVAS.width * xPercent) / 100,
    y: (CAKE_CANVAS.height * yPercent) / 100,
  };
}

/** Рамка спрайта на холсте торта: основание спрайта стоит ровно в точке `anchor`. */
function spriteFrame(sprite: CanvasSprite, height: number, anchor: CanvasPoint): CanvasRect {
  const scale = height / sprite.box.height;
  return {
    x: anchor.x - (sprite.base.x - sprite.box.x) * scale,
    y: anchor.y - (sprite.base.y - sprite.box.y) * scale,
    width: sprite.box.width * scale,
    height,
  };
}

/** Рамка спрайта в процентах видимой области торта; transform-origin — в основании спрайта. */
function spriteStyle(sprite: CanvasSprite, frame: CanvasRect): CSSProperties {
  const originX = percent((sprite.base.x - sprite.box.x) / sprite.box.width);
  const originY = percent((sprite.base.y - sprite.box.y) / sprite.box.height);
  return {
    left: percent((frame.x - CAKE_VIEWBOX.x) / CAKE_VIEWBOX.width),
    top: percent((frame.y - CAKE_VIEWBOX.y) / CAKE_VIEWBOX.height),
    width: percent(frame.width / CAKE_VIEWBOX.width),
    height: percent(frame.height / CAKE_VIEWBOX.height),
    transformOrigin: `${originX} ${originY}`,
  };
}

const CAKE_STYLE: CSSProperties = {
  aspectRatio: `${String(CAKE_VIEWBOX.width)} / ${String(CAKE_VIEWBOX.height)}`,
};
const CAKE_IMAGE_STYLE = canvasInFrame(CAKE_VIEWBOX, CAKE_CANVAS);
const FLAME_IMAGE_STYLE = canvasInFrame(FLAME_SPRITE.box, CAKE_SPRITE_CANVAS);
const SMOKE_IMAGE_STYLE = canvasInFrame(SMOKE_SPRITE.box, CAKE_SPRITE_CANVAS);

/** Огни: основание пламени чуть ниже кончика фитиля — фитиль «входит» в пламя. */
const FLAME_STYLES = CAKE_CANDLE_POSITIONS.map((candle) => {
  const scale = candle.scale ?? 1;
  const tip = wickTip(candle);
  return spriteStyle(
    FLAME_SPRITE,
    spriteFrame(FLAME_SPRITE, FLAME_HEIGHT * scale, {
      x: tip.x,
      y: tip.y + FLAME_SINK * scale,
    }),
  );
});

/** Дым: нижний кончик струйки — в кончике фитиля. */
const SMOKE_STYLES = CAKE_CANDLE_POSITIONS.map((candle) =>
  spriteStyle(
    SMOKE_SPRITE,
    spriteFrame(SMOKE_SPRITE, SMOKE_HEIGHT * (candle.scale ?? 1), wickTip(candle)),
  ),
);

/**
 * Праздничный торт — одна статичная картинка с поздравлением, кремовым декором и свечами
 * (огня на ней нет, только фитили), а поверх неё по одному огню (`data-cake-flame="1…N"`,
 * один `flame.png`) и струйке дыма (`data-cake-smoke`, один `smoke.png`, изначально скрыт)
 * на каждую свечу из `CAKE_CANDLE_POSITIONS` (`src/constants/cakeCandles.ts`).
 *
 * Слои: торт (1) → огни (2) → дым (3). Все координаты — в процентах от контейнера торта,
 * поэтому при любом размере окна огни остаются точно над фитилями. Горит свеча или потушена —
 * состояние кода, а не разные картинки торта: анимации (горение, задувание, дым) задаёт сцена
 * через `src/animation/candles.ts`.
 */
export function BirthdayCake({ label, className }: BirthdayCakeProps): ReactElement {
  return (
    <div
      className={classNames(styles.cake, className)}
      style={CAKE_STYLE}
      role="img"
      aria-label={label}
    >
      <img
        className={styles.cakeImage}
        style={CAKE_IMAGE_STYLE}
        src={CAKE_IMAGES.cake}
        alt=""
        decoding="async"
        draggable={false}
      />
      {CAKE_CANDLE_POSITIONS.map((candle, index) => (
        <div
          key={`flame-${candle.id}`}
          className={styles.flame}
          style={FLAME_STYLES[index]}
          data-cake-flame={index + 1}
        >
          <img
            className={styles.sprite}
            style={FLAME_IMAGE_STYLE}
            src={CAKE_IMAGES.flame}
            alt=""
            decoding="async"
            draggable={false}
          />
        </div>
      ))}
      {CAKE_CANDLE_POSITIONS.map((candle, index) => (
        <div
          key={`smoke-${candle.id}`}
          className={styles.smoke}
          style={SMOKE_STYLES[index]}
          data-cake-smoke={index + 1}
        >
          <img
            className={styles.sprite}
            style={SMOKE_IMAGE_STYLE}
            src={CAKE_IMAGES.smoke}
            alt=""
            decoding="async"
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
}
