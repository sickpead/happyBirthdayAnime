import type { AudioTrackId } from '../types';
import { assetUrl } from '../utils/assetUrl';

/** Каталоги статических ассетов внутри `public/`. Имена файлов ассетов — kebab-case. */
export const ASSET_DIRECTORIES = {
  images: 'assets/images',
  videos: 'assets/videos',
  audio: 'assets/audio',
  comic: 'assets/comic',
} as const;

/** Все звуковые дорожки приложения (для предзагрузки). */
export const AUDIO_TRACK_IDS = [
  'needle-drop',
  'crackle',
  'song',
] as const satisfies readonly AudioTrackId[];

/** URL звуковых дорожек (`public/assets/audio`). */
export const AUDIO_SOURCES: Readonly<Record<AudioTrackId, string>> = {
  'needle-drop': assetUrl(`${ASSET_DIRECTORIES.audio}/needle-drop.mp3`),
  crackle: assetUrl(`${ASSET_DIRECTORIES.audio}/vinyl-crackle.mp3`),
  song: assetUrl(`${ASSET_DIRECTORIES.audio}/happy-birthday.mp3`),
};
