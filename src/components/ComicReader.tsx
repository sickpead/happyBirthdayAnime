import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react';

import { COMIC_TEXT } from '../constants/copy';
import { KEYS } from '../constants/keyboard';
import { useKeyDown } from '../hooks/useKeyDown';
import type { ComicPage } from '../types';
import styles from './ComicReader.module.css';

/** Пропсы {@link ComicReader}. */
export interface ComicReaderProps {
  /** Страницы по порядку чтения (см. `src/constants/comicPages.ts`). */
  pages: readonly ComicPage[];
  /** Открытая страница — индекс в `pages`. */
  pageIndex: number;
  /** Листание: читалка сама не хранит номер страницы, чтобы он пережил закрытие модалки. */
  onPageChange: (pageIndex: number) => void;
}

/** Масштаб страницы и сдвиг её центра, px. */
interface PageView {
  zoom: number;
  x: number;
  y: number;
}

const FIT_VIEW: PageView = { zoom: 1, x: 0, y: 0 };

/** Границы и шаг приближения колесом. */
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.15;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/** Не даёт утащить приближённую страницу за пределы рамки. */
function clampOffset(view: PageView, frame: HTMLElement): PageView {
  const maxX = (frame.clientWidth * (view.zoom - 1)) / 2;
  const maxY = (frame.clientHeight * (view.zoom - 1)) / 2;
  return { zoom: view.zoom, x: clamp(view.x, -maxX, maxX), y: clamp(view.y, -maxY, maxY) };
}

type PageStyle = CSSProperties;

/**
 * Листалка комикса: одна страница на экране, кнопки «назад/вперёд», счётчик и стрелки
 * на клавиатуре. Страницы разного размера и пропорций, поэтому картинка вписывается
 * в отведённое место целиком.
 *
 * Колесо мыши приближает страницу к точке под курсором (до четырёх раз), приближённую
 * можно таскать мышью; двойной клик и кнопка сброса возвращают страницу целиком. При
 * листании масштаб сбрасывается, чтобы следующая страница открывалась целиком.
 *
 * Грузится только текущая страница; соседние подгружаются заранее, поэтому листание
 * идёт без ожидания, а все страницы разом в память не тянутся.
 */
