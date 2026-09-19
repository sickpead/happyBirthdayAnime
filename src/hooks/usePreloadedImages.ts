import { useEffect, useState } from 'react';

/**
 * Состояние предзагрузки картинки:
 * - `pending` — грузится, подождать ещё имеет смысл;
 * - `slow` — всё ещё грузится, но ждать дольше не стоит: показываем как есть;
 * - `ready` — загружена и декодирована, известны настоящие размеры;
 * - `missing` — файла нет или он не декодируется.
 */
export type PreloadedImage =
  | { status: 'pending' }
  | { status: 'slow' }
  | { status: 'ready'; width: number; height: number }
  | { status: 'missing' };

const PENDING: PreloadedImage = { status: 'pending' };
const SLOW: PreloadedImage = { status: 'slow' };
const MISSING: PreloadedImage = { status: 'missing' };

/** Тот же набор ключей, значения преобразованы. */
function mapRecord<Key extends string, From, To>(
  record: Readonly<Record<Key, From>>,
  transform: (value: From) => To,
): Record<Key, To> {
  const keys = Object.keys(record) as Key[];
  return Object.fromEntries(keys.map((key) => [key, transform(record[key])])) as Record<Key, To>;
}

/**
 * Заранее загружает и декодирует картинки, чтобы потом показать их без мигания,
 * и сообщает состояние каждой и её настоящие размеры. Отсутствующий файл —
 * не ошибка приложения: он получает статус `missing`, и вместо него можно показать плейсхолдер.
 *
 * @param sources - URL картинок по ключам. Нужен стабильный объект — например, константа модуля.
 * @param slowAfterMs - Через сколько незагруженная картинка получает статус `slow`, мс.
 * @returns Состояние картинок по тем же ключам.
 */
export function usePreloadedImages<Key extends string>(
  sources: Readonly<Record<Key, string>>,
  slowAfterMs: number,
): Readonly<Record<Key, PreloadedImage>> {
  const [images, setImages] = useState(() => mapRecord(sources, () => PENDING));

  useEffect(() => {
    let isActive = true;
    const update = (key: Key, image: PreloadedImage): void => {
      if (isActive) {
        setImages((current) => ({ ...current, [key]: image }));
      }
    };

    for (const key of Object.keys(sources) as Key[]) {
      const image = new Image();
      image.decoding = 'async';
      image.src = sources[key];
      const loaded = (): PreloadedImage =>
        image.naturalWidth > 0
          ? { status: 'ready', width: image.naturalWidth, height: image.naturalHeight }
          : MISSING;
      // decode() отклоняется и для отсутствующего файла, и для битого — оба случая дают `missing`.
      void image.decode().then(
        () => {
          update(key, loaded());
        },
        () => {
          update(key, loaded());
        },
      );
    }

    const slowTimer = window.setTimeout(() => {
      if (isActive) {
        setImages((current) =>
          mapRecord(current, (image) => (image.status === 'pending' ? SLOW : image)),
        );
      }
    }, slowAfterMs);

    return () => {
      isActive = false;
      window.clearTimeout(slowTimer);
    };
  }, [sources, slowAfterMs]);

  return images;
}
