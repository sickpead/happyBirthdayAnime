import { useEffect, useRef, useState, type ReactElement } from 'react';

import styles from './HubLayoutEditor.module.css';

/** Тексты редактора раскладки. Живут в dev-модуле, чтобы целиком выпадать из бандла. */
const LAYOUT_TEXT = {
  hint: 'Тяните предмет мышью · колесо — размер · Shift+колесо — наклон',
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

/** Выбранный предмет — для панели. */
interface Selection {
  id: string;
  values: ItemValues;
}

const MIN_WIDTH_PERCENT = 0.5;
const WIDTH_STEP_PERCENT = 0.2;
const ROTATE_STEP_DEG = 1;

const round = (value: number): number => Math.round(value * 10) / 10;
const percent = (value: number): string => `${String(round(value))}%`;
const deg = (value: number): string => `${String(round(value))}deg`;
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

/** Собирает готовые к вставке строки конфигов из текущего состояния DOM. */
function buildConfig(frame: HTMLElement): string {
  const rows: Record<ItemGroup, string[]> = { object: [], decor: [], draft: [] };
  for (const element of frame.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) {
    const group = itemGroup(element);
    if (group !== null) {
      rows[group].push(formatRow(group, itemId(element), readValues(element, group)));
    }
  }
  return (['object', 'decor', 'draft'] as const)
    .filter((group) => rows[group].length > 0)
    .map((group) => [CONFIG_HEADINGS[group], ...rows[group]].join('\n'))
    .join('\n\n');
}

/**
 * Редактор раскладки стадии HUB — только для разработки, включается `?layout=1`.
 *
 * Любой предмет стола (кликабельный, декор или лист-черновик) можно перетащить мышью,
 * колесом изменить его ширину, Shift+колесом — наклон. Кнопка «Copy config» кладёт
 * в буфер обмена готовые строки для `deskHubObjects.ts`, `deskHubDecor.ts`
 * и `deskDraftSheets.ts` — остаётся перенести числа в конфиги.
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

  useEffect(() => {
    const frame = document.querySelector<HTMLElement>(FRAME_SELECTOR);
    if (frame === null) {
      return;
    }
    frameRef.current = frame;
    const originals = originalsRef.current;

    // Декор кликов не ловит, поэтому на время редактирования включаем их всем предметам.
    const prepare = (): void => {
      for (const element of frame.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) {
        element.style.pointerEvents = 'auto';
        element.style.cursor = 'move';
        const group = itemGroup(element);
        if (group !== null && !originals.has(element)) {
          originals.set(element, readValues(element, group));
        }
      }
    };
    prepare();

    let dragged: { element: HTMLElement; group: ItemGroup; values: ItemValues } | null = null;
    let origin = { pointerX: 0, pointerY: 0, frameWidth: 1, frameHeight: 1 };

    const closestItem = (target: EventTarget | null): HTMLElement | null =>
      target instanceof Element ? target.closest<HTMLElement>(ITEM_SELECTOR) : null;

    const onPointerDown = (event: PointerEvent): void => {
      prepare();
      const element = closestItem(event.target);
      const group = element === null ? null : itemGroup(element);
      if (element === null || group === null) {
        return;
      }
      event.preventDefault();
      const rect = frame.getBoundingClientRect();
      origin = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        frameWidth: rect.width,
        frameHeight: rect.height,
      };
      dragged = { element, group, values: readValues(element, group) };
      setSelection({ id: itemId(element), values: dragged.values });
      setStatus(null);
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (dragged === null) {
        return;
      }
      const values: ItemValues = {
        ...readValues(dragged.element, dragged.group),
        x: dragged.values.x + ((event.clientX - origin.pointerX) / origin.frameWidth) * 100,
        y: dragged.values.y + ((event.clientY - origin.pointerY) / origin.frameHeight) * 100,
      };
      writeValues(dragged.element, dragged.group, values);
      setSelection({ id: itemId(dragged.element), values });
    };

    const onPointerUp = (): void => {
      dragged = null;
    };

    const onWheel = (event: WheelEvent): void => {
      const element = closestItem(event.target);
      const group = element === null ? null : itemGroup(element);
      if (element === null || group === null) {
        return;
      }
      event.preventDefault();
      const step = -Math.sign(event.deltaY);
      const current = readValues(element, group);
      const values: ItemValues = event.shiftKey
        ? { ...current, rotate: current.rotate + step * ROTATE_STEP_DEG }
        : {
            ...current,
            width: Math.max(MIN_WIDTH_PERCENT, current.width + step * WIDTH_STEP_PERCENT),
          };
      writeValues(element, group, values);
      setSelection({ id: itemId(element), values });
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
      for (const element of frame.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) {
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
      : `${selection.id}: x ${String(round(selection.values.x))} · y ${String(round(selection.values.y))} · w ${String(round(selection.values.width))} · ${String(round(selection.values.rotate))}°`;

  return (
    <div className={styles.panel}>
      <span className={styles.badge}>LAYOUT</span>
      <span className={styles.hint}>{LAYOUT_TEXT.hint}</span>
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
