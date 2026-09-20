import { AMBIENT_CLOUD_FADE_MS } from '../constants/ambientBackdrop';
import {
  DESK_FLAME_FLICKER_MS,
  DESK_OBJECT_HOVER_MS,
  DESK_OBJECT_WIGGLE_MS,
  DESK_STACK_SWAY_MS,
  DESK_TONEARM_SWING_MS,
} from '../constants/deskTimings';
import { VINYL_SPIN_MS_PER_ROTATION } from '../constants/introTimings';
import {
  CAKE_LAYOUT,
  CORNER_TURNTABLE,
  FOCUS_RING,
  INTRO_LAYOUT,
  MODAL_LAYOUT,
  RADII,
  SPACING,
  Z_INDEX,
} from '../constants/layout';
import { TIMINGS } from '../constants/timings';
import {
  TONEARM_PIVOT,
  TURNTABLE_BODY_RECT,
  TURNTABLE_CANVAS,
  TURNTABLE_DECK_BOUNDS,
  TURNTABLE_VINYL_PLACEMENT,
  VINYL_IMAGE_DISC,
} from '../constants/turntableAssets';
import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT, LINE_HEIGHT } from '../constants/typography';
import { devWarn } from '../utils/devLog';

/** Имя CSS custom property, например `'--color-accent-gold'`. */
export type CssCustomPropertyName = `--${string}`;

const CSS_PRECISION = 100;
const PERCENT_PRECISION = 1000;
const round = (value: number): number => Math.round(value * CSS_PRECISION) / CSS_PRECISION;
const px = (value: number): string => `${String(round(value))}px`;
const ms = (value: number): string => `${String(value)}ms`;
const percent = (fraction: number): string =>
  `${String(Math.round(fraction * 100 * PERCENT_PRECISION) / PERCENT_PRECISION)}%`;

/** Доля ширины / высоты холста проигрывателя — чтобы слои масштабировались вместе с ним. */
const ofCanvasWidth = (canvasPx: number): string => percent(canvasPx / TURNTABLE_CANVAS.width);
const ofCanvasHeight = (canvasPx: number): string => percent(canvasPx / TURNTABLE_CANVAS.height);

/**
 * Пластинка: обёртка — квадрат вокруг диска на проигрывателе (вращается вокруг своего центра),
 * картинка внутри сдвинута и масштабирована так, чтобы диск `vinyl.png` совпал с обёрткой.
 */
const vinylImageDiscDiameter = 2 * VINYL_IMAGE_DISC.radius;
const vinylImageOffset = (discCenter: number): string =>
  percent(-(discCenter - VINYL_IMAGE_DISC.radius) / vinylImageDiscDiameter);

/**
 * Геометрия иконки проигрывателя в углу. Холст картинок шире самой деки (прозрачные поля),
 * поэтому размер и отступы холста выводятся из границ деки: дека получается шириной
 * `CORNER_TURNTABLE.deckWidth` и стоит в `CORNER_TURNTABLE.offset` от краёв экрана.
 */
const cornerCanvasWidth =
  (CORNER_TURNTABLE.deckWidth * TURNTABLE_CANVAS.width) /
  (TURNTABLE_DECK_BOUNDS.right - TURNTABLE_DECK_BOUNDS.left);
const cornerCanvasHeight = (cornerCanvasWidth * TURNTABLE_CANVAS.height) / TURNTABLE_CANVAS.width;
const cornerCanvasRight =
  CORNER_TURNTABLE.offset -
  (cornerCanvasWidth * (TURNTABLE_CANVAS.width - TURNTABLE_DECK_BOUNDS.right)) /
    TURNTABLE_CANVAS.width;
const cornerCanvasTop =
  CORNER_TURNTABLE.offset -
  (cornerCanvasHeight * TURNTABLE_DECK_BOUNDS.top) / TURNTABLE_CANVAS.height;

/**
 * Нецветовые дизайн-токены из `src/constants` (типографика, отступы, радиусы, слои,
 * тайминги, размеры), опубликованные для CSS как custom properties. Эти значения нужны
 * и JS-логике (например, тайминги GSAP), поэтому источник правды для них — TypeScript.
 *
 * Цветов здесь нет: их единственный источник — `src/styles/tokens.css`.
 */
