import { useEffect, useRef, useState, type ReactElement } from 'react';

import styles from './HubLayoutEditor.module.css';

/** Тексты редактора раскладки. Живут в dev-модуле, чтобы целиком выпадать из бандла. */
const LAYOUT_TEXT = {
  hint: 'Тяните предмет мышью · колесо — размер · Shift+колесо — наклон',
  vinylHint: 'Диск проигрывателя: тяните его же · колесо — диаметр · Shift — наклон · Alt — перспектива',
  nothing: 'предмет не выбран',
  copy: 'Copy config',
  reset: 'Сбросить',
  copied: 'скопировано в буфер',
  copyFailed: 'буфер недоступен — текст выделен, нажмите Ctrl+C',
  configLabel: 'Готовые строки конфигов',
} as const;

/** Кадр стадии HUB: внутри него лежат все предметы, декор и листы. */
const FRAME_SELECTOR = '[data-desk-frame="hub"]';

/** Всё, что можно двигать: кликабельные предметы, декор и листы-черновики. */
const ITEM_SELECTOR = '[data-desk-object], [data-desk-decor], [data-desk-draft]';

/**
 * Пластинка на проигрывателе — не отдельный предмет, а слой внутри него, поэтому и правится
 * отдельно: у неё свои проценты (центр и диаметр от картинки корпуса), наклон и перспектива.
 */
const VINYL_SELECTOR = '[data-desk-vinyl]';

/** Откуда предмет: у каждого конфига свой формат записи и свой якорь координат. */
type ItemGroup = 'object' | 'decor' | 'draft';

/** Текущее положение предмета в процентах картинки стола. */
interface ItemValues {
  /** Левый край (`object`) или центр (`decor`, `draft`), % ширины. */
  x: number;
  /** Верхний край (`object`) или центр (`decor`, `draft`), % высоты. */
  y: number;
  /** Ширина, % ширины. */
  width: number;
  /** Наклон, градусы. */
  rotate: number;
}

/** Текущее положение пластинки в процентах картинки корпуса (см. `DeskHubVinylPlacement`). */
interface VinylValues {
  /** Центр диска, % ширины корпуса. */
  centerX: number;
  /** Центр диска, % высоты корпуса. */
  centerY: number;
  /** Диаметр диска, % ширины корпуса. */
  diameter: number;
  /** Наклон от зрителя, градусы. */
  tilt: number;
  /** Расстояние до зрителя, px. */
  perspective: number;
}

/** Выбранный предмет или пластинка — для панели. */
type Selection =
  | { kind: 'item'; id: string; values: ItemValues }
  | { kind: 'vinyl'; id: string; values: VinylValues };

const MIN_WIDTH_PERCENT = 0.5;
const WIDTH_STEP_PERCENT = 0.2;
const ROTATE_STEP_DEG = 1;
const MIN_DIAMETER_PERCENT = 1;
const DIAMETER_STEP_PERCENT = 0.2;
const TILT_STEP_DEG = 1;
const MIN_PERSPECTIVE_PX = 100;
const PERSPECTIVE_STEP_PX = 50;

const round = (value: number): number => Math.round(value * 10) / 10;
const percent = (value: number): string => `${String(round(value))}%`;
const deg = (value: number): string => `${String(round(value))}deg`;
const px = (value: number): string => `${String(Math.round(value))}px`;
const parse = (value: string): number => Number.parseFloat(value) || 0;

function itemGroup(element: HTMLElement): ItemGroup | null {
  if (element.dataset.deskObject !== undefined) {
    return 'object';
  }
  if (element.dataset.deskDecor !== undefined) {
    return 'decor';
  }
  return element.dataset.deskDraft === undefined ? null : 'draft';
}

function itemId(element: HTMLElement): string {
  return element.dataset.deskObject ?? element.dataset.deskDecor ?? element.dataset.deskDraft ?? '';
}

/** Предметы и листы держат наклон в CSS-переменной, декор — в свойстве `rotate`. */
function readValues(element: HTMLElement, group: ItemGroup): ItemValues {
  return {
    x: parse(element.style.left),
    y: parse(element.style.top),
    width: parse(element.style.width),
    rotate: parse(
      group === 'decor'
        ? element.style.rotate
        : element.style.getPropertyValue('--rest-rotation-deg'),
    ),
  };
}

function writeValues(element: HTMLElement, group: ItemGroup, values: ItemValues): void {
  element.style.left = percent(values.x);
  element.style.top = percent(values.y);
  element.style.width = percent(values.width);
  if (group === 'decor') {
    element.style.rotate = deg(values.rotate);
  } else {
    element.style.setProperty('--rest-rotation-deg', deg(values.rotate));
  }
}

