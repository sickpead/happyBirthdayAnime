import type { CSSProperties } from 'react';

import type { DeskHubGrounding } from '../types';

/**
 * Цветокоррекция предметов стола — одна реализация на всех кликабельных: и на предметы
 * (`DESK_HUB_OBJECTS`), и на листы-черновики (`DESK_DRAFT_SHEETS`). Чисто декоративный слой
 * (`DESK_HUB_DECOR`) не трогается.
 *
 * Значения уезжают в CSS-переменные, которые читает `DeskHubObjects.module.css`. Теней
 * под предметами нет: на картинках стола и предметов свет уже нарисован, а отдельная тень
 * поверх него только спорила с рисунком.
 */

/** Общая подгонка картинки предмета под тёплый закатный свет сцены. */
export const DEFAULT_DESK_HUB_GROUNDING: DeskHubGrounding = {
  hueRotateDeg: -4,
  saturatePercent: 92,
  brightnessPercent: 97,
};

/** Инлайн-стиль с переменными цветокоррекции. */
export type GroundingStyle = CSSProperties &
  Record<'--grounding-hue' | '--grounding-saturate' | '--grounding-brightness', string>;

/**
 * Превращает настройки в CSS-переменные кнопки предмета — единственное место, где
 * они собираются, чтобы предметы и листы-черновики выглядели одинаково.
 *
 * @param grounding - Настройки предмета. Без них картинка показывается как есть.
 * @returns Инлайн-стиль для кнопки предмета.
 */
export function groundingToCssVars(grounding: DeskHubGrounding | undefined): GroundingStyle {
  return {
    '--grounding-hue': `${String(grounding?.hueRotateDeg ?? 0)}deg`,
    '--grounding-saturate': `${String(grounding?.saturatePercent ?? 100)}%`,
    '--grounding-brightness': `${String(grounding?.brightnessPercent ?? 100)}%`,
  };
}
