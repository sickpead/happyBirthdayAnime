import type { CSSProperties, ReactElement, ReactNode } from 'react';

import { DESK_TEXT } from '../constants/copy';
import {
  DESK_ASSET_DIRECTORY,
  DESK_STAGE_FALLBACK_ASPECT_RATIO,
} from '../constants/deskZoomStages';
import type { PreloadedImage } from '../hooks/usePreloadedImages';
import type { DeskZoomStage } from '../types';
import styles from './DeskStageFrame.module.css';

/** Пропсы {@link DeskStageFrame}. */
export interface DeskStageFrameProps {
  /** Стадия, чью картинку показывает кадр. */
  stage: DeskZoomStage;
  /** Состояние предзагрузки картинки стадии. */
  image: PreloadedImage;
  /**
   * Кадр монтируется невидимым и ждёт своей анимации появления (первая стадия
   * и следующая стадия при перетекании).
   */
  initiallyHidden: boolean;
  /** Содержимое поверх картинки в процентах от неё (например, предметы на столе). */
  children?: ReactNode;
}

type FrameStyle = CSSProperties & Record<'--frame-aspect-ratio', string>;

/** Имя файла из URL: `…/desk/garden-wide.jpg` → `garden-wide.jpg`. */
const fileNameOf = (url: string): string => url.slice(url.lastIndexOf('/') + 1);

/**
 * Кадр стадии сцены Desk: полноэкранная картинка по принципу `object-fit: cover` —
 * заполняет экран целиком, лишнее обрезается поровну с двух сторон.
 *
 * Сам кадр имеет пропорции картинки и растянут так, чтобы закрыть сцену, поэтому проценты
 * внутри него — это проценты картинки: предметы на столе и точка зума остаются на своих
 * местах при любых пропорциях окна. Пока файла нет — однотонный плейсхолдер той же формы
 * с подписью стадии (WIDE / MEDIUM / CLOSE / HUB).
 */
export function DeskStageFrame({
  stage,
  image,
  initiallyHidden,
  children,
}: DeskStageFrameProps): ReactElement {
  const aspectRatio =
    image.status === 'ready' ? image.width / image.height : DESK_STAGE_FALLBACK_ASPECT_RATIO;
  const style: FrameStyle = { '--frame-aspect-ratio': String(aspectRatio) };
  const alt = DESK_TEXT.stageAlt[stage.id];

  return (
    <div
      className={styles.frame}
      style={style}
      data-desk-frame={stage.id}
      data-initially-hidden={initiallyHidden}
    >
      {image.status === 'missing' ? (
        <div className={styles.placeholder} data-stage={stage.id} role="img" aria-label={alt}>
          <span className={styles.placeholderLabel}>{stage.id.toUpperCase()}</span>
          <span className={styles.placeholderHint}>
            {DESK_TEXT.missingImage(`public/${DESK_ASSET_DIRECTORY}/${fileNameOf(stage.imageSrc)}`)}
          </span>
        </div>
      ) : (
        <img
          className={styles.image}
          src={stage.imageSrc}
          alt={alt}
          decoding="async"
          draggable={false}
        />
      )}
      {children}
    </div>
  );
}
