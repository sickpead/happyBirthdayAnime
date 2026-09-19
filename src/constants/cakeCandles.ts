import type { CakeCandlePosition } from '../types';

/**
 * Свечи на картинке торта, слева направо: кончики фитилей в процентах самой картинки
 * (`x / ширина × 100`, `y / высота × 100`, холст `cake-v2.png` — 1380×752). Значения сняты
 * с картинки; подгоняются на глаз, код компонентов менять не нужно.
 *
 * Сколько здесь записей — столько огней и струек дыма рендерит `BirthdayCake`: огонь встаёт
 * основанием на кончик фитиля, дым поднимается оттуда же. Порядок записей — порядок, в котором
 * свечи задуваются. `flickerDelayMs` сдвигает старт «дыхания» огня, чтобы свечи не мерцали
 * в такт, `scale` (необязательный) меняет размер огня и дыма отдельной свечи.
 */
export const CAKE_CANDLE_POSITIONS: readonly CakeCandlePosition[] = [
  { id: 'c1', xPercent: 46.23, yPercent: 6.91, flickerDelayMs: 0 },
  { id: 'c2', xPercent: 50.83, yPercent: 3.46, flickerDelayMs: 180 },
  { id: 'c3', xPercent: 53.66, yPercent: 5.98, flickerDelayMs: 340 },
  { id: 'c4', xPercent: 57.5, yPercent: 3.99, flickerDelayMs: 90 },
  { id: 'c5', xPercent: 62.25, yPercent: 7.05, flickerDelayMs: 260 },
];
