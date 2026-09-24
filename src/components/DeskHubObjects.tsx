import { useState, useSyncExternalStore, type CSSProperties, type ReactElement } from 'react';

import { getPlaylistStatus, subscribePlaylistTrack } from '../audio/playlist';
import { CAKE_IMAGES, CAKE_SPRITE_CANVAS, FLAME_SPRITE } from '../constants/cakeAssets';
import { DESK_TEXT } from '../constants/copy';
import { getDraftSheetGrounding } from '../constants/deskDraftSheets';
import { deskHubLayerKey } from '../constants/deskHubObjects';
import {
  getDeskDraftShadows,
  getDeskHubObjectShadows,
  SHADOW_FADE_KNEE,
  SHADOW_FADE_KNEE_OPACITY,
} from '../constants/deskObjectShadows';
import { deskLayerBox, deskShadowClip, type DeskShadowClip } from '../constants/deskSurfaces';
import type { PreloadedImage } from '../hooks/usePreloadedImages';
import type {
  CakeCandlePosition,
  CanvasRect,
  DeskDraftSheet,
  DeskHubComposedLayers,
  DeskHubDecorLayer,
  DeskHubDecorProp,
  DeskHubHoverReveal,
  DeskHubLayerTransform,
  DeskHubObjectId,
  DeskHubObjectLayer,
  DeskHubVinylPlacement,
  DeskEllipseShadow,
  DeskLyingShadow,
  DeskObjectShadowPlan,
  DeskSilhouetteShadow,
  ModalId,
} from '../types';
import { classNames } from '../utils/classNames';
import { groundingToCssVars, type GroundingStyle } from '../utils/deskGrounding';
import styles from './DeskHubObjects.module.css';
import { DraftSheetModal } from './modals/DraftSheetModal';

/** Пропсы {@link DeskHubObjects}. */
export interface DeskHubObjectsProps {
  /** Предметы на столе (см. `src/constants/deskHubObjects.ts`). */
  objects: readonly DeskHubObjectLayer[];
  /** Состояние предзагрузки картинок предметов (у составных — базового слоя). */
  images: Readonly<Record<DeskHubObjectId, PreloadedImage>>;
  /** Состояние предзагрузки внутренних слоёв составных предметов (ключ — `deskHubLayerKey`). */
  layerImages: Readonly<Record<string, PreloadedImage>>;
  /** Декор стола (см. `src/constants/deskHubDecor.ts`): картинки без клика и наведения. */
  decor: readonly DeskHubDecorProp[];
  /** Состояние предзагрузки декора (ключ — его id). */
  decorImages: Readonly<Record<string, PreloadedImage>>;
  /** Листы-черновики (см. `src/constants/deskDraftSheets.ts`): у каждого своя модалка. */
  sheets: readonly DeskDraftSheet[];
  /** Состояние предзагрузки листов (ключ — id листа). */
  sheetImages: Readonly<Record<string, PreloadedImage>>;
  /** Клик по предмету: открыть его модалку. */
  onSelect: (modalId: ModalId) => void;
}

type ObjectStyle = GroundingStyle & Record<'--rest-rotation-deg', string>;
type SheetStyle = ObjectStyle &
  Record<'--sheet-x' | '--sheet-y' | '--sheet-w' | '--sheet-ratio', string>;
type LayerStyle = CSSProperties &
  Record<'--layer-scale' | '--layer-offset-x' | '--layer-offset-y', string>;
type TonearmLayerStyle = LayerStyle &
  Record<'--tonearm-pivot' | '--tonearm-rest-deg' | '--tonearm-hover-deg', string>;
type VinylLayerStyle = CSSProperties &
  Record<
    '--vinyl-center-x' | '--vinyl-center-y' | '--vinyl-diameter' | '--vinyl-tilt' | '--vinyl-persp',
    string
  >;
type RevealStyle = CSSProperties &
  Record<'--reveal-width' | '--reveal-height' | '--reveal-offset-x' | '--reveal-offset-y', string>;
type FlameStyle = CSSProperties & Record<'--flame-delay' | '--flame-aspect', string>;
type DecorStyle = CSSProperties;
type ShadowLayerStyle = CSSProperties &
  Record<
    | '--shadow-ox'
    | '--shadow-oy'
    | '--shadow-blur'
    | '--shadow-opacity'
    | '--shadow-sx'
    | '--shadow-sy'
    | '--shadow-skew',
    string
  >;
