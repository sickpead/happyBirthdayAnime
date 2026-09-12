/**
 * Слои наложения (z-index). Все уровни — только здесь, чтобы исключить «гонку» z-index.
 */
export const Z_INDEX = {
  turntable: 10,
  /** Плавающие панели управления поверх сцены (в т.ч. dev-панель), но под модалками. */
  hud: 900,
  modal: 1000,
} as const;

/** Шкала отступов, px. */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Радиусы скругления, px. */
export const RADII = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 9999,
} as const;

/** Индикатор клавиатурного фокуса, px. */
export const FOCUS_RING = {
  width: 3,
  offset: 3,
} as const;

/** Тени (уровни elevation). */
export const SHADOWS = {
  card: '0 24px 64px rgba(0, 0, 0, 0.45)',
} as const;

/** Проигрыватель в правом верхнем углу, px. */
export const TURNTABLE_LAYOUT = {
  size: 112,
  offset: 24,
} as const;

/** Базовое модальное окно, px. */
export const MODAL_LAYOUT = {
  maxWidth: 560,
  closeButtonSize: 40,
} as const;