/** Пластинка держит всю свою геометрию в CSS-переменных — их и читаем. */
function readVinyl(element: HTMLElement): VinylValues {
  return {
    centerX: parse(element.style.getPropertyValue('--vinyl-center-x')),
    centerY: parse(element.style.getPropertyValue('--vinyl-center-y')),
    diameter: parse(element.style.getPropertyValue('--vinyl-diameter')),
    tilt: parse(element.style.getPropertyValue('--vinyl-tilt')),
    perspective: parse(element.style.getPropertyValue('--vinyl-persp')),
  };
}

function writeVinyl(element: HTMLElement, values: VinylValues): void {
  element.style.setProperty('--vinyl-center-x', percent(values.centerX));
  element.style.setProperty('--vinyl-center-y', percent(values.centerY));
  element.style.setProperty('--vinyl-diameter', percent(values.diameter));
  element.style.setProperty('--vinyl-tilt', deg(values.tilt));
  element.style.setProperty('--vinyl-persp', px(values.perspective));
}

/**
 * Проценты пластинки считаются от картинки корпуса, а не от всего стола, поэтому тащим её
 * относительно ближайшего позиционированного родителя — слоя составного предмета.
 */
function vinylBox(element: HTMLElement): HTMLElement {
  return element.offsetParent instanceof HTMLElement ? element.offsetParent : element;
}

function formatRow(group: ItemGroup, id: string, values: ItemValues): string {
  const head = `{ id: '${id}', xPercent: ${String(round(values.x))}, yPercent: ${String(round(values.y))}, widthPercent: ${String(round(values.width))}`;
  const rotate = round(values.rotate);
  if (group === 'draft') {
    return `${head}, rotateDeg: ${String(rotate)} },`;
  }
  if (rotate === 0) {
    return `${head} },`;
  }
  return `${head}, ${group === 'decor' ? 'rotateDeg' : 'restRotationDeg'}: ${String(rotate)} },`;
}

const CONFIG_HEADINGS: Readonly<Record<ItemGroup, string>> = {
  object: '// deskHubObjects.ts — xPercent/yPercent: левый верхний угол слоя',
  decor: '// deskHubDecor.ts — xPercent/yPercent: центр предмета',
  draft: '// deskDraftSheets.ts — xPercent/yPercent: центр листа',
};

/** Блок `layers.vinyl` предмета — ровно в том виде, в каком он лежит в `deskHubObjects.ts`. */
function formatVinyl(id: string, values: VinylValues): string {
  return [
    `// deskHubObjects.ts — ${id}.layers.vinyl`,
    'vinyl: {',
    `  centerXPercent: ${String(round(values.centerX))},`,
    `  centerYPercent: ${String(round(values.centerY))},`,
    `  diameterPercent: ${String(round(values.diameter))},`,
    `  tiltDeg: ${String(round(values.tilt))},`,
    `  perspectivePx: ${String(Math.round(values.perspective))},`,
    '},',
  ].join('\n');
}

/** Собирает готовые к вставке строки конфигов из текущего состояния DOM. */
function buildConfig(frame: HTMLElement): string {
  const rows: Record<ItemGroup, string[]> = { object: [], decor: [], draft: [] };
  for (const element of frame.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) {
    const group = itemGroup(element);
    if (group !== null) {
      rows[group].push(formatRow(group, itemId(element), readValues(element, group)));
    }
  }
  const sections = (['object', 'decor', 'draft'] as const)
    .filter((group) => rows[group].length > 0)
    .map((group) => [CONFIG_HEADINGS[group], ...rows[group]].join('\n'));
  for (const element of frame.querySelectorAll<HTMLElement>(VINYL_SELECTOR)) {
    sections.push(formatVinyl(element.dataset.deskVinyl ?? '', readVinyl(element)));
  }
  return sections.join('\n\n');
}

/**
 * Редактор раскладки стадии HUB — только для разработки, включается `?layout=1`.
 *
 * Любой предмет стола (кликабельный, декор или лист-черновик) можно перетащить мышью,
 * колесом изменить его ширину, Shift+колесом — наклон.
 *
 * Пластинка проигрывателя правится отдельно от него: возьмитесь мышью за сам диск —
 * перетаскивание двигает его центр, колесо меняет диаметр, Shift+колесо — наклон,
 * Alt+колесо — перспективу. Чтобы подвинуть весь проигрыватель, беритесь за корпус
 * мимо диска.
 *
 * Кнопка «Copy config» кладёт в буфер обмена готовые строки для `deskHubObjects.ts`
 * (включая блок `layers.vinyl`), `deskHubDecor.ts` и `deskDraftSheets.ts` — остаётся
 * перенести числа в конфиги.
 *
 * Редактор работает прямо по DOM и ничего не знает про React-состояние сцены, поэтому
 * пока он включён, клики по предметам не открывают модалки: перерисовка вернула бы
 * предметы на места из конфига. Чтобы проверить модалки, откройте страницу без `?layout=1`.
 */
