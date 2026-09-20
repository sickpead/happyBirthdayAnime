import type { DeskDraftSheet, DeskHubGrounding } from '../types';
import { assetUrl } from '../utils/assetUrl';
import { DEFAULT_DESK_HUB_GROUNDING } from '../utils/deskGrounding';
import { DESK_DECOR_DIRECTORY } from './deskHubDecor';

/**
 * Листы-черновики стадии HUB: смятые бумажки, развёрнутая карта истории и стопка чистых
 * листов, разбросанные по столу и по траве. Каждый лист — своя кнопка и своя модалка
 * со своим содержимым (`modal`), поэтому их не путать с декором из `deskHubDecor.ts`:
 * тот только для атмосферы.
 *
 * `xPercent` / `yPercent` — **центр** листа в процентах картинки стола (как у декора),
 * `widthPercent` — ширина в процентах её ширины, высота — по пропорциям PNG, `rotateDeg` —
 * наклон. `surface` влияет только на тень: в траве она мягче и зеленее. Порядок в массиве —
 * порядок обхода клавишей Tab и наложения: последний лист лежит сверху.
 *
 * Раскладка подгоняется на глаз, код менять не нужно: откройте стадию с `?layout=1`
 * (см. README) и перетащите листы мышью.
 *
 * Содержимое модалок пока плейсхолдеры: у каждого листа свой заголовок и подпись,
 * `images` пустой. Добавить картинки — положить файлы в `public/assets/images/` и вписать
 * их сюда через `assetUrl`.
 */
export const DESK_DRAFT_SHEETS: readonly DeskDraftSheet[] = [
  {
    id: 'draft-1',
    label: 'Черновик: первый набросок',
    imageSrc: assetUrl(`${DESK_DECOR_DIRECTORY}/scrap-paper-1.png`),
    xPercent: 42.7,
    yPercent: 23,
    widthPercent: 3.2,
    rotateDeg: -15,
    surface: 'table',
    modal: {
      title: 'Черновик №1',
      images: [],
      caption: 'Скоро здесь будет первый набросок.',
    },
  },
  {
    id: 'draft-2',
    label: 'Черновик: карта истории',
    imageSrc: assetUrl(`${DESK_DECOR_DIRECTORY}/story-map.png`),
    xPercent: 75.9,
    yPercent: 39,
    widthPercent: 12.9,
    rotateDeg: 12,
    surface: 'table',
    modal: {
      title: 'Черновик №2',
      images: [],
      caption: 'Скоро здесь будет карта истории.',
    },
  },
  {
    id: 'draft-3',
    label: 'Черновик: стопка листов',
    imageSrc: assetUrl(`${DESK_DECOR_DIRECTORY}/paper-fan.png`),
    xPercent: 25.5,
    yPercent: 36.1,
    widthPercent: 19.5,
    rotateDeg: 6,
    surface: 'table',
    modal: {
      title: 'Черновик №3',
      images: [],
      caption: 'Скоро здесь будет стопка неудачных страниц.',
    },
  },
  {
    id: 'draft-4',
    label: 'Черновик: смятая попытка',
    imageSrc: assetUrl(`${DESK_DECOR_DIRECTORY}/scrap-paper-2.png`),
    xPercent: 11.2,
    yPercent: 71,
    widthPercent: 4.6,
    rotateDeg: -8,
    surface: 'grass',
    modal: {
      title: 'Черновик №4',
      images: [],
      caption: 'Скоро здесь будет смятая попытка.',
    },
  },
  {
    id: 'draft-5',
    label: 'Черновик: зачёркнутая страница',
    imageSrc: assetUrl(`${DESK_DECOR_DIRECTORY}/scrap-paper-3.png`),
    xPercent: 26.3,
    yPercent: 82.2,
    widthPercent: 8.9,
    rotateDeg: 18,
    surface: 'grass',
    modal: {
      title: 'Черновик №5',
      images: [],
      caption: 'Скоро здесь будет зачёркнутая страница.',
    },
  },
  {
    id: 'draft-6',
    label: 'Черновик: выброшенный лист',
    imageSrc: assetUrl(`${DESK_DECOR_DIRECTORY}/scrap-paper-1.png`),
    xPercent: 30.9,
    yPercent: 66.1,
    widthPercent: 3.6,
    rotateDeg: -20,
    surface: 'grass',
    modal: {
      title: 'Черновик №6',
      images: [],
      caption: 'Скоро здесь будет выброшенный лист.',
    },
  },
  {
    id: 'draft-7',
    label: 'Черновик: последняя попытка',
    imageSrc: assetUrl(`${DESK_DECOR_DIRECTORY}/scrap-paper-2.png`),
    xPercent: 67.3,
    yPercent: 63.8,
    widthPercent: 4.5,
    rotateDeg: 10,
    surface: 'grass',
    modal: {
      title: 'Черновик №7',
      images: [],
      caption: 'Скоро здесь будет последняя попытка.',
    },
  },
];

/**
 * Цветокоррекция листа: своя из конфига, а если её нет — общая, та же, что у предметов стола.
 *
 * @param sheet - Лист-черновик.
 * @returns Настройки для `groundingToCssVars`.
 */
export function getDraftSheetGrounding(sheet: DeskDraftSheet): DeskHubGrounding {
  return sheet.grounding ?? DEFAULT_DESK_HUB_GROUNDING;
}

/** URL картинок листов по их id — для предзагрузки. */
export const DESK_DRAFT_SHEET_SOURCES: Readonly<Record<string, string>> = Object.fromEntries(
  DESK_DRAFT_SHEETS.map((sheet): readonly [string, string] => [sheet.id, sheet.imageSrc]),
);
