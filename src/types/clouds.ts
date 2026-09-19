/** Сторона, к которой относится облако и за которую оно уезжает при раскрытии. */
export type CloudSide = 'left' | 'right';

/** Состояние облачной шторки: `closed` — облака закрывают экран, `open` — разведены за края. */
export type CloudCurtainState = 'open' | 'closed';

/** Идентификатор картинки облака (см. `CLOUD_IMAGES`). */
export type CloudImageId = 'cloud-01' | 'cloud-02' | 'cloud-03' | 'cloud-04' | 'cloud-05';

/** Положение одного облака в закрытой шторке. Координаты — доли экрана. */
export interface CloudPlacement {
  /** Стабильный ключ облака в разметке. */
  id: string;
  /** Картинка облака. */
  image: CloudImageId;
  /** Левый край, vw (может быть отрицательным — облако заходит за край экрана). */
  leftVw: number;
  /** Верхний край, vh. */
  topVh: number;
  /** Ширина облака, vw. Высота — по пропорциям картинки. */
  widthVw: number;
  /** Отразить картинку по горизонтали — разнообразие без новых файлов. */
  flipped: boolean;
}

/** Мягкое облако на фоне-небе сцены (`SkyAmbientBackdrop`): положение, прозрачность и дрейф. */
export interface AmbientCloudPlacement extends CloudPlacement {
  /** Непрозрачность (0–1): облако бледное, небо сквозь него видно. */
  opacity: number;
  /** Амплитуда медленного дрейфа по горизонтали, vw (знак — направление). */
  driftVw: number;
}
