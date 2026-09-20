import type { CakeCandlePosition } from '../types';

/**
 * Свечи на картинке торта, слева направо: кончики фитилей в процентах самой картинки
 * (`x / ширина × 100`, `y / высота × 100`, холст `cake-v3.png` — 848×1264). Значения сняты
 * с картинки; подгоняются на глаз, код компонентов менять не нужно.
 *
 * Сколько здесь записей — столько огней и струек дыма рендерит `BirthdayCake`: огонь встаёт
 * основанием на кончик фитиля, дым поднимается оттуда же. Порядок записей — порядок, в котором
 * свечи задуваются. `flickerDelayMs` сдвигает старт «дыхания» огня, чтобы свечи не мерцали
 * в такт, `scale` (необязательный) меняет размер огня и дыма отдельной свечи.
 */
export const CAKE_CANDLE_POSITIONS: readonly CakeCandlePosition[] = [
  { id: 'c1', xPercent: 38.2, yPercent: 22.9, flickerDelayMs: 0 },
  { id: 'c2', xPercent: 45.8, yPercent: 18.4, flickerDelayMs: 180 },
  { id: 'c3', xPercent: 51.2, yPercent: 25.2, flickerDelayMs: 340 },
  { id: 'c4', xPercent: 59.7, yPercent: 20.8, flickerDelayMs: 90 },
  { id: 'c5', xPercent: 66, yPercent: 23.9, flickerDelayMs: 260 },
];
