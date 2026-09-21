/**
 * Геометрия VinylPlayer на холсте 1408×768.
 * Центры сняты с актуальных PNG (корпус / пластинка / тонарм).
 */
export const VINYL_PLAYER_CANVAS = {
  width: 1408,
  height: 768,
} as const;

/** Корпус заполняет холст. */
export const VINYL_PLAYER_BODY = {
  x: 0,
  y: 0,
  width: 1408,
  height: 768,
} as const;

/**
 * Платтер на корпусе: центр шпинделя и радиус посадочного круга, px холста.
 * Пластинка совмещается с этим кругом. Центр снят по латунному шпинделю
 * на `player-body.png`, радиус — по кромке платтера.
 */
export const VINYL_PLAYER_PLATTER = {
  centerX: 633,
  centerY: 373,
  radius: 268,
} as const;

/**
 * Диск внутри `vinyl.png` (тот же холст 1408×768): рамка непрозрачных пикселей
 * картинки — она и есть диск.
 */
export const VINYL_PLAYER_DISC_IN_IMAGE = {
  centerX: 703,
  centerY: 384,
  radius: 343,
} as const;

/**
 * Шарнир тонарма — центр латунного диска-основания в `tonearm.png`, px. Вокруг него
 * тонарм и поворачивается, поэтому диск остаётся на месте и закрывает крепление на корпусе.
 */
export const VINYL_PLAYER_TONEARM_PIVOT = {
  x: 1011,
  y: 238,
} as const;

/** Угол покоя (подставка), градусы. 0° — игла у края пластинки (как нарисовано). */
export const VINYL_PLAYER_TONEARM_REST_DEG = -16;
export const VINYL_PLAYER_TONEARM_PLAY_DEG = 0;

/** Один оборот пластинки, мс (~33⅓ RPM). */
export const VINYL_SPIN_MS = 1800;

/** Длительность поворота тонарма, мс. */
export const TONEARM_SWING_MS = 1800;

/** Границы деки на холсте — для иконки в углу (рамка непрозрачных пикселей корпуса). */
export const VINYL_PLAYER_DECK_BOUNDS = {
  left: 271,
  top: 55,
  right: 1166,
  bottom: 716,
} as const;