type LyingStyle = CSSProperties &
  Record<
    | '--lie-x'
    | '--lie-y'
    | '--lie-angle'
    | '--lie-length'
    | '--lie-depth'
    | '--shadow-blur'
    | '--shadow-opacity',
    string
  >;
type SpotStyle = CSSProperties &
  Record<
    '--spot-x' | '--spot-y' | '--spot-w' | '--spot-h' | '--shadow-blur' | '--shadow-opacity',
    string
  >;

const percent = (value: number): string => `${String(value)}%`;
const deg = (value: number): string => `${String(value)}deg`;

/** Сдвиг и масштаб внутреннего слоя — CSS-переменные для `DeskHubObjects.module.css`. */
function layerStyle({ scale, offsetXPercent, offsetYPercent }: DeskHubLayerTransform): LayerStyle {
  return {
    '--layer-scale': String(scale),
    '--layer-offset-x': percent(offsetXPercent),
    '--layer-offset-y': percent(offsetYPercent),
  };
}

/**
 * Слой пластинки: круг нужного диаметра в нужной точке корпуса плюс наклон и перспектива —
 * CSS-переменные для `DeskHubObjects.module.css`. Сама картинка плоская, вид строго сверху.
 */
function vinylStyle({
  centerXPercent,
  centerYPercent,
  diameterPercent,
  tiltDeg,
  perspectivePx,
}: DeskHubVinylPlacement): VinylLayerStyle {
  return {
    '--vinyl-center-x': percent(centerXPercent),
    '--vinyl-center-y': percent(centerYPercent),
    '--vinyl-diameter': percent(diameterPercent),
    '--vinyl-tilt': deg(tiltDeg),
    '--vinyl-persp': `${String(perspectivePx)}px`,
  };
}

/** Слой тонарма: сдвиг, масштаб, ось и оба угла поворота. Только если тонарм отдельным слоем. */
function tonearmStyle(tonearm: NonNullable<DeskHubComposedLayers['tonearm']>): TonearmLayerStyle {
  return {
    ...layerStyle(tonearm),
    '--tonearm-pivot': `${percent(tonearm.pivotXPercent)} ${percent(tonearm.pivotYPercent)}`,
    '--tonearm-rest-deg': deg(tonearm.restRotationDeg),
    '--tonearm-hover-deg': deg(tonearm.hoverRotationDeg),
  };
}

const isReady = (image: PreloadedImage | undefined): boolean => image?.status === 'ready';

const DEFAULT_HOVER_REVEAL: DeskHubHoverReveal = {
  widthPercent: 200,
  heightPercent: 220,
};

/** Картинка спрайта сдвинута так, что содержимое совпадает с рамкой (как у BirthdayCake). */
function canvasInFrame(
  frame: CanvasRect,
  canvas: { width: number; height: number },
): CSSProperties {
  return {
    left: percent((-frame.x / frame.width) * 100),
    top: percent((-frame.y / frame.height) * 100),
    width: percent((canvas.width / frame.width) * 100),
    height: percent((canvas.height / frame.height) * 100),
  };
}

const FLAME_IMAGE_STYLE = canvasInFrame(FLAME_SPRITE.box, CAKE_SPRITE_CANVAS);

/**
 * Силуэтная тень: сдвиг только влево-вниз, свет — низкое солнце справа. Положительный
 * `skewX` вокруг основания уводит верх тени влево.
 */
function shadowLayerStyle(layer: DeskSilhouetteShadow): ShadowLayerStyle {
  return {
    '--shadow-ox': percent(-Math.abs(layer.offsetXPercent)),
    '--shadow-oy': percent(Math.abs(layer.offsetYPercent)),
    '--shadow-blur': `${String(layer.blurPx)}px`,
    '--shadow-opacity': String(layer.opacity),
    '--shadow-sx': String(layer.scaleX ?? 1),
    '--shadow-sy': String(layer.scaleY ?? 1),
    '--shadow-skew': deg(Math.abs(layer.leanLeftDeg ?? 0)),
  };
}

