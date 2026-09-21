import type { CloudTransitionTimings, DarkFadeTimings } from '../types';
import { SCENE_TRANSITION_TIMINGS } from './timings';
import { VINYL_SPIN_MS } from './vinylPlayerGeometry';

/**
 * Тайминги сцены Desk, мс. Зум каждой стадии (пауза и длительность) задаётся в её записи
 * в `deskZoomStages.ts`, здесь — всё остальное.
 */

/* ── Первая стадия ────────────────────────────────────────────────────── */

/** Первая стадия проявляется при появлении сцены. */
export const WIDE_FADE_IN_MS = 1200;

/**
 * Атмосферная пауза первой стадии. Отсчёт — когда стадия проявилась и закончился общий
 * переход между сценами, поэтому общий план виден целиком. Дальше, как у любой стадии, —
 * `startDelayMs` и зум из её записи в `deskZoomStages.ts`.
 */
export const WIDE_HOLD_MS = 2500;

/* ── Переходы между стадиями ──────────────────────────────────────────── */

/** Перетекание: следующая картинка проявляется, текущая одновременно гаснет. */
export const CROSSFADE_DURATION_MS = 1400;

/**
 * Видео-переход длится ровно столько, сколько сам ролик, — отдельной константы под это нет.
 * Эти два тайминга только страхуют стыки: ролик проявляется поверх текущей картинки и гаснет
 * на своём последнем кадре, уже совпавшем с картинкой новой стадии.
 */
export const DESK_VIDEO_FADE_MS = 180;

/**
 * Сколько ждать начала воспроизведения. Не начался (нет файла, ошибка, заблокированный
 * автоплей) — переход идёт запасным путём, перетеканием, и сцена не встаёт.
 */
export const DESK_VIDEO_START_TIMEOUT_MS = 500;

/** Затемнение: экран темнеет до непрозрачного. */
export const DARK_FADE_COVER_MS = 900;
/** Затемнение: пауза в темноте, пока подменяется картинка. */
export const DARK_FADE_HOLD_MS = 300;
/** Затемнение: экран рассветляется. */
export const DARK_FADE_REVEAL_MS = 900;

/** Переход через затемнение — для `DarkFadeLayer`. */
export const DESK_DARK_FADE_TIMINGS: DarkFadeTimings = {
  coverMs: DARK_FADE_COVER_MS,
  revealMs: DARK_FADE_REVEAL_MS,
};

/** Облака закрывают экран (переход `clouds`, сейчас не используется) — как в общем переходе. */
export const DESK_CLOUD_COVER_MS = SCENE_TRANSITION_TIMINGS.coverMs;
/** Облака расходятся — как в общем переходе. */
export const DESK_CLOUD_REVEAL_MS = SCENE_TRANSITION_TIMINGS.revealMs;
/** Задержка между соседними облаками — как в общем переходе. */
export const DESK_CLOUD_STAGGER_MS = SCENE_TRANSITION_TIMINGS.staggerMs;
/** Пауза под закрытыми облаками, пока подменяется картинка. */
export const DESK_CLOUD_HOLD_MS = 300;

/** Облачный переход между стадиями — для `CloudTransitionLayer`. */
export const DESK_CLOUD_TIMINGS: CloudTransitionTimings = {
  coverMs: DESK_CLOUD_COVER_MS,
  revealMs: DESK_CLOUD_REVEAL_MS,
  staggerMs: DESK_CLOUD_STAGGER_MS,
};

/* ── Предметы на столе ────────────────────────────────────────────────── */

/** Предмет плавно приподнимается и светится при наведении. */
export const DESK_OBJECT_HOVER_MS = 280;
/** Один цикл покачивания предмета со стилем `lift-wiggle`. */
export const DESK_OBJECT_WIGGLE_MS = 600;
/** Поворот тонарма к пластинке и обратно у предмета со стилем `tonearm-swing`. */
export const DESK_TONEARM_SWING_MS = 350;
/**
 * Один оборот пластинки на столе: 33⅓ об/мин — та же скорость, что и у проигрывателя
 * во вступлении, поэтому берётся из его геометрии, а не задаётся числом заново.
 */
export const DESK_VINYL_ROTATION_MS = VINYL_SPIN_MS;
/** Один цикл покачивания стопки пластинок со стилем `stack-sway`. */
export const DESK_STACK_SWAY_MS = 1400;
/** Цикл мерцания огня на торте стола при наведении. */
export const DESK_FLAME_FLICKER_MS = 1000;

/* ── Загрузка картинок ────────────────────────────────────────────────── */

/**
 * Дольше незагруженную картинку не ждём: переход продолжается, а картинка догружается на виду.
 */
export const DESK_IMAGE_MAX_WAIT_MS = 6000;
