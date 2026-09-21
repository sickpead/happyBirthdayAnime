import type { AudioTrackId } from '../types';
import { assetUrl } from '../utils/assetUrl';

/** Каталоги статических ассетов внутри `public/`. Имена файлов ассетов — kebab-case. */
export const ASSET_DIRECTORIES = {
  images: 'assets/images',
  videos: 'assets/videos',
  audio: 'assets/audio',
  comic: 'assets/comic',
} as const;

/**
 * Звуки сцен (для предзагрузки). Музыки здесь нет: песня вступления — это первая дорожка
 * фоновой очереди из `vinylTracks.ts`, её заводит `src/audio/playlist.ts`.
 */
export const AUDIO_TRACK_IDS = [
  'needle-drop',
  'crackle',
] as const satisfies readonly AudioTrackId[];

/** URL звуковых дорожек (`public/assets/audio`). */
export const AUDIO_SOURCES: Readonly<Record<AudioTrackId, string>> = {
  'needle-drop': assetUrl(`${ASSET_DIRECTORIES.audio}/needle-drop.mp3`),
  crackle: assetUrl(`${ASSET_DIRECTORIES.audio}/vinyl-crackle.mp3`),
};