/** Пятно-отпечаток: центр, размер, размытие и плотность — CSS-переменные для модуля стилей. */
function spotStyle(spot: DeskEllipseShadow): SpotStyle {
  return {
    '--spot-x': percent(spot.centerXPercent),
    '--spot-y': percent(spot.centerYPercent),
    '--spot-w': percent(spot.widthPercent),
    '--spot-h': percent(spot.heightPercent),
    '--shadow-blur': `${String(spot.blurPx)}px`,
    '--shadow-opacity': String(spot.opacity),
  };
}

/**
 * Тень, уложенная на поверхность: центр основания, угол, длина и толщина — CSS-переменные.
 * Угол отрицательный: CSS вращает по часовой, а тень должна уйти верхом влево.
 */
function lyingStyle(shadow: DeskLyingShadow): LyingStyle {
  return {
    '--lie-x': percent(shadow.originXPercent),
    '--lie-y': percent(shadow.originYPercent),
    '--lie-angle': deg(-Math.abs(shadow.angleDeg)),
    '--lie-length': String(shadow.length),
    '--lie-depth': String(shadow.depth),
    '--shadow-blur': `${String(shadow.blurPx)}px`,
    '--shadow-opacity': String(shadow.opacity),
  };
}

/**
 * Два слоя под предметом: падающая, затем контакт. У плоских предметов и «коробок» форма
 * обоих — альфа-канал той же PNG (маска), у предметов на круглом основании — пятна-отпечатки.
 * Цвет — токен поверхности, поэтому тень тёплая, а не чёрная.
 */
function ObjectShadows({
  plan,
  imageSrc,
  clip,
  clipId,
}: {
  plan: DeskObjectShadowPlan;
  imageSrc: string;
  clip: DeskShadowClip | null;
  clipId: string;
}): ReactElement {
  // URL маски — прямо в инлайн-стиле, а не через CSS-переменную: относительный url()
  // в переменной разрешился бы от файла стилей, а не от страницы.
  const silhouette = `url("${imageSrc}")`;
  const maskStyle: CSSProperties = { maskImage: silhouette, WebkitMaskImage: silhouette };
  /**
   * Маска с затуханием: силуэт, пересечённый с градиентом. Реальная тень у предмета
   * темнее всего, а к дальнему концу плавно светлеет — не ступеньками, а непрерывно.
   * Кривая не линейная: от предмета тень держится плотной (полная тень), а гаснет ближе
   * к кончику (полутень) — поэтому посередине стоит опорная точка. Цвет в градиенте
   * не важен, работает только его непрозрачность.
   *
   * @param direction - Направление градиента: от кончика тени к предмету.
   * @param tipPercent - Где кончик тени, % слоя по этому направлению.
   * @param objectPercent - Где край предмета, % слоя.
   */
  const fadingMask = (
    direction: string,
    tipPercent: number,
    objectPercent: number,
  ): CSSProperties => {
    const mid = tipPercent + (objectPercent - tipPercent) * SHADOW_FADE_KNEE;
    const fade = [
      direction,
      `transparent ${percent(tipPercent)}`,
      `color-mix(in srgb, var(--color-ink) ${percent(SHADOW_FADE_KNEE_OPACITY * 100)}, transparent) ${percent(mid)}`,
      `var(--color-ink) ${percent(objectPercent)}`,
    ].join(', ');
    const mask = `${silhouette}, linear-gradient(${fade})`;
    return { maskImage: mask, WebkitMaskImage: mask };
  };
  /**
   * Тень по силуэту вытянута влево от предмета в `scaleX` раз. В её собственных координатах
   * кончик — там, где начинается силуэт (после прозрачного поля слева), а край предмета —
   * на 1 − (1 − поле) / scaleX: между ними тень и гаснет.
   */
  const silhouetteFade = (layer: DeskSilhouetteShadow): CSSProperties => {
    const stretch = layer.scaleX ?? 1;
    if (plan.kind !== 'silhouette' || stretch <= 1) {
      return maskStyle;
    }
    const pad = (plan.leftPadPercent ?? 0) / 100;
    const objectEdge = 1 - (1 - pad) / stretch;
    return fadingMask('to right', pad * 100, objectEdge * 100);
  };
  /** Лежащая тень гаснет от основания (снизу в её координатах) к дальнему концу — к верху силуэта. */
  const lyingFade = (layer: DeskLyingShadow): CSSProperties =>
    fadingMask('to bottom', 0, layer.originYPercent);
  const clipStyle =
    clip === null
      ? undefined
      : { clipPath: clip.kind === 'polygon' ? clip.value : `url(#${clipId})` };

  return (
    <span
      className={styles.shadowClip}
      data-shadow-surface={plan.surface}
      style={clipStyle}
      aria-hidden
    >
      {clip?.kind === 'path' && (
        <svg className={styles.shadowClipSvg} aria-hidden>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d={clip.value} clipRule="evenodd" />
          </clipPath>
        </svg>
      )}
      {/*
        Силуэт вырезается маской на внутреннем элементе, а размытие и прозрачность стоят
        на обёртке: filter у самого элемента выполняется раньше маски, и край силуэта
        остался бы резким, как трафарет. Пятно-эллипс маски не имеет — ему обёртка не нужна.
      */}
      {plan.kind === 'footprint' ? (
        <span className={styles.shadows}>
          <span className={classNames(styles.shadowLayer, styles.cast)} style={lyingStyle(plan.cast)}>
            <span className={styles.shadowLying} style={lyingFade(plan.cast)} />
          </span>
          {plan.core !== undefined && (
            <span
              className={classNames(styles.shadowLayer, styles.cast)}
              style={lyingStyle(plan.core)}
            >
              <span className={styles.shadowLying} style={lyingFade(plan.core)} />
            </span>
          )}
          <span
            className={classNames(styles.shadowSpot, styles.contact)}
            style={spotStyle(plan.contact)}
          />
        </span>
      ) : (
        <span
          className={styles.shadows}
          style={
            plan.baseYPercent === undefined
              ? undefined
              : ({ '--shadow-base': percent(plan.baseYPercent) } as CSSProperties)
          }
        >
          <span
            className={classNames(styles.shadowLayer, styles.cast)}
            style={shadowLayerStyle(plan.cast)}
          >
            <span className={styles.shadowSilhouette} style={silhouetteFade(plan.cast)} />
          </span>
          {plan.core !== undefined && (
            <span
              className={classNames(styles.shadowLayer, styles.cast)}
              style={shadowLayerStyle(plan.core)}
            >
              <span className={styles.shadowSilhouette} style={silhouetteFade(plan.core)} />
            </span>
          )}
          <span
            className={classNames(styles.shadowLayer, styles.contact)}
            style={shadowLayerStyle(plan.contact)}
          >
            <span className={styles.shadowSilhouette} style={maskStyle} />
          </span>
        </span>
      )}
    </span>
  );
}

