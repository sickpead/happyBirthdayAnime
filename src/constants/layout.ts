/**
 * Слои наложения (z-index). Все уровни — только здесь, чтобы исключить «гонку» z-index.
 */
export const Z_INDEX = {
  /** Облака общего перехода: поверх сцен, но под иконкой проигрывателя — она «переживает» переходы. */
  sceneTransition: 5,
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

/** Иконка проигрывателя в правом верхнем углу (`CornerTurntable`), px. */
export const CORNER_TURNTABLE = {
  /** Ширина самой деки на иконке. */
  deckWidth: 96,
  /** Отступ деки от верхнего и правого края экрана. */
  offset: 24,
} as const;

/**
 * Проигрыватель в сцене intro: ширина холста — `min(vw, vh)`, чтобы дека
 * крупно и целиком помещалась на экране любой пропорции.
 */
export const INTRO_LAYOUT = {
  deckCanvasMaxVw: 100,
  deckCanvasMaxVh: 125,
} as const;

/**
 * Торт в сцене Cake: высота — `min(vh, vw)`, ширина — по пропорциям торта,
 * чтобы он целиком помещался на экране любой пропорции.
 */
export const CAKE_LAYOUT = {
  heightMaxVh: 64,
  heightMaxVw: 82,
} as const;

/** Базовое модальное окно, px. */
export const MODAL_LAYOUT = {
  maxWidth: 560,
  /** Широкий вариант — для картинок во всю карточку (читалка комикса). */
  maxWidthWide: 1100,
  closeButtonSize: 40,
} as const;
