import type { VinylTrack } from '../types';
import { assetUrl } from '../utils/assetUrl';
import { ASSET_DIRECTORIES } from './assets';

/** Каталог дорожек из стопки пластинок внутри `public/`. */
export const VINYL_TRACK_DIRECTORY = `${ASSET_DIRECTORIES.audio}/vinyl`;

/**
 * Дорожки, которые открывает стопка пластинок на столе. Порядок в массиве — порядок
 * в списке и обхода клавишей Tab.
 *
 * Как добавить свою: положить файл (mp3, ogg или m4a) в `public/assets/audio/vinyl/`
 * и дописать сюда запись — `title`, необязательный `artist` и `src` через `assetUrl`.
 * Имена файлов — kebab-case, как и у остальных ассетов. Кода это не касается: список
 * рисуется целиком из этого массива, а пустой массив показывает подсказку вместо списка.
 *
 * Сейчас в списке одна дорожка — та же песня, что звучит фоном с вступления; она лежит
 * не в `vinyl/`, а рядом с остальными звуками сцен.
 */
export const VINYL_TRACKS: readonly VinylTrack[] = [
  {
    id: 'happy-birthday',
    title: 'С днём рождения',
    artist: 'Песня из вступления',
    src: assetUrl(`${ASSET_DIRECTORIES.audio}/happy-birthday.mp3`),
  },
];