function revealStyle(reveal: DeskHubHoverReveal): RevealStyle {
  return {
    '--reveal-width': percent(reveal.widthPercent),
    '--reveal-height': percent(reveal.heightPercent),
    '--reveal-offset-x': percent(reveal.offsetXPercent ?? 0),
    '--reveal-offset-y': percent(reveal.offsetYPercent ?? 0),
  };
}

/** Декор: координаты из конфига — центр предмета, поэтому картинка сдвигается на половину себя. */
function decorStyle(prop: DeskHubDecorProp): DecorStyle {
  return {
    left: percent(prop.xPercent),
    top: percent(prop.yPercent),
    width: percent(prop.widthPercent),
    rotate: deg(prop.rotateDeg ?? 0),
  };
}

/**
 * Лист-черновик: координаты — центр листа (как у декора), наклон — постоянный. Центр
 * и ширина уходят в CSS-переменные, а левый верхний угол считает CSS: так листу не нужен
 * translate, который изолировал бы наложение его тени (см. `.sheet`).
 *
 * @param sheet - Лист из конфига.
 * @param imageRatio - Пропорции его картинки: высота / ширина.
 */
function sheetStyle(sheet: DeskDraftSheet, imageRatio: number): SheetStyle {
  return {
    ...groundingToCssVars(getDraftSheetGrounding(sheet)),
    '--sheet-x': percent(sheet.xPercent),
    '--sheet-y': percent(sheet.yPercent),
    '--sheet-w': percent(sheet.widthPercent),
    '--sheet-ratio': String(imageRatio),
    '--rest-rotation-deg': deg(sheet.rotateDeg),
  };
}

