/** Семейства шрифтов. */
export const FONT_FAMILY = {
  base: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  /** Рукописный шрифт поздравлений (self-hosted через @fontsource/marck-script, есть кириллица). */
  script: '"Marck Script", "Segoe Script", cursive',
} as const;

/** Кегли, px. */
export const FONT_SIZE = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 28,
  display: 56,
  /** Крупная надпись-поздравление. */
  hero: 84,
} as const;

/** Начертания. */
export const FONT_WEIGHT = {
  regular: 400,
  medium: 500,
  bold: 700,
} as const;

/** Межстрочные интервалы (безразмерные множители). */
export const LINE_HEIGHT = {
  tight: 1.15,
  base: 1.5,
} as const;