export function ComicReader({ pages, pageIndex, onPageChange }: ComicReaderProps): ReactElement {
  const total = pages.length;
  const index = Math.min(Math.max(pageIndex, 0), Math.max(total - 1, 0));
  const page = pages[index];
  const [loadedPageId, setLoadedPageId] = useState<string | null>(null);
  const [view, setView] = useState<PageView>(FIT_VIEW);
  const [isDragging, setDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<PageView>(FIT_VIEW);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    view: PageView;
  } | null>(null);

  const goTo = (next: number): void => {
    if (next >= 0 && next < total) {
      setView(FIT_VIEW);
      onPageChange(next);
    }
  };

  useKeyDown(KEYS.arrowLeft, () => {
    goTo(index - 1);
  });
  useKeyDown(KEYS.arrowRight, () => {
    goTo(index + 1);
  });

  // Соседние страницы: браузер положит их в кеш, пока читают текущую.
  useEffect(() => {
    const neighbours = [pages[index + 1], pages[index - 1]];
    for (const neighbour of neighbours) {
      if (neighbour) {
        const image = new Image();
        image.src = neighbour.src;
      }
    }
  }, [pages, index]);

  // Текущий масштаб для обработчиков мыши: они ставятся один раз и рендеров не видят.
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // Колесо приближает к точке под курсором, перетаскивание двигает приближённую страницу,
  // двойной клик возвращает её целиком. Слушатели свои, а не через React: только
  // не-пассивному можно отменить прокрутку страницы под курсором, а рамка — не кнопка,
  // и вешать на неё интерактивные обработчики в разметке незачем.
  useEffect(() => {
    const frame = frameRef.current;
    if (frame === null) {
      return;
    }
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault();
      const rect = frame.getBoundingClientRect();
      const cursorX = event.clientX - rect.left - rect.width / 2;
      const cursorY = event.clientY - rect.top - rect.height / 2;
      const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      setView((current) => {
        const zoom = clamp(current.zoom * factor, MIN_ZOOM, MAX_ZOOM);
        if (zoom === current.zoom) {
          return current;
        }
        if (zoom === MIN_ZOOM) {
          return FIT_VIEW;
        }
        // Точка под курсором остаётся на месте: сдвиг пересчитывается вокруг неё.
        const ratio = zoom / current.zoom;
        return clampOffset(
          {
            zoom,
            x: cursorX - (cursorX - current.x) * ratio,
            y: cursorY - (cursorY - current.y) * ratio,
          },
          frame,
        );
      });
    };
    const onPointerDown = (event: PointerEvent): void => {
      if (viewRef.current.zoom <= MIN_ZOOM) {
        return;
      }
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        view: viewRef.current,
      };
      try {
        // Держим курсор за рамкой, пока страницу тащат.
        frame.setPointerCapture(event.pointerId);
      } catch {
        // Захват недоступен — перетаскивание просто закончится на краю рамки.
      }
      setDragging(true);
    };

    const onPointerMove = (event: PointerEvent): void => {
      const drag = dragRef.current;
      if (drag?.pointerId !== event.pointerId) {
        return;
      }
      setView(
        clampOffset(
          {
            zoom: drag.view.zoom,
            x: drag.view.x + (event.clientX - drag.startX),
            y: drag.view.y + (event.clientY - drag.startY),
          },
          frame,
        ),
      );
    };

    const onPointerUp = (event: PointerEvent): void => {
      if (dragRef.current?.pointerId === event.pointerId) {
        dragRef.current = null;
        setDragging(false);
      }
    };

    const onDoubleClick = (): void => {
      setView(FIT_VIEW);
    };

    frame.addEventListener('wheel', onWheel, { passive: false });
    frame.addEventListener('pointerdown', onPointerDown);
    frame.addEventListener('pointermove', onPointerMove);
    frame.addEventListener('pointerup', onPointerUp);
    frame.addEventListener('pointercancel', onPointerUp);
    frame.addEventListener('dblclick', onDoubleClick);
    return () => {
      frame.removeEventListener('wheel', onWheel);
      frame.removeEventListener('pointerdown', onPointerDown);
      frame.removeEventListener('pointermove', onPointerMove);
      frame.removeEventListener('pointerup', onPointerUp);
      frame.removeEventListener('pointercancel', onPointerUp);
      frame.removeEventListener('dblclick', onDoubleClick);
    };
  }, []);

  if (!page) {
    return <p className={styles.empty}>{COMIC_TEXT.empty}</p>;
  }

  const pageNumber = index + 1;
  const isZoomed = view.zoom > MIN_ZOOM;
  const pageStyle: PageStyle = {
    transform: `translate(${String(view.x)}px, ${String(view.y)}px) scale(${String(view.zoom)})`,
  };

  return (
    <div className={styles.reader} role="group" aria-label={COMIC_TEXT.readerLabel}>
      <div className={styles.stage}>
        <div
          ref={frameRef}
          className={styles.frame}
          data-zoomed={isZoomed}
          data-dragging={isDragging}
        >
          <img
            key={page.id}
            className={styles.page}
            src={page.src}
            alt={COMIC_TEXT.pageAlt(pageNumber, total)}
            style={pageStyle}
            decoding="async"
            draggable={false}
            data-loaded={loadedPageId === page.id}
            onLoad={() => {
              setLoadedPageId(page.id);
            }}
          />
        </div>
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.navButton}
          aria-label={COMIC_TEXT.previousPage}
          disabled={index === 0}
          onClick={() => {
            goTo(index - 1);
          }}
        >
          <span aria-hidden="true">←</span>
        </button>
        <span className={styles.counter} aria-live="polite">
          {COMIC_TEXT.pageCounter(pageNumber, total)}
        </span>
        <button
          type="button"
          className={styles.navButton}
          aria-label={COMIC_TEXT.nextPage}
          disabled={index === total - 1}
          onClick={() => {
            goTo(index + 1);
          }}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <p className={styles.hint}>
        {isZoomed ? (
          <>
            {COMIC_TEXT.zoomLevel(view.zoom)}
            <button
              type="button"
              className={styles.resetButton}
              onClick={() => {
                setView(FIT_VIEW);
              }}
            >
              {COMIC_TEXT.resetZoom}
            </button>
          </>
        ) : (
          COMIC_TEXT.zoomHint
        )}
      </p>
    </div>
  );
}