/** Пропсы {@link DeskHubDecorLayerImages}. */
interface DeskHubDecorLayerImagesProps {
  decor: readonly DeskHubDecorProp[];
  images: Readonly<Record<string, PreloadedImage>>;
  layer: DeskHubDecorLayer;
}

/**
 * Один слой декора: картинки без клика и наведения. Слой `below` рисуется до кнопок
 * предметов, `above` — после них. Декор, чья картинка ещё не загрузилась или отсутствует,
 * просто не рендерится.
 */
function DeskHubDecorLayerImages({
  decor,
  images,
  layer,
}: DeskHubDecorLayerImagesProps): ReactElement {
  return (
    <>
      {decor.map((prop) =>
        prop.layer === layer && isReady(images[prop.id]) ? (
          <img
            key={prop.id}
            className={styles.decor}
            src={prop.imageSrc}
            alt=""
            aria-hidden
            style={decorStyle(prop)}
            decoding="async"
            draggable={false}
            data-desk-decor={prop.id}
            data-decor-layer={layer}
          />
        ) : null,
      )}
    </>
  );
}

/**
 * Огонь свечи: высота — доля высоты предмета, ширина — по пропорциям самого пламени
 * (`aspect-ratio`), поэтому огонь не растягивается на слоях любой формы.
 */
function flameStyle(candle: CakeCandlePosition): FlameStyle {
  const scale = candle.scale ?? 1;
  return {
    left: percent(candle.xPercent),
    top: percent(candle.yPercent),
    height: percent(20 * scale),
    '--flame-aspect': `${String(FLAME_SPRITE.box.width)} / ${String(FLAME_SPRITE.box.height)}`,
    '--flame-delay': `${String(candle.flickerDelayMs)}ms`,
  };
}

/**
 * Предметы на столе стадии HUB: каждый — кнопка, позиционируется в процентах от кадра
 * стадии (от картинки стола). Если предмет уже нарисован на фоне (`paintedInBackdrop`),
 * кнопка — невидимый хитбокс с `heightPercent`; своей PNG поверх нет.
 * Иначе высота берётся из пропорций картинки предмета.
 *
 * При наведении и клавиатурном фокусе предмет реагирует по своему `hoverStyle` и светится —
 * чистый CSS. Стили `lift-*` приподнимают весь предмет; `crossfade-open` приподнимает его
 * и перетекает из закрытой картинки в открытую (`imageSrcOpen`); у составного предмета со
 * стилем `tonearm-swing` (проигрыватель: корпус, пластинка и тонарм отдельными слоями)
 * предмет стоит на месте, а тонарм поворачивается вокруг своей оси к пластинке;
 * `light-candles` зажигает огни на фитилях; `stack-sway` покачивает стопку пластинок. Предмет с `restRotationDeg` постоянно лежит
 * под этим углом, в том числе когда открывается. При `prefers-reduced-motion` предметы не
 * двигаются: открытая картинка, огни и новое положение тонарма появляются без анимации.
 * Нарисованный на фоне предмет сам не двигается — двигается только оверлей (открытая
 * картинка или огни).
 *
 * Кнопка предмета — три уровня: `shadows` (контакт и падающая тень на поверхности),
 * затем `content` с картинкой. Наклон покоя общий, чтобы тень лежала под силуэтом.
 * При подъёме картинка уезжает вверх, а тени остаются на столе: контакт слабеет,
 * падающая чуть отделяется влево-вниз.
 *
 * Порядок наложения: декор слоя `below` → листы-черновики → кнопки предметов → декор слоя
 * `above`; предмет с `zIndexOverride` встаёт поверх соседей независимо от этого порядка.
 * Декор кликов не перехватывает ни в том, ни в другом слое; листы — кнопки со своими
 * модалками (`sheets`, состояние `openDraftId` здесь же), реагируют на наведение как бумага.
 * Координаты декора и листов — центр картинки, у предметов — левый верхний угол.
 *
 * Предмет без `paintedInBackdrop`, чья (базовая) картинка ещё не загрузилась или отсутствует,
 * не рендерится — остальные остаются на своих местах. Без картинки пластинки или тонарма
 * не рендерится только этот слой; без открытой картинки предмет при наведении остаётся
 * закрытым.
 */
