import type { AudioTrackId } from '../types';
import { assetUrl } from '../utils/assetUrl';

/** Каталоги статических ассетов внутри `public/`. Имена файлов ассетов — kebab-case. */
export const ASSET_DIRECTORIES = {
  images: 'assets/images',
  audio: 'assets/audio',
  comic: 'assets/comic',
} as const;

/**
 * URL звуковых дорожек. Сами файлы добавляются на шаге 2; до этого `audioManager`
 * их не загружает, поэтому запросов к несуществующим файлам нет.
 */
export const AUDIO_SOURCES: Readonly<Record<AudioTrackId, string>> = {
  crackle: assetUrl(`${ASSET_DIRECTORIES.audio}/vinyl-crackle.mp3`),
  song: assetUrl(`${ASSET_DIRECTORIES.audio}/birthday-song.mp3`),
};
