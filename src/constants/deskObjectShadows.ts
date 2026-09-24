import type {
  DeskDraftSheet,
  DeskEllipseShadow,
  DeskFootprintShadowPlan,
  DeskHubObjectId,
  DeskLyingShadow,
  DeskObjectShadowPlan,
  DeskShadowSurface,
  DeskSilhouetteShadow,
  DeskSilhouetteShadowPlan,
} from '../types';

/**
 * Тени предметов стола. Свет — низкое тёплое солнце справа, поэтому тени лежат слева-снизу
 * от предметов; цвет у них не чёрный, а тёплый, свой у каждой поверхности (`--desk-shadow-*`
 * в tokens.css). Обрезка по столу / газону / стулу — в `deskSurfaces.ts`, не здесь.
 *
 * Тень состоит из двух слоёв, как на референсе сцены:
 * - контакт — плотная тёмная кромка у самой поверхности: она «ставит» предмет на стол;
 * - падающая — мягкая и светлее, уходит влево-вниз и быстро гаснет.
 *
 * Плоские предметы и «коробки» (книга, проигрыватель, стопка пластинок) тенятся по своему
 * силуэту: он чуть выглядывает из-под краёв, без зазора. У предметов на круглом основании
 * (торт, ваза) дно — дуга, поэтому их тень — отпечаток: мягкое пятно с центром внутри
 * основания, в которое утоплен нижний край предмета. Иначе они кажутся висящими.
 *
 * Числа у каждого предмета подобраны по живому кадру — не сдвигать без явной просьбы.
 */

/**
 * Кривая затухания тени от предмета к кончику. Опорная точка стоит на этой доле пути
 * от кончика к предмету…
 */
export const SHADOW_FADE_KNEE = 0.45;

/**
 * …и в ней тень уже на этой доле своей плотности. Кривая выпуклая: у предмета тень почти
 * ровная и плотная (полная тень), а гаснет у кончика (полутень), — так и выглядит тень
 * от солнца. При линейном затухании тень бледнела бы уже у самого предмета.
 */
export const SHADOW_FADE_KNEE_OPACITY = 0.75;

/** Контакт: силуэт чуть выглядывает из-под нижнего и левого края — тёмная кромка. */
const edge = (x: number, y: number, blurPx: number, opacity: number): DeskSilhouetteShadow => ({
  offsetXPercent: -Math.abs(x),
  offsetYPercent: Math.abs(y),
  blurPx,
  opacity,
});

/**
 * Падающая тень: тот же силуэт, уведённый влево-вниз. `squash` < 1 прижимает её
 * к основанию. `stretch` > 1 вытягивает тень влево от правого края предмета: она
 * длинная, как от низкого солнца, и повторяет левый контур предмета, а не стоит рядом
 * его сдвинутой копией. Растяжение идёт от середины, поэтому правый край возвращается
 * на место дополнительным сдвигом на половину прироста.
 */
const fall = (
  x: number,
  y: number,
  squash: number,
  blurPx: number,
  opacity: number,
  stretch = 1,
): DeskSilhouetteShadow => ({
  offsetXPercent: -(Math.abs(x) + (stretch - 1) * 50),
  offsetYPercent: Math.abs(y),
  blurPx,
  opacity,
  scaleX: stretch,
  scaleY: squash,
});

/** Пятно-эллипс: центр, ширина и высота в процентах слоя предмета. */
const spot = (
  centerXPercent: number,
  centerYPercent: number,
  widthPercent: number,
  heightPercent: number,
  blurPx: number,
  opacity: number,
): DeskEllipseShadow => ({
  centerXPercent,
  centerYPercent,
  widthPercent,
  heightPercent,
  blurPx,
  opacity,
});

/**
 * Тень, уложенная на поверхность: силуэт поворачивается вокруг центра основания
 * (`x`, `y`, % слоя) на `angleDeg` влево, укорачивается до `length` своей высоты
 * и сплющивается до `depth` своей ширины.
 */
const lying = (
  x: number,
  y: number,
  length: number,
  depth: number,
  angleDeg: number,
  blurPx: number,
  opacity: number,
): DeskLyingShadow => ({
  originXPercent: x,
  originYPercent: y,
  length,
  depth,
  angleDeg,
  blurPx,
  opacity,
});

/**
 * Тень по силуэту в три слоя, от предмета наружу: резкая тёмная кромка у поверхности,
 * ядро (короче и чётче) и мягкий хвост. Так тень, как настоящая, тёмная и чёткая у предмета
 * и расплывается к концу.
 */
const plan = (
  surface: DeskShadowSurface,
  contact: DeskSilhouetteShadow,
  core: DeskSilhouetteShadow,
  cast: DeskSilhouetteShadow,
  baseYPercent?: number,
  leftPadPercent?: number,
): DeskSilhouetteShadowPlan => ({
  kind: 'silhouette',
  surface,
  contact,
  core,
  cast,
  baseYPercent,
  leftPadPercent,
});

/** Отпечаток под круглым основанием и лежащая тень: ядро у предмета и мягкий хвост. */
const footprint = (
  surface: DeskShadowSurface,
  contact: DeskEllipseShadow,
  core: DeskLyingShadow,
  cast: DeskLyingShadow,
): DeskFootprintShadowPlan => ({ kind: 'footprint', surface, contact, core, cast });