export function DeskHubObjects({
  objects,
  images,
  layerImages,
  decor,
  decorImages,
  sheets,
  sheetImages,
  onSelect,
}: DeskHubObjectsProps): ReactElement {
  const [openDraftId, setOpenDraftId] = useState<string | null>(null);
  const openSheet = sheets.find((sheet) => sheet.id === openDraftId) ?? null;
  const playlistStatus = useSyncExternalStore(subscribePlaylistTrack, getPlaylistStatus);
  const isVinylSpinning = playlistStatus === 'playing';

  return (
    <div className={styles.layer} role="group" aria-label={DESK_TEXT.objectsLabel}>
      <DeskHubDecorLayerImages decor={decor} images={decorImages} layer="below" />
      {sheets.map((sheet) => {
        const sheetImage = sheetImages[sheet.id];
        if (sheetImage?.status !== 'ready') {
          return null;
        }
        const sheetPlan = getDeskDraftShadows(sheet);
        const sheetBox = deskLayerBox({
          xPercent: sheet.xPercent,
          yPercent: sheet.yPercent,
          widthPercent: sheet.widthPercent,
          imageWidth: sheetImage.width,
          imageHeight: sheetImage.height,
          origin: 'center',
        });
        return (
          <button
            key={sheet.id}
            type="button"
            className={classNames(styles.object, styles.sheet)}
            style={sheetStyle(sheet, sheetImage.height / sheetImage.width)}
            data-desk-draft={sheet.id}
            data-hover-style="lift-wiggle"
            data-surface={sheet.surface}
            aria-label={sheet.label}
            onClick={() => {
              setOpenDraftId(sheet.id);
            }}
          >
            <ObjectShadows
              plan={sheetPlan}
              imageSrc={sheet.imageSrc}
              clipId={`desk-shadow-${sheet.id}`}
              clip={sheetBox === null ? null : deskShadowClip(sheetPlan.surface, sheetBox)}
            />
            <span className={styles.content}>
              <img
                className={styles.image}
                src={sheet.imageSrc}
                alt=""
                decoding="async"
                draggable={false}
              />
            </span>
          </button>
        );
      })}
      {objects.map((object) => {
        const image = images[object.id];
        const isPaintedInBackdrop = object.paintedInBackdrop === true;
        if (!isPaintedInBackdrop && image.status !== 'ready') {
          return null;
        }
        const style: ObjectStyle = {
          ...groundingToCssVars(object.grounding),
          left: percent(object.xPercent),
          top: percent(object.yPercent),
          width: percent(object.widthPercent),
          ...(isPaintedInBackdrop && object.heightPercent !== undefined
            ? { height: percent(object.heightPercent) }
            : {}),
          // Порядок наложения обычно задаёт массив; здесь — явное исключение из конфига.
          // Уходит в картинку предмета, а не на кнопку: z-index кнопки изолировал бы тень.
          ...(object.zIndexOverride === undefined
            ? {}
            : { '--content-z': String(object.zIndexOverride) }),
          '--rest-rotation-deg': deg(object.restRotationDeg ?? 0),
        };
        const baseImage =
          image.status === 'ready' ? (
            <img
              className={styles.image}
              src={object.imageSrc}
              alt=""
              width={image.width}
              height={image.height}
              decoding="async"
              draggable={false}
            />
          ) : null;
        const { layers, imageSrcOpen, candles } = object;
        const isOpenImageReady = isReady(layerImages[deskHubLayerKey(object.id, 'open')]);
        const areFlamesReady = isReady(layerImages[deskHubLayerKey(object.id, 'flame')]);
        const flames =
          areFlamesReady && candles !== undefined
            ? candles.map((candle) => (
                <span
                  key={candle.id}
                  className={styles.deskFlame}
                  style={flameStyle(candle)}
                  data-desk-object-layer="flame"
                >
                  <img
                    className={styles.deskFlameImage}
                    src={CAKE_IMAGES.flame}
                    alt=""
                    style={FLAME_IMAGE_STYLE}
                    decoding="async"
                    draggable={false}
                  />
                </span>
              ))
            : null;
        const paintedHover =
          isPaintedInBackdrop && isOpenImageReady && imageSrcOpen !== undefined ? (
            <img
              className={styles.hoverReveal}
              src={imageSrcOpen}
              alt=""
              style={revealStyle(object.hoverReveal ?? DEFAULT_HOVER_REVEAL)}
              decoding="async"
              draggable={false}
              data-desk-object-layer="open"
            />
          ) : (
            flames
          );
        const objectPlan = getDeskHubObjectShadows(object.id);
        const objectBox = deskLayerBox({
          xPercent: object.xPercent,
          yPercent: object.yPercent,
          widthPercent: object.widthPercent,
          heightPercent: object.heightPercent,
          imageWidth: image.status === 'ready' ? image.width : undefined,
          imageHeight: image.status === 'ready' ? image.height : undefined,
          origin: 'top-left',
        });
        return (
          <button
            key={object.id}
            type="button"
            className={styles.object}
            style={style}
            data-desk-object={object.id}
            data-hover-style={object.hoverStyle}
            data-painted-in-backdrop={isPaintedInBackdrop || undefined}
            aria-label={object.label}
            onClick={() => {
              onSelect(object.modalId);
            }}
          >
            <ObjectShadows
              plan={objectPlan}
              imageSrc={object.imageSrc}
              clipId={`desk-shadow-${object.id}`}
              clip={objectBox === null ? null : deskShadowClip(objectPlan.surface, objectBox)}
            />
            <span className={styles.content}>
              {isPaintedInBackdrop && layers ? (
                // Корпус/тонарм уже на фоне — рисуем только пластинку в хитбоксе.
                <span className={styles.composed}>
                  {isReady(layerImages[deskHubLayerKey(object.id, 'vinyl')]) && (
                    <span
                      className={styles.vinylLayer}
                      style={vinylStyle(layers.vinyl)}
                      data-desk-vinyl={object.id}
                    >
                      <img
                        className={styles.vinylDisc}
                        src={layers.vinylSrc}
                        alt=""
                        decoding="async"
                        draggable={false}
                        data-desk-object-layer="vinyl"
                        data-spinning={isVinylSpinning ? 'true' : 'false'}
                      />
                    </span>
                  )}
                </span>
              ) : isPaintedInBackdrop ? (
                paintedHover
              ) : layers ? (
                <span className={styles.composed}>
                  {baseImage}
                  {isReady(layerImages[deskHubLayerKey(object.id, 'vinyl')]) && (
                    <span
                      className={styles.vinylLayer}
                      style={vinylStyle(layers.vinyl)}
                      data-desk-vinyl={object.id}
                    >
                      <img
                        className={styles.vinylDisc}
                        src={layers.vinylSrc}
                        alt=""
                        decoding="async"
                        draggable={false}
                        data-desk-object-layer="vinyl"
                        data-spinning={isVinylSpinning ? 'true' : 'false'}
                      />
                    </span>
                  )}
                  {layers.tonearmSrc !== undefined &&
                    layers.tonearm !== undefined &&
                    isReady(layerImages[deskHubLayerKey(object.id, 'tonearm')]) && (
                      <img
                        className={styles.tonearmLayer}
                        src={layers.tonearmSrc}
                        alt=""
                        style={tonearmStyle(layers.tonearm)}
                        decoding="async"
                        draggable={false}
                        data-desk-object-layer="tonearm"
                        data-playing={isVinylSpinning ? 'true' : 'false'}
                      />
                    )}
                  {flames}
                </span>
              ) : imageSrcOpen === undefined ? (
                // Огни зажигаются на фитилях самой картинки, поэтому она задаёт им холст.
                <span className={styles.composed}>
                  {baseImage}
                  {flames}
                </span>
              ) : (
                // crossfade-open: закрытая картинка в потоке задаёт размер, открытая лежит поверх.
                <span className={styles.crossfade} data-has-open={isOpenImageReady}>
                  {baseImage}
                  {isOpenImageReady && (
                    <img
                      className={styles.openImage}
                      src={imageSrcOpen}
                      alt=""
                      decoding="async"
                      draggable={false}
                      data-desk-object-layer="open"
                    />
                  )}
                </span>
              )}
            </span>
          </button>
        );
      })}
      <DeskHubDecorLayerImages decor={decor} images={decorImages} layer="above" />
      <DraftSheetModal
        sheet={openSheet}
        onClose={() => {
          setOpenDraftId(null);
        }}
      />
    </div>
  );
}
