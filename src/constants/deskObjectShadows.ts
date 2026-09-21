import type {
  DeskDraftSheet,
  DeskHubObjectId,
  DeskObjectShadowPlan,
  DeskSilhouetteShadow,
} from '../types';

/**
 * Силуэтные тени предметов стола: копия PNG под предметом, сдвинутая влево-вниз.
 * Свет — сверху-справа, как у тени стола на траве. Числа у каждого предмета свои.
 *
 * Этот набор подобран и зафиксирован — не сдвигать без явной просьбы.
 * Обрезка по столу / газону / стулу — в `deskSurfaces.ts`, не здесь.
 */

const leftDown = (
  x: number,
  y: number,
  blurPx: number,
  opacity: number,
  scale?: Pick<DeskSilhouetteShadow, 'scaleX' | 'scaleY'>,
): DeskSilhouetteShadow => ({
  offsetXPercent: -Math.abs(x),
  offsetYPercent: Math.abs(y),
  blurPx,
  opacity,
  ...scale,
});

const plan = (
  surface: DeskObjectShadowPlan['surface'],
  contact: DeskSilhouetteShadow,
  cast: DeskSilhouetteShadow,
): DeskObjectShadowPlan => ({ surface, contact, cast });

const OBJECT_SHADOWS: Readonly<Record<DeskHubObjectId, DeskObjectShadowPlan>> = {
  cake: plan('table', leftDown(5, 4, 2, 0.7), leftDown(18, 12, 12, 0.55, { scaleX: 1.1, scaleY: 0.9 })),
  'rose-vase': plan('table', leftDown(4, 3, 2, 0.65), leftDown(14, 10, 10, 0.5, { scaleX: 1.08, scaleY: 0.86 })),
  turntable: plan('table', leftDown(5, 4, 2, 0.65), leftDown(16, 10, 11, 0.5, { scaleX: 1.12, scaleY: 0.88 })),
  book: plan('table', leftDown(4, 3, 2, 0.68), leftDown(12, 8, 8, 0.5, { scaleX: 1.08, scaleY: 0.92 })),
  'colored-pencils': plan('table', leftDown(4, 4, 1, 0.62), leftDown(10, 7, 5, 0.48, { scaleX: 1.05, scaleY: 0.95 })),
  'fountain-pen': plan('table', leftDown(4, 4, 1, 0.62), leftDown(10, 7, 5, 0.48, { scaleX: 1.05, scaleY: 0.95 })),
  letter: plan('chair', leftDown(4, 3, 2, 0.65), leftDown(11, 7, 7, 0.48, { scaleX: 1.06, scaleY: 0.92 })),
  'vinyl-stack': plan('grass', leftDown(5, 4, 2, 0.72), leftDown(20, 14, 14, 0.58, { scaleX: 1.14, scaleY: 0.86 })),
};

const DRAFT_SHADOWS: Readonly<Record<string, DeskObjectShadowPlan>> = {
  'draft-1': plan('table', leftDown(3, 2, 2, 0.46), leftDown(8, 6, 7, 0.34, { scaleX: 1.05, scaleY: 0.95 })),
  'draft-2': plan('table', leftDown(3, 2, 3, 0.44), leftDown(8, 5, 8, 0.32, { scaleX: 1.05, scaleY: 0.95 })),
  'draft-3': plan('table', leftDown(3, 2, 3, 0.42), leftDown(9, 6, 10, 0.3, { scaleX: 1.06, scaleY: 0.94 })),
  'draft-4': plan('grass', leftDown(3, 3, 3, 0.5), leftDown(9, 7, 8, 0.36, { scaleX: 1.06, scaleY: 0.94 })),
  'draft-5': plan('grass', leftDown(4, 3, 3, 0.5), leftDown(10, 7, 9, 0.36, { scaleX: 1.08, scaleY: 0.92 })),
  'draft-6': plan('grass', leftDown(3, 3, 3, 0.5), leftDown(9, 7, 8, 0.36, { scaleX: 1.06, scaleY: 0.94 })),
  'draft-7': plan('grass', leftDown(3, 3, 3, 0.5), leftDown(9, 7, 8, 0.36, { scaleX: 1.06, scaleY: 0.94 })),
};

/** Тени кликабельного предмета стола. */
export function getDeskHubObjectShadows(id: DeskHubObjectId): DeskObjectShadowPlan {
  return OBJECT_SHADOWS[id];
}

/** Тени листа-черновика. */
export function getDeskDraftShadows(sheet: DeskDraftSheet): DeskObjectShadowPlan {
  return (
    DRAFT_SHADOWS[sheet.id] ??
    (sheet.surface === 'grass'
      ? plan('grass', leftDown(3, 3, 3, 0.5), leftDown(9, 7, 8, 0.36))
      : plan('table', leftDown(3, 2, 2, 0.46), leftDown(8, 6, 7, 0.34)))
  );
}