export default function HubLayoutEditor(): ReactElement | null {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [config, setConfig] = useState<string | null>(null);
  const frameRef = useRef<HTMLElement | null>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const originalsRef = useRef(new Map<HTMLElement, ItemValues>());
  const vinylOriginalsRef = useRef(new Map<HTMLElement, VinylValues>());

  useEffect(() => {
    const frame = document.querySelector<HTMLElement>(FRAME_SELECTOR);
    if (frame === null) {
      return;
    }
    frameRef.current = frame;
    const originals = originalsRef.current;
    const vinylOriginals = vinylOriginalsRef.current;

    // Декор и пластинка кликов не ловят, поэтому на время редактирования включаем их всем.
    const prepare = (): void => {
      for (const element of frame.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) {
        element.style.pointerEvents = 'auto';
        element.style.cursor = 'move';
        const group = itemGroup(element);
        if (group !== null && !originals.has(element)) {
          originals.set(element, readValues(element, group));
        }
      }
      for (const element of frame.querySelectorAll<HTMLElement>(VINYL_SELECTOR)) {
        element.style.pointerEvents = 'auto';
        element.style.cursor = 'move';
        if (!vinylOriginals.has(element)) {
          vinylOriginals.set(element, readVinyl(element));
        }
      }
    };
    prepare();

    let dragged:
      | { kind: 'item'; element: HTMLElement; group: ItemGroup; values: ItemValues }
      | { kind: 'vinyl'; element: HTMLElement; values: VinylValues }
      | null = null;
    let origin = { pointerX: 0, pointerY: 0, boxWidth: 1, boxHeight: 1 };

    const closestItem = (target: EventTarget | null): HTMLElement | null =>
      target instanceof Element ? target.closest<HTMLElement>(ITEM_SELECTOR) : null;

    const closestVinyl = (target: EventTarget | null): HTMLElement | null =>
      target instanceof Element ? target.closest<HTMLElement>(VINYL_SELECTOR) : null;

    const startDrag = (event: PointerEvent, box: HTMLElement): void => {
      const rect = box.getBoundingClientRect();
      origin = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        boxWidth: rect.width,
        boxHeight: rect.height,
      };
    };

    const onPointerDown = (event: PointerEvent): void => {
      prepare();
      // Пластинка лежит внутри кнопки проигрывателя, поэтому проверяем её первой:
      // взялись за диск — правим диск, взялись за корпус рядом — двигаем весь предмет.
      const vinyl = closestVinyl(event.target);
      if (vinyl !== null) {
        event.preventDefault();
        startDrag(event, vinylBox(vinyl));
        const values = readVinyl(vinyl);
        dragged = { kind: 'vinyl', element: vinyl, values };
        setSelection({ kind: 'vinyl', id: vinyl.dataset.deskVinyl ?? '', values });
        setStatus(null);
        return;
      }
      const element = closestItem(event.target);
      const group = element === null ? null : itemGroup(element);
      if (element === null || group === null) {
        return;
      }
      event.preventDefault();
      startDrag(event, frame);
      dragged = { kind: 'item', element, group, values: readValues(element, group) };
      setSelection({ kind: 'item', id: itemId(element), values: dragged.values });
      setStatus(null);
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (dragged === null) {
        return;
      }
      const shiftX = ((event.clientX - origin.pointerX) / origin.boxWidth) * 100;
      const shiftY = ((event.clientY - origin.pointerY) / origin.boxHeight) * 100;
      if (dragged.kind === 'vinyl') {
        const values: VinylValues = {
          ...readVinyl(dragged.element),
          centerX: dragged.values.centerX + shiftX,
          centerY: dragged.values.centerY + shiftY,
        };
        writeVinyl(dragged.element, values);
        setSelection({ kind: 'vinyl', id: dragged.element.dataset.deskVinyl ?? '', values });
        return;
      }
      const values: ItemValues = {
        ...readValues(dragged.element, dragged.group),
        x: dragged.values.x + shiftX,
        y: dragged.values.y + shiftY,
      };
      writeValues(dragged.element, dragged.group, values);
      setSelection({ kind: 'item', id: itemId(dragged.element), values });
    };

    const onPointerUp = (): void => {
      dragged = null;
    };

    const onWheel = (event: WheelEvent): void => {
      const step = -Math.sign(event.deltaY);
      const vinyl = closestVinyl(event.target);
      if (vinyl !== null) {
        event.preventDefault();
        const current = readVinyl(vinyl);
        const values: VinylValues = event.shiftKey
          ? { ...current, tilt: current.tilt + step * TILT_STEP_DEG }
          : event.altKey
            ? {
                ...current,
                perspective: Math.max(
                  MIN_PERSPECTIVE_PX,
                  current.perspective + step * PERSPECTIVE_STEP_PX,
                ),
              }
            : {
                ...current,
                diameter: Math.max(
                  MIN_DIAMETER_PERCENT,
                  current.diameter + step * DIAMETER_STEP_PERCENT,
                ),
              };
        writeVinyl(vinyl, values);
        setSelection({ kind: 'vinyl', id: vinyl.dataset.deskVinyl ?? '', values });
        setStatus(null);
        return;
      }
      const element = closestItem(event.target);
      const group = element === null ? null : itemGroup(element);
      if (element === null || group === null) {
        return;
      }
      event.preventDefault();
      const current = readValues(element, group);
      const values: ItemValues = event.shiftKey
        ? { ...current, rotate: current.rotate + step * ROTATE_STEP_DEG }
        : {
            ...current,
            width: Math.max(MIN_WIDTH_PERCENT, current.width + step * WIDTH_STEP_PERCENT),
          };
      writeValues(element, group, values);
      setSelection({ kind: 'item', id: itemId(element), values });
      setStatus(null);
    };

    // Пока редактор включён, клики по предметам гасим: перерисовка сбросила бы раскладку.
    const onClickCapture = (event: MouseEvent): void => {
      if (closestItem(event.target) !== null) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    frame.addEventListener('pointerdown', onPointerDown);
    frame.addEventListener('wheel', onWheel, { passive: false });
    frame.addEventListener('click', onClickCapture, true);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      frame.removeEventListener('pointerdown', onPointerDown);
      frame.removeEventListener('wheel', onWheel);
      frame.removeEventListener('click', onClickCapture, true);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      for (const element of frame.querySelectorAll<HTMLElement>(
        `${ITEM_SELECTOR}, ${VINYL_SELECTOR}`,
      )) {
        element.style.pointerEvents = '';
        element.style.cursor = '';
      }
      frameRef.current = null;
    };
  }, []);

  // Текст показываем всегда: в буфер он попадает не везде (встроенные браузеры его блокируют).
  const copyConfig = (): void => {
    const frame = frameRef.current;
    if (frame === null) {
      return;
    }
    const text = buildConfig(frame);
    setConfig(text);
    void navigator.clipboard.writeText(text).then(
      () => {
        setStatus(LAYOUT_TEXT.copied);
      },
      () => {
        setStatus(LAYOUT_TEXT.copyFailed);
      },
    );
  };

  const resetLayout = (): void => {
    for (const [element, values] of originalsRef.current) {
      const group = itemGroup(element);
      if (group !== null) {
        writeValues(element, group, values);
      }
    }
    for (const [element, values] of vinylOriginalsRef.current) {
      writeVinyl(element, values);
    }
    setSelection(null);
    setStatus(null);
    setConfig(null);
  };

  // Текст сразу выделен, чтобы его можно было забрать Ctrl+C, даже если буфер недоступен.
  useEffect(() => {
    if (config !== null) {
      outputRef.current?.select();
    }
  }, [config]);

  const summary =
    selection === null
      ? LAYOUT_TEXT.nothing
      : selection.kind === 'vinyl'
        ? `${selection.id} · диск: центр ${String(round(selection.values.centerX))} / ${String(round(selection.values.centerY))} · ⌀ ${String(round(selection.values.diameter))} · наклон ${String(round(selection.values.tilt))}° · персп. ${String(Math.round(selection.values.perspective))}px`
        : `${selection.id}: x ${String(round(selection.values.x))} · y ${String(round(selection.values.y))} · w ${String(round(selection.values.width))} · ${String(round(selection.values.rotate))}°`;

  return (
    <div className={styles.panel}>
      <span className={styles.badge}>LAYOUT</span>
      <span className={styles.hint}>{LAYOUT_TEXT.hint}</span>
      <span className={styles.hint}>{LAYOUT_TEXT.vinylHint}</span>
      <span className={styles.value}>{summary}</span>
      <button type="button" className={styles.button} onClick={copyConfig}>
        {LAYOUT_TEXT.copy}
      </button>
      <button type="button" className={styles.button} onClick={resetLayout}>
        {LAYOUT_TEXT.reset}
      </button>
      {status !== null && <span className={styles.status}>{status}</span>}
      {config !== null && (
        <textarea
          ref={outputRef}
          className={styles.output}
          value={config}
          aria-label={LAYOUT_TEXT.configLabel}
          rows={8}
          readOnly
        />
      )}
    </div>
  );
}