/**
 * Смятая бумажка. На референсе её тень — тёмное пятно влево от основания примерно
 * на половину её ширины (ядро ~¼ ширины, дальше мягкий переход), в нижней половине комка.
 */
const crumpled = (surface: DeskShadowSurface): DeskObjectShadowPlan =>
  plan(
    surface,
    edge(1, 2, 1.5, 0.85),
    fall(0, 2, 0.6, 3, 0.62, 1.25),
    fall(0, 3, 0.55, 6, 0.38, 1.5),
  );

/** Плоский лист: тень едва выглядывает из-под краёв. */
const sheet = (surface: DeskShadowSurface): DeskObjectShadowPlan =>
  plan(
    surface,
    edge(0.6, 1.5, 1.2, 0.6),
    fall(1, 2.5, 1, 3, 0.3, 1.04),
    fall(1.5, 4, 1, 8, 0.2, 1.08),
  );

/*
 * Основания и поля сняты по альфа-каналу картинок (ширина силуэта по строкам снизу вверх).
 * Торт (`cake-on-desk.png`): передняя точка дна на 79,2 % высоты, по бокам дуга поднимается
 * до ~65 % при ширине ~70 % (x 18…88 %) — центр основания около (53 %; 66 %).
 * Ваза (`rose-vase.png`): ножка шириной ~32 %, дуга от 99,8 % до ~95 % — центр (49,7 %; 96 %).
 * Под корпусом проигрывателя 10 % пустого поля — отсюда его основание на 90 %.
 * Пустые поля слева: у проигрывателя 9,1 %, у книги 17,5 %, у письма 26,3 %; остальные
 * картинки обрезаны по предмету.
 */
const OBJECT_SHADOWS: Readonly<Record<DeskHubObjectId, DeskObjectShadowPlan>> = {
  cake: footprint(
    'table',
    spot(51, 67, 78, 30, 6, 0.9),
    lying(53, 66, 0.7, 0.55, 100, 4, 0.55),
    lying(53, 66, 0.9, 0.55, 100, 9, 0.35),
  ),
  'rose-vase': footprint(
    'table',
    spot(48.5, 96, 42, 11, 4, 0.9),
    lying(49.7, 96, 0.4, 0.35, 100, 3, 0.55),
    lying(49.7, 96, 0.75, 0.35, 100, 9, 0.35),
  ),
  // Замер референса: тень вдоль левого бока ~18 % ширины корпуса, стол темнеет ~×0,65.
  turntable: plan(
    'table',
    edge(1, 2, 1.5, 0.85),
    fall(0.5, 2, 0.95, 3, 0.66, 1.18),
    fall(1, 3, 0.95, 8, 0.32, 1.3),
    90,
    9.1,
  ),
  // У книги — чёткая тёмная полоса у корешка ~11 % ширины (×0,6), переход в свет ~6 px.
  book: plan(
    'table',
    edge(1, 1.5, 1.5, 0.85),
    fall(0.5, 2, 1, 2, 0.75, 1.12),
    fall(1, 3, 1, 5, 0.3, 1.18),
    undefined,
    17.5,
  ),
  // Тонкие предметы: у них тень — чёткая тёмная полоска прямо под ними, как на референсе.
  'colored-pencils': plan(
    'table',
    edge(0.8, 5, 1, 0.75),
    fall(1.5, 8, 1, 2.5, 0.35),
    fall(3, 12, 1, 6, 0.2),
  ),
  'fountain-pen': plan(
    'table',
    edge(0.8, 5, 1, 0.75),
    fall(1.5, 8, 1, 2.5, 0.35),
    fall(3, 12, 1, 6, 0.2),
  ),
  letter: plan(
    'chair',
    edge(1, 2.5, 1.5, 0.75),
    fall(1.5, 4, 1, 3, 0.35, 1.05),
    fall(2, 7, 1, 8, 0.25, 1.12),
    undefined,
    26.3,
  ),
  // На траве у стопки на референсе тень ~20 % ширины влево.
  'vinyl-stack': plan(
    'grass',
    edge(1, 2, 2, 0.85),
    fall(0.5, 2, 0.95, 4, 0.58, 1.18),
    fall(1, 3, 0.95, 10, 0.32, 1.32),
  ),
};

const DRAFT_SHADOWS: Readonly<Record<string, DeskObjectShadowPlan>> = {
  'draft-1': crumpled('table'),
  'draft-2': sheet('table'),
  'draft-3': plan(
    'table',
    edge(0.6, 1.5, 1.2, 0.6),
    fall(1, 2.5, 1, 3, 0.3, 1.03),
    fall(1.5, 3.5, 1, 9, 0.2, 1.06),
  ),
  'draft-4': crumpled('grass'),
  'draft-5': crumpled('grass'),
  'draft-6': crumpled('grass'),
  'draft-7': crumpled('grass'),
};

/** Тени кликабельного предмета стола. */
export function getDeskHubObjectShadows(id: DeskHubObjectId): DeskObjectShadowPlan {
  return OBJECT_SHADOWS[id];
}

/** Тени листа-черновика: свои, а для нового листа — как у плоского листа на его поверхности. */
export function getDeskDraftShadows(draft: DeskDraftSheet): DeskObjectShadowPlan {
  return DRAFT_SHADOWS[draft.id] ?? sheet(draft.surface);
}
