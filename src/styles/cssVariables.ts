import { COLORS } from '../constants/colors';
import {
  FOCUS_RING,
  MODAL_LAYOUT,
  RADII,
  SHADOWS,
  SPACING,
  TURNTABLE_LAYOUT,
  Z_INDEX,
} from '../constants/layout';
import { TIMINGS } from '../constants/timings';
import { FONT_FAMILY, FONT_SIZE, FONT_WEIGHT, LINE_HEIGHT } from '../constants/typography';

type CssCustomPropertyName = `--${string}`;

const px = (value: number): string => `${String(value)}px`;
const ms = (value: number): string => `${String(value)}ms`;

/**
 * Дизайн-токены из `src/constants`, опубликованные для CSS как custom properties.
 * CSS-модули ссылаются только на `var(--…)`: сами значения живут в TypeScript,
 * поэтому CSS и Three.js (шаг 2) используют один источник правды.
 */
export const CSS_VARIABLES = {
  '--color-background': COLORS.background,
  '--color-text': COLORS.text,
  '--color-text-muted': COLORS.textMuted,
  '--color-accent': COLORS.accent,
  '--color-accent-hover': COLORS.accentHover,
  '--color-accent-contrast': COLORS.accentContrast,
  '--color-surface': COLORS.surface,
  '--color-surface-hover': COLORS.surfaceHover,
  '--color-surface-text': COLORS.surfaceText,
  '--color-surface-text-muted': COLORS.surfaceTextMuted,
  '--color-overlay': COLORS.overlay,
  '--color-focus-ring': COLORS.focusRing,
  '--color-focus-ring-on-surface': COLORS.focusRingOnSurface,
  '--color-panel': COLORS.panel,
  '--color-border-subtle': COLORS.borderSubtle,
  '--color-vinyl': COLORS.vinyl,
  '--color-vinyl-label': COLORS.vinylLabel,

  '--font-family-base': FONT_FAMILY.base,
  '--font-family-mono': FONT_FAMILY.mono,
  '--font-size-sm': px(FONT_SIZE.sm),
  '--font-size-md': px(FONT_SIZE.md),
  '--font-size-lg': px(FONT_SIZE.lg),
  '--font-size-xl': px(FONT_SIZE.xl),
  '--font-size-display': px(FONT_SIZE.display),
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
  '--shadow-card': SHADOWS.card,

  '--z-turntable': String(Z_INDEX.turntable),
  '--z-hud': String(Z_INDEX.hud),
  '--z-modal': String(Z_INDEX.modal),

  '--duration-turntable-fade': ms(TIMINGS.turntableFadeMs),
  '--duration-interaction': ms(TIMINGS.interactionFeedbackMs),

  '--turntable-size': px(TURNTABLE_LAYOUT.size),
  '--turntable-offset': px(TURNTABLE_LAYOUT.offset),
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