export const CSS_VARIABLES = {
  '--font-family-base': FONT_FAMILY.base,
  '--font-family-mono': FONT_FAMILY.mono,
  '--font-family-script': FONT_FAMILY.script,
  '--font-size-sm': px(FONT_SIZE.sm),
  '--font-size-md': px(FONT_SIZE.md),
  '--font-size-lg': px(FONT_SIZE.lg),
  '--font-size-xl': px(FONT_SIZE.xl),
  '--font-size-display': px(FONT_SIZE.display),
  '--font-size-hero': px(FONT_SIZE.hero),
  '--font-weight-regular': String(FONT_WEIGHT.regular),
  '--font-weight-medium': String(FONT_WEIGHT.medium),
  '--font-weight-bold': String(FONT_WEIGHT.bold),
  '--line-height-tight': String(LINE_HEIGHT.tight),
  '--line-height-base': String(LINE_HEIGHT.base),

  '--space-xs': px(SPACING.xs),
  '--space-sm': px(SPACING.sm),
  '--space-md': px(SPACING.md),
  '--space-lg': px(SPACING.lg),
  '--space-xl': px(SPACING.xl),
  '--space-xxl': px(SPACING.xxl),

  '--radius-sm': px(RADII.sm),
  '--radius-md': px(RADII.md),
  '--radius-lg': px(RADII.lg),
  '--radius-pill': px(RADII.pill),

  '--focus-ring-width': px(FOCUS_RING.width),
  '--focus-ring-offset': px(FOCUS_RING.offset),

  '--z-scene-transition': String(Z_INDEX.sceneTransition),
  '--z-turntable': String(Z_INDEX.turntable),
  '--z-hud': String(Z_INDEX.hud),
  '--z-modal': String(Z_INDEX.modal),

  '--duration-turntable-fade': ms(TIMINGS.turntableFadeMs),
  '--duration-interaction': ms(TIMINGS.interactionFeedbackMs),
  '--duration-vinyl-rotation': ms(VINYL_SPIN_MS_PER_ROTATION),
  '--duration-ambient-cloud-fade': ms(AMBIENT_CLOUD_FADE_MS),
  '--duration-desk-object-hover': ms(DESK_OBJECT_HOVER_MS),
  '--duration-desk-object-wiggle': ms(DESK_OBJECT_WIGGLE_MS),
  '--duration-desk-tonearm-swing': ms(DESK_TONEARM_SWING_MS),
  '--duration-desk-stack-sway': ms(DESK_STACK_SWAY_MS),
  '--duration-desk-flame-flicker': ms(DESK_FLAME_FLICKER_MS),

  '--turntable-aspect-ratio': `${String(TURNTABLE_CANVAS.width)} / ${String(TURNTABLE_CANVAS.height)}`,
  '--turntable-body-left': ofCanvasWidth(TURNTABLE_BODY_RECT.x),
  '--turntable-body-top': ofCanvasHeight(TURNTABLE_BODY_RECT.y),
  '--turntable-body-width': ofCanvasWidth(TURNTABLE_BODY_RECT.width),
  '--turntable-body-height': ofCanvasHeight(TURNTABLE_BODY_RECT.height),
  '--turntable-vinyl-left': ofCanvasWidth(
    TURNTABLE_VINYL_PLACEMENT.centerX - TURNTABLE_VINYL_PLACEMENT.radius,
  ),
  '--turntable-vinyl-top': ofCanvasHeight(
    TURNTABLE_VINYL_PLACEMENT.centerY - TURNTABLE_VINYL_PLACEMENT.radius,
  ),
  '--turntable-vinyl-size': ofCanvasWidth(2 * TURNTABLE_VINYL_PLACEMENT.radius),
  '--turntable-vinyl-image-left': vinylImageOffset(VINYL_IMAGE_DISC.centerX),
  '--turntable-vinyl-image-top': vinylImageOffset(VINYL_IMAGE_DISC.centerY),
  '--turntable-vinyl-image-width': percent(TURNTABLE_CANVAS.width / vinylImageDiscDiameter),
  '--turntable-vinyl-image-height': percent(TURNTABLE_CANVAS.height / vinylImageDiscDiameter),
  '--turntable-pivot-x': ofCanvasWidth(TONEARM_PIVOT.x),
  '--turntable-pivot-y': ofCanvasHeight(TONEARM_PIVOT.y),
  '--corner-turntable-width': px(cornerCanvasWidth),
  '--corner-turntable-top': px(cornerCanvasTop),
  '--corner-turntable-right': px(cornerCanvasRight),
  '--intro-deck-width': `min(${String(INTRO_LAYOUT.deckCanvasMaxVw)}vw, ${String(INTRO_LAYOUT.deckCanvasMaxVh)}vh)`,
  '--cake-height': `min(${String(CAKE_LAYOUT.heightMaxVh)}vh, ${String(CAKE_LAYOUT.heightMaxVw)}vw)`,

  '--modal-max-width': px(MODAL_LAYOUT.maxWidth),
  '--modal-close-size': px(MODAL_LAYOUT.closeButtonSize),
} as const satisfies Readonly<Record<CssCustomPropertyName, string>>;

/**
 * Объявляет все токены из {@link CSS_VARIABLES} в inline-стиле элемента.
 * Вызывается один раз при старте для `document.documentElement`, чтобы переменные
 * были доступны везде, в том числе в порталах (модалки рендерятся в `document.body`).
 * Работает через CSSOM, поэтому совместимо со строгой CSP без `'unsafe-inline'`.
 *
 * @param target - Элемент, на котором объявляются переменные.
 */
export function applyCssVariables(target: HTMLElement): void {
  for (const [name, value] of Object.entries(CSS_VARIABLES)) {
    target.style.setProperty(name, value);
  }
}

/**
 * Читает вычисленное значение CSS custom property — прежде всего цветового токена
 * из `tokens.css` для Three.js: `new THREE.Color(readCssVariable('--color-accent-gold'))`.
 *
 * Ссылки `var()` браузер уже подставил, поэтому `--color-cloud-base` вернёт итоговый цвет.
 * Производные токены на `color-mix()` возвращаются выражением, которое `THREE.Color`
 * не разберёт, — в 3D используйте базовые токены палитры.
 *
 * @param name - Имя переменной, например `'--color-accent-gold'`.
 * @param element - Элемент, в контексте которого вычисляется значение. По умолчанию `<html>`.
 * @returns Значение без пробелов по краям или пустая строка, если переменная не определена.
 */
export function readCssVariable(
  name: CssCustomPropertyName,
  element: Element = document.documentElement,
): string {
  const value = getComputedStyle(element).getPropertyValue(name).trim();
  if (value === '') {
    devWarn('tokens', `CSS-переменная ${name} не определена — проверьте src/styles/tokens.css`);
  }
  return value;
}
