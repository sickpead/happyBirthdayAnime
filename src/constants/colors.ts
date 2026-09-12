/**
 * Палитра приложения — единый источник цветов и для CSS (через custom properties,
 * см. `src/styles/cssVariables.ts`), и для материалов Three.js на шаге 2.
 *
 * Значения черновые: финализируются вместе с визуалом сцен на шаге 2.
 */
export const COLORS = {
  background: '#15121f',
  text: '#f5efe6',
  textMuted: '#a69fba',

  accent: '#f4a259',
  accentHover: '#f7b877',
  accentContrast: '#1b1526',

  surface: '#fbf7f0',
  surfaceHover: '#efe8dc',
  surfaceText: '#1f1a2b',
  surfaceTextMuted: '#5d5670',

  overlay: 'rgba(8, 6, 14, 0.72)',
  focusRing: '#ffd166',
  focusRingOnSurface: '#6b4bd8',

  /** Фон плавающих панелей поверх сцены. */
  panel: 'rgba(20, 18, 30, 0.92)',
  /** Тонкие разделители и рамки на тёмном фоне. */
  borderSubtle: 'rgba(255, 255, 255, 0.16)',

  vinyl: '#101014',
  vinylLabel: '#e76f51',
} as const;
