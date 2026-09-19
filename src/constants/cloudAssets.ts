import type { CloudImageId, CloudPlacement, CloudSide } from '../types';
import { assetUrl } from '../utils/assetUrl';
import { ASSET_DIRECTORIES } from './assets';

/**
 * Пять картинок облаков (PNG с прозрачностью, обрезанные по содержимому).
 * Общие для облачной шторки intro (`IntroCloudCover`), облачных переходов
 * (`CloudTransitionLayer`: между сценами и между стадиями сцены Desk) и облаков
 * фона-неба сцен (`SkyAmbientBackdrop`).
 */
export const CLOUD_IMAGES: Readonly<Record<CloudImageId, string>> = {
  'cloud-01': assetUrl(`${ASSET_DIRECTORIES.images}/clouds/cloud-01.png`),
  'cloud-02': assetUrl(`${ASSET_DIRECTORIES.images}/clouds/cloud-02.png`),
  'cloud-03': assetUrl(`${ASSET_DIRECTORIES.images}/clouds/cloud-03.png`),
  'cloud-04': assetUrl(`${ASSET_DIRECTORIES.images}/clouds/cloud-04.png`),
  'cloud-05': assetUrl(`${ASSET_DIRECTORIES.images}/clouds/cloud-05.png`),
};

/** Порядок групп в разметке: правая рисуется поверх левой в зоне перекрытия у центра. */
export const CLOUD_SIDES = ['left', 'right'] as const satisfies readonly CloudSide[];

/**
 * Раскладка закрытой шторки: по три «ряда» облаков у края экрана и по два облака
 * ближе к центру, чтобы группы перекрывались посередине. Правая группа — зеркальная
 * (отражённые картинки), так пять файлов дают десять разных облаков.
 * Порядок в массиве — порядок наложения (последнее — ближе к зрителю).
 */
export const CLOUD_CURTAIN_LAYOUT: Readonly<Record<CloudSide, readonly CloudPlacement[]>> = {
  left: [
    { id: 'left-top', image: 'cloud-02', leftVw: -16, topVh: -20, widthVw: 64, flipped: false },
    { id: 'left-middle', image: 'cloud-04', leftVw: -22, topVh: 24, widthVw: 60, flipped: false },
    { id: 'left-bottom', image: 'cloud-01', leftVw: -12, topVh: 62, widthVw: 64, flipped: false },
    { id: 'left-inner-top', image: 'cloud-05', leftVw: 24, topVh: 4, widthVw: 44, flipped: false },
    {
      id: 'left-inner-bottom',
      image: 'cloud-03',
      leftVw: 20,
      topVh: 44,
      widthVw: 46,
      flipped: false,
    },
  ],
  right: [
    { id: 'right-top', image: 'cloud-04', leftVw: 52, topVh: -22, widthVw: 64, flipped: true },
    { id: 'right-middle', image: 'cloud-01', leftVw: 60, topVh: 22, widthVw: 62, flipped: true },
    { id: 'right-bottom', image: 'cloud-02', leftVw: 48, topVh: 60, widthVw: 64, flipped: true },
    { id: 'right-inner-top', image: 'cloud-03', leftVw: 32, topVh: 6, widthVw: 46, flipped: true },
    {
      id: 'right-inner-bottom',
      image: 'cloud-05',
      leftVw: 34,
      topVh: 46,
      widthVw: 44,
      flipped: true,
    },
  ],
};

/**
 * Насколько облако уезжает за край экрана в раскрытом состоянии, vw.
 * Больше самой широкой раскладки с запасом на мягкое свечение по краям.
 */
export const CLOUD_OFFSCREEN_SHIFT_VW = 115;
